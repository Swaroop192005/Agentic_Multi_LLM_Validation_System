/**
 * deliverables/report/chapters_4_7.js
 * -----------------------------------
 * Chapters 4-7: Implementation, Experiments and Results, Conclusion,
 * Future Scope.
 *
 * Chapter 5 is the substantive chapter and carries the generated figures.
 * Every number in it is sourced from the repository - RESEARCH_LOG.md sections
 * 1-37, training/optimal_threshold_roc.py and training/combiner_bias_analysis.py
 * - and the figures are produced by make_figures.py importing those same
 * analysis functions, so text and plates cannot drift apart.
 */

const CH4 = {
  title: "Implementation",
  sections: [
    {
      heading: "Technology Stack",
      bullets: [
        "Model runtime: Ollama, serving all six models locally over HTTP on the loopback interface.",
        "Orchestration: Python with asyncio; LangChain's Ollama binding wraps each agent behind a uniform interface.",
        "Web service: FastAPI, streaming pipeline progress to the browser over Server-Sent Events.",
        "Embeddings: sentence-transformers with all-MiniLM-L6-v2, executed on GPU.",
        "Persistence: SQLite, one row per attempt, retaining every raw signal rather than only the outcome.",
        "Frontend: dependency-free HTML, CSS and JavaScript consuming the event stream directly.",
        "Analysis: NumPy, SciPy and Matplotlib for the statistics and figures in Chapter 5.",
        "Hardware: a single workstation with an NVIDIA RTX 4090 (24 GB VRAM).",
      ],
    },
    {
      heading: "Agent Abstraction",
      paras: [
        `Every agent is an instance of one small class holding a role name, a model identifier, a decoding temperature, a token budget and a system prompt, exposing a single run method that takes a prompt and returns text. Specialisation lives entirely in configuration and prompt, not in code.`,
        `This uniformity is what made the experiments in Chapter 5 cheap to run. Swapping the Combiner from one model to another is a one-line change, and the controlled replay described in Section 5.9 - which re-runs the Combiner alone across hundreds of stored records with every other input frozen - is possible precisely because the agent has no hidden state and no dependency on the rest of the pipeline beyond its prompt.`,
        `One agent carries an extra flag. Hybrid-reasoning models such as qwen3.5 support an internal deliberation phase that must be explicitly disabled; the abstraction exposes this as an optional parameter which is simply ignored by models that do not understand it.`,
      ],
    },
    {
      heading: "Prompt Design",
      paras: [
        `Generator prompts ask for a thorough, well-structured, factually accurate answer and nothing more. They do not mention the existence of a second generator, an evaluator or a rubric; a generator that knew it was being scored against criteria would optimise for the criteria rather than for the answer.`,
        `Evaluator prompts present the question and both candidate answers, labelled only as "Answer 1" and "Answer 2", followed by the eight criteria with their definitions and a required output format: a score out of ten and a one-sentence justification per criterion, per answer. The Judge's prompt additionally asks for an overall winner and a short reasoning paragraph.`,
        `The Combiner's prompt supplies the question, both answers, the Verifier's output and the Judge's output, and instructs the model to merge the best elements, remove anything the Verifier flagged, introduce no new information, and produce at most 150 words.`,
        `One detail of that prompt turned out to matter a great deal and is easy to get wrong. The Verifier and Judge outputs are free text that refers to the answers by label - the Judge's reasoning paragraph names "Answer 1" explicitly. If the answers are presented to the Combiner in a different order from the one the evaluators saw, those labels point at the wrong text. Section 5.10 records that exactly this defect was present in the live service for the whole of the project.`,
      ],
    },
    {
      heading: "Concurrency and Memory Constraints",
      paras: [
        `The six models together substantially exceed the 24 GB of available video memory if resident simultaneously. The pipeline therefore runs with a concurrency of one and relies on the runtime to load and evict model weights as stages execute.`,
        `An earlier configuration ran the Verifier and the Judge concurrently, since neither depends on the other's output. This produced memory over-subscription stalls: both models' weights were requested at once, the runtime began evicting and reloading in a loop, and throughput collapsed. The two are now deliberately sequential despite the available parallelism, which costs latency and buys reliability.`,
        `Stages 1 and 2 do run concurrently, and stages 3 and 4 likewise, because in each case one of the pair is cheap - the second generator shares a loaded family, and the similarity scorer is a 22-million-parameter encoder rather than a billion-parameter model.`,
      ],
    },
    {
      heading: "Streaming Interface",
      paras: [
        `A complete pipeline run takes on the order of one to two minutes, and considerably longer under memory contention. A conventional request-response interface would present the user with an unexplained pause of that length, which is unacceptable for a demonstration and unhelpful for debugging.`,
        `The service instead emits a typed event as each stage begins and completes. The frontend renders the pipeline filling in progressively: each generator's answer as it arrives, the Verifier's and Judge's rubric breakdowns, each signal's contribution, the weighted score for the attempt, and - where the gate fails - an explicit banner naming the score and the threshold it missed.`,
        `The interface is therefore not only a demonstration surface but the primary debugging tool for the pipeline's behaviour. Several of the anomalies investigated in Chapter 5 were first noticed as something looking wrong on this screen rather than in a log file.`,
      ],
      figure: "interface",
    },
    {
      heading: "The Event Protocol",
      paras: [
        `The service emits four event types over the Server-Sent Events stream, and the frontend is a state machine over them.`,
        `A stage event announces that a numbered stage has begun, carrying the stage index, its display name and a status. A result event carries that stage's output - a generated answer, an evaluator's raw text, a computed signal. A regenerate event fires when the gate rejects an attempt, carrying the score that failed and the threshold it missed, so that the reason is visible rather than inferred from a restarting progress bar. A done event closes the stream with the total elapsed time.`,
        `Periodic comment lines are emitted as keep-alives. Without them an intermediary can close a connection that has been quiet for the length of a model call, which on a contended host can exceed a minute.`,
        `Streaming the reason for a regeneration rather than only the fact of one turned out to matter for the project rather than only for the user. Several anomalies investigated in Chapter 5 were first noticed as a score that looked wrong next to the threshold it was being compared against.`,
      ],
    },
    {
      heading: "Frontend",
      paras: [
        `The frontend is dependency-free HTML, CSS and JavaScript - no framework, no build step. The choice was practical: the page is served from the same process as the API, it has one job, and a build step would have added an obligation without adding a capability.`,
        `It renders a stage rail that fills as events arrive, per-answer cards for the two candidates, a breakdown of each evaluator's rubric scores, a chip per confidence signal showing its value and contribution, and a gauge for the weighted score. Each attempt's score is appended persistently rather than replaced, so a question that regenerated twice shows all three scores in sequence and the reader can see whether the loop was helping.`,
        `A rolling context drawer exposes the last few queries and their answers, which are injected into subsequent prompts to provide continuity across questions.`,
      ],
    },
    {
      heading: "Retrieval Store",
      paras: [
        `Uploaded documents are chunked, embedded with the same encoder used for the similarity signal, and stored in a local table alongside their source filename and offset. Retrieval embeds the question and ranks chunks by cosine similarity.`,
        `Only chunks above the minimum similarity threshold are injected, and the decision is logged per query: whether context was used, how many chunks, and the similarity of the best match. The logging exists specifically so that the threshold can later be calibrated by the control-group method rather than left at its inspected value, as described in Chapter 8.`,
        `When context is injected it is prepended to both generator prompts and to the Verifier prompt, and the Context Relevance criterion is scored against it. When no context clears the threshold, that criterion falls back to assessing whether the answer stays on topic - which is why the rubric defines it in two parts.`,
      ],
    },
    {
      heading: "Data Model",
      paras: [
        `Each attempt is stored as one row. The row carries the question and its index, the attempt number, both candidate answers, the true model-to-position mapping, every per-criterion score from both evaluators for both answers, the declared winner, all six confidence signals, the weighted score, the reason the attempt was regenerated if it was, and the elapsed time. The final attempt for a question additionally carries the combined answer and is flagged as final.`,
        `Storing every raw signal for every attempt rather than only the outcome is what makes the analyses in Chapter 5 possible. The combiner bias investigation needed to reconstruct exactly what each evaluator saw and in what order, months after the run completed; a schema that had retained only final answers and final scores would have made that investigation impossible without regenerating the entire corpus.`,
        `A subtle defect in how rows were marked final is documented in Section 5.10, because it illustrates a class of bug that silently corrupts aggregate statistics without producing any error.`,
      ],
    },
    {
      heading: "Dataset Generation Harness",
      paras: [
        `A batch harness runs the full pipeline over a question corpus and writes one row per attempt. It is restartable: it records which question indices are complete and resumes from the first incomplete one, because a run spanning several days is interrupted in practice by reboots, driver updates and power events.`,
        `The harness also implements the control group described in Section 5.7. With a configured probability, an attempt that has already passed the confidence gate is regenerated anyway, purely to produce an observation that the gate would otherwise censor. These rows are marked with a distinct regeneration reason so that the analysis can weight them correctly.`,
        `That probability was changed mid-run, from 0.08 to 0.60, to accumulate control observations faster once it became clear how few the lower rate was yielding. The change is innocuous operationally and a trap analytically; Section 5.10 records the error it caused and the correction.`,
      ],
    },
    {
      heading: "Operational Incidents",
      paras: [
        `Three classes of failure dominated the run, and all three are specific to orchestrating several large models on one machine rather than to anything about language models. They are recorded because each cost real time and none is documented in the frameworks' own guidance.`,
        `Orphaned inference subprocesses. The model runtime spawns a child inference process per loaded model. On Windows these children survive a normal restart of their parent, because there is no cascade kill, so every manual restart silently left one behind holding video memory. They accumulated across restarts until the next evaluator call wedged for want of VRAM. The symptom - an intermittent hang that got more frequent the longer the day went on - pointed at the models rather than at process hygiene, which is why it took a while to find. The watchdog now enumerates and kills the inference children directly rather than only their parent.`,
        `Racing watchdogs. Stopping the monitoring harness did not reliably terminate the underlying shell, so multiple watchdog instances accumulated and competed, each launching its own generator. The result was duplicate work and a corrupted sense of progress. Watchdogs are now killed by process id rather than by asking the harness to stop them.`,
        `Silent total stoppage. Three separate gaps occurred - 17 hours, 40 minutes, and four full days - in which every pipeline process had died and only the model runtime remained. The cause was that all of them, including the watchdog, were launched from within an interactive session's process tree, which does not survive terminal closure, session teardown, or the machine sleeping. A keep-awake routine blocked automatic idle sleep but not manual sleep or session loss. Each gap was discovered only when somebody next looked.`,
        `The common thread is that a watchdog inside the thing it is watching is not a watchdog. The fix was to move supervision entirely outside the session, into a scheduled task that the operating system runs whether or not anyone is logged into a terminal.`,
      ],
    },
    {
      heading: "Resilience",
      paras: [
        `Three separate multi-hour gaps in generation occurred before resilience was addressed, caused by terminal closure, session teardown and the machine sleeping. In each case the harness had stopped and nothing restarted it, and the loss was discovered only when progress was next inspected.`,
        `A scheduled task external to any interactive session now checks every five minutes that the required processes are alive and restarts any that are not. The check matches on process command line rather than on a stored process identifier, so it survives the restarts it performs.`,
        `This is unglamorous engineering, and it is reported here because a multi-day unattended experimental run is not achievable without it. The 5,000-question corpus that Chapter 5 rests on would not exist otherwise.`,
        `One lesson from operating it is worth recording. When the generator finished, the watchdog continued restarting it every five minutes; each restart re-scanned 5,000 completed questions, found nothing to do, and exited. The behaviour was harmless but wasteful, and it was removed from the watch list once generation completed. A watchdog needs a notion of "done", not only a notion of "running".`,
      ],
    },
  ],
};

const CH5 = {
  title: "Experiments and Results",
  sections: [
    {
      heading: "Experimental Setup",
      paras: [
        `A corpus of 5,000 questions spanning ten knowledge domains was generated and processed through the complete pipeline, producing 8,432 attempt records of which 5,000 are final answers. All statistics in this chapter are computed over this corpus unless stated otherwise, and all figures are generated directly from it.`,
      ],
      table: {
        caption: "Table 5.1: Corpus composition",
        head: ["Property", "Value"],
        rows: [
          ["Questions", "5,000"],
          ["Knowledge domains", "10"],
          ["Total attempt records", "8,432"],
          ["Final answers", "5,000"],
          ["First attempts", "5,005"],
          ["Second attempts", "2,001"],
          ["Third attempts", "1,426"],
          ["Mean attempts per question", "1.69"],
          ["Maximum attempts permitted", "3"],
          ["Control-group regenerations", "165"],
        ],
      },
      figure: "dataset",
    },
    {
      heading: "Corpus Characteristics",
      paras: [
        `The distribution of the weighted confidence score is unimodal and moderately tight, with a mean of 0.702 across all attempts and a range from 0.307 to 0.856. The final answers sit visibly to the right of the full attempt distribution, which is the regeneration loop working as intended: weaker attempts are replaced, so the surviving population is better than the population that was generated.`,
        `Against the adopted threshold of 0.72, 1,849 of the 5,000 final answers - 37.0 per cent - still fall below it. This is not a failure of the gate. It is the attempt bound being reached: those questions were regenerated up to the permitted maximum and did not clear the threshold, so the best available attempt was shipped. The figure is a useful honesty check on the system, since it quantifies how often the pipeline ships an answer it is not confident in.`,
      ],
      figure: "score_distribution",
    },
    {
      heading: "Regeneration Behaviour",
      paras: [
        `Of the 8,432 attempt records, 4,163 were regenerated because they fell below the confidence gate, 165 were regenerated as control samples despite passing it, and 4,104 were not regenerated at all. The mean number of attempts per question is 1.69, so the regeneration loop roughly doubles the computational cost of the pipeline relative to a single-pass system.`,
        `That cost is the price of the quality mechanism, and it is worth stating plainly rather than burying: this system is slower than a single model answering once, by roughly the factor its attempt distribution implies, plus the cost of four evaluation stages. It buys a calibrated confidence score and an automatic second chance.`,
      ],
      figure: "attempts",
    },
    {
      heading: "Does Regeneration Improve the Answer?",
      paras: [
        `The regeneration loop is the system's only corrective mechanism, and the report has so far described how often it fires without establishing that it works. Of the 5,000 questions, 2,004 produced two or more attempts, which permits a direct before-and-after comparison on the same question.`,
      ],
      table: {
        caption: "Table 5.9: Score change across regeneration attempts",
        head: ["Transition", "n", "Mean change", "Median change", "Improved"],
        rows: [
          ["Attempt 1 → attempt 2", "2,004", "+0.0130", "+0.0136", "59.3%"],
          ["Attempt 2 → attempt 3", "1,427", "+0.0132", "+0.0117", "—"],
        ],
      },
      paras2: [
        `Regeneration helps on average, and the effect is consistent across both transitions: roughly +0.013 on a zero-to-one scale each time. In the context of a threshold at 0.72 and a corpus standard deviation of 0.044, that is a modest but real shift - about three tenths of a standard deviation over two retries.`,
        `The more important number is the one that is not an average. A second attempt improved on the first in only 59.3 per cent of cases, which means that in 40.7 per cent the retry produced a worse answer than the one it was meant to replace. Regeneration is not a reliable repair; it is a resample from a distribution whose mean is slightly higher.`,
        `That finding is what justifies a design decision made earlier on intuition. The pipeline retains the highest-scoring attempt rather than the most recent one, and the corpus shows how much work that rule does: the best attempt was the last attempt in only 56.8 per cent of multi-attempt questions. In the remaining 43.2 per cent, a system that simply shipped its latest retry would have shipped a worse answer than one it had already produced and discarded.`,
        `Stated plainly, nearly half the value of the regeneration loop comes not from regenerating but from remembering. This is worth emphasising because the obvious implementation - overwrite and retry until the gate passes or the budget runs out - would have discarded that value silently, and no aggregate statistic would have revealed the loss.`,
      ],
    },
    {
      heading: "Judge Selection: Four Models and a Methodology Error",
      paras: [
        `Selecting the Judge took four candidate models and two false starts, and the sequence is reported in full because the criterion that eventually worked is not the one that would be chosen by default.`,
        `The first question was whether the ceiling-clustering of Section 5.6 was specific to the incumbent model. Four further format-compatible models were run on an identical prompt and the same real question-answer pair.`,
      ],
      table: {
        caption: "Table 5.12: Five candidate judges on one real question-answer pair",
        head: ["Model", "Answer A", "Answer B"],
        rows: [
          ["qwen2.5 (incumbent)", "~76/80", "~76/80"],
          ["gemma2:9b", "72/80", "75/80"],
          ["llama3.1:8b", "72/80", "73/80"],
          ["mixtral", "72/80", "76/80"],
          ["CompassJudger-1-7B", "72/80", "75/80"],
        ],
      },
      paras2: [
        `All five models, across four architectures, converged on 72-76 out of 80. That looked like a robust consensus, and treating it as one would have been a methodology error: testing a single strong answer repeatedly only establishes that models agree a good answer is good. It says nothing about whether they can tell a bad answer from a good one, which is the only property that matters for a gate.`,
        `The corrected test constructed a deliberately broken answer - factually wrong, internally contradictory, containing irrelevant claims - and presented it alongside a solid one for the same question. This is the discrimination test that Section 5.7 later applied to the Verifier, and it is the criterion on which the Judge was ultimately chosen.`,
        `A head-to-head on twenty real question-answer triples, forty scores per model, then compared the incumbent against the most promising alternative.`,
      ],
      table2: {
        caption: "Table 5.13: Head-to-head on 20 real triples (N=40 scores per model)",
        head: ["Metric", "qwen2.5", "CompassJudger-1-7B"],
        rows: [
          ["Mean", "71.9/80 (89.9%)", "70.0/80 (87.5%)"],
          ["Standard deviation", "3.7", "3.8"],
          ["Min / Max", "64 / 80", "60 / 73"],
          ["Scored ≥75", "20.0%", "0.0%"],
        ],
      },
      paras3: [
        `CompassJudger-1 never once scored 75 or above across forty real evaluations, where the incumbent reached the maximum of 80 one time in five. Combined with evidence that it still penalised genuinely wrong content, this read as a real calibration improvement, and the Judge was switched.`,
        `That decision was wrong, and the reason it was wrong is the most useful finding in this section. Mean and spread are aggregate statistics, and they concealed the failure that mattered. Inspecting per-criterion scores rather than totals showed that CompassJudger-1 was giving all eight criteria the identical value on most answers - 9/9/9/9/9/9/9/9 - with boilerplate justifications that were sometimes word-for-word identical between two different answers.`,
      ],
      table3: {
        caption: "Table 5.14: CompassJudger-1 flat-scoring rate (all eight criteria identical)",
        head: ["Condition", "n", "All-8-identical"],
        rows: [
          ["Anchored on the Verifier's scores (pre-fix)", "40", "10%"],
          ["Blind, rubric v3", "5", "80%"],
          ["Blind, rubric v4", "4", "75%"],
          ["Blind, rubric v4, generation continued", "43", "~74%"],
        ],
      },
      paras4: [
        `The rate got worse after the independence bug was fixed, not better. While anchored on the Verifier's output the model had been inadvertently inheriting the Verifier's genuine variation; scoring independently exposed that its own default behaviour was to write plausible prose around a single flat number. A bug had been masking a worse problem, and fixing the bug is what revealed it.`,
        `The final comparison, at full scale under the production rubric, settled the choice.`,
      ],
      table4: {
        caption: "Table 5.15: Final judge comparison (N=40 blind evaluations each)",
        head: ["Metric", "qwen3.5:9b", "CompassJudger-1-7B"],
        rows: [
          ["Mean", "65.5/80 (81.9%)", "69.3/80 (86.7%)"],
          ["Standard deviation", "9.5", "9.3"],
          ["Min / Max", "19 / 78", "16 / 73"],
          ["Scored ≥75", "10.0%", "0.0%"],
          ["Flat (all 8 criteria identical)", "0.0%", "57.5%"],
        ],
      },
      paras5: [
        `The two standard deviations are nearly identical, and on that statistic alone the models look equivalent. They are not. CompassJudger-1's spread comes from which single flat value it happens to select per question, not from per-criterion analysis; qwen3.5:9b never produced a flat score across forty evaluations. The selection criterion that distinguishes them - per-criterion variance - is not one that appears in any standard evaluation summary, and would have been missed by comparing means.`,
        `qwen3.5:9b was adopted, with internal reasoning disabled for the reason given in Section 3.3.`,
      ],
    },
    {
      heading: "Calibrating the Rubric: Four Revisions",
      paras: [
        `The eight-factor rubric presented in Section 3.4 is the fourth version. The three it replaced each failed in an instructive way, and the sequence is reported here because the failures were not obvious in advance and the fix that seemed most natural did not work.`,
        `The first version gave each criterion a single generic descriptor - "claims are accurate", "well-structured and easy to read" - and relied on the model to map quality onto a zero-to-ten scale. Across the first ~870 records, Judge totals clustered hard against the ceiling: mean 76.3 out of 80, standard deviation 3.4, with 81 per cent of all scores falling in the 75-80 band. The rubric was not discriminating between answers of different quality; it was agreeing that everything was good.`,
        `The obvious remedy was tried first and is the most useful result in this section because it failed. The band descriptions were rewritten to be explicitly stricter - "competent/adequate" recalibrated from 7-9 down to 5-6, and an explicit requirement to justify any score of 9 or 10 before awarding it. Eight fresh completions under the new prompt averaged 76.4 out of 80 with the same tight spread. The change had no measurable effect at all.`,
        `The conclusion drawn was that abstract calibration language does not override an evaluator model's systematic positivity, even when the instruction to be harsh is explicit. Telling a model to be stricter is not the same as giving it a basis on which to be stricter. Everything that worked subsequently followed from that distinction.`,
      ],
      table: {
        caption: "Table 5.11: Rubric revisions and their effect on Judge behaviour",
        head: ["Version", "Change", "Outcome"],
        rows: [
          ["v1 / v2", "Generic one-line descriptor per criterion", "Mean 76.3/80, SD 3.4, 81% of scores in 75-80 — not discriminating"],
          ["(interim)", "Stricter band language; justification required for 9-10", "Mean 76.4/80, same spread — no measurable effect"],
          ["v3", "Narrower bands; must find a specific flaw before awarding ≥7, else cap at 6", "Forces an evidence step rather than a judgement"],
          ["v4", "Concrete per-criterion anchors + explicit anti-default rule", "Adopted; differentiated per-criterion scores (Table 5.5)"],
        ],
      },
      paras2: [
        `Version 3 changed the shape of the task rather than its wording. Instead of asking for a calibrated number, it required the model to actively search for a specific flaw before awarding any score of seven or above, and to cap the criterion at six if it found one. This converts scoring from an impression into a search with an observable outcome, which a language model is considerably better at.`,
        `Version 4 addressed a different failure that surfaced immediately after the independence fix of Section 5.5. The Judge's total came out as exactly 72 on three unrelated questions in the first five records - CRISPR, quantum entanglement, and a machine-learning comparison. A value recurring across unrelated content is the signature of a comfortable default rather than content-driven scoring.`,
        `The diagnosis was that all eight criteria shared the same vague standard, which gives a model little basis to distinguish a four from a six on any one of them. Version 4 rewrote every criterion with a concrete, criterion-specific differentiator - Completeness's mid-band became "covers the obvious parts but skips a sub-part, an edge case, or a caveat a subject-matter expert would expect" rather than a generic quality statement - and added an explicit anti-default rule. The per-criterion variation reported in Table 5.5 is the result.`,
        `One procedural consequence is worth recording. Because the scoring regime changed, roughly 435 records generated under the lenient rubric were archived rather than merged, and generation restarted from scratch. Mixing two scoring standards in one corpus would have made every aggregate statistic in this chapter uninterpretable, and the cost of regenerating was far lower than the cost of a dataset nobody could reason about.`,
      ],
    },
    {
      heading: "An Evaluator Coupling Error",
      paras: [
        `A more instructive failure concerned the evaluators' independence itself. Checking whether the Verifier and the Judge were really scoring separately, a query over the live database returned something worse than mere similarity: 32 of 37 records - 86 per cent - had Judge totals matching Verifier totals exactly, digit for digit, across all eight criteria for both answers. Two genuinely independent evaluations do not land on the same sixteen numbers that often.`,
        `The cause was in the Judge's prompt builder, which received the Verifier's full raw output - including its per-criterion numbers - and inserted it under the heading "Verifier's independent scores (a third-party opinion, not ground truth)". The system prompt instructed the Judge to form its own judgement, but at temperature 0.1 with identical rubric anchoring, an instruction not to be influenced by a number placed directly in front of the model is not an effective control. The Judge was transcribing rather than judging.`,
        `The downstream consequence was that the Verifier-Judge agreement signal agreed with itself by construction, inflating the confidence score wherever the Judge was confident - including wherever the Judge was confidently wrong.`,
        `The clue was not a crash or an anomaly in the data. The clue was that the signal performed suspiciously well: it correlated with the Judge far more tightly than an independent second opinion plausibly could. Tracing where its inputs came from showed the coupling. It was removed from the score entirely.`,
        `This is the first of four measurement errors catalogued in Section 5.10, and it established the habit that found the other three: a result that looks too clean is a reason to check the derivation, not a reason to celebrate.`,
      ],
    },
    {
      heading: "Verifier Discrimination",
      paras: [
        `For the Verifier's scores to be meaningful, the Verifier must be capable of distinguishing good answers from bad ones. An evaluator that assigns high scores indiscriminately would produce a confidence signal that looks healthy and means nothing.`,
        `This was tested directly by presenting deliberately corrupted answers alongside intact ones. The Verifier scored intact answers in the range 77 to 80 out of 80, and corrupted answers between 0 and 8 - a separation of roughly 74.5 points on an 80-point scale.`,
        `The result matters for interpreting the bias findings that follow. It establishes that the evaluators discriminate strongly when there is something to discriminate, so a subsequent finding that they nevertheless exhibit systematic preference cannot be dismissed as the behaviour of an instrument that simply does not work.`,
      ],
    },
    {
      heading: "Per-Criterion Score Behaviour",
      paras: [
        `Because both evaluators score the same eight criteria, the corpus permits a direct comparison of how each uses the rubric. The table reports the mean and standard deviation of each criterion for the winning answer across all 5,000 final records.`,
      ],
      table: {
        caption: "Table 5.5: Per-criterion scores for the winning answer (mean ± SD, out of 10)",
        head: ["Criterion", "Judge", "Verifier", "Gap"],
        rows: [
          ["Factual Correctness", "8.02 ± 1.31", "8.58 ± 0.69", "+0.56"],
          ["Question Relevance", "9.05 ± 0.73", "9.12 ± 0.45", "+0.07"],
          ["Context Relevance", "8.38 ± 0.67", "9.25 ± 0.64", "+0.87"],
          ["Faithfulness", "8.50 ± 1.04", "9.21 ± 0.53", "+0.71"],
          ["Completeness", "7.87 ± 0.93", "8.74 ± 0.58", "+0.87"],
          ["Hallucination-Free", "8.97 ± 1.14", "9.93 ± 0.35", "+0.96"],
          ["Clarity", "8.74 ± 0.56", "8.94 ± 0.52", "+0.20"],
          ["Consistency", "9.21 ± 0.61", "9.18 ± 0.90", "−0.03"],
        ],
      },
      paras2: [
        `Three patterns are visible and none was designed in.`,
        `First, the Verifier is systematically more lenient than the Judge. It scores higher on seven of eight criteria, by an average of just over half a point. The two evaluators therefore agree substantially on the ranking of answers while disagreeing on their absolute level - which is the right way round for the architecture, since the Judge's total feeds the confidence score and the Verifier's contributes only through agreement.`,
        `Second, the Judge discriminates more. Its standard deviations are larger on six of eight criteria, most markedly on Factual Correctness (1.31 against 0.69) and Hallucination-Free (1.14 against 0.35). A scoring criterion is only useful to the extent that it varies, and the Judge's scores vary more.`,
        `Third, and most usefully, the Verifier's Hallucination-Free criterion is close to degenerate: a mean of 9.93 with a standard deviation of 0.35 means it awards full marks almost always. That is the same degenerate behaviour that disqualified a candidate judge model in Section 5.3, appearing here on a single criterion of an otherwise serviceable evaluator. The practical consequence is that the Verifier contributes essentially no information about hallucination, and the system's hallucination signal rests on the Judge alone. This was not known before the corpus was analysed, and it is a weakness rather than a feature.`,
        `The hardest criterion for the Judge is Completeness, at 7.87 - the lowest mean of the eight. Where this system's answers fall short, they fall short most often by being incomplete rather than by being wrong.`,
      ],
    },
    {
      heading: "Inter-Evaluator and Cross-Model Agreement",
      paras: [
        `Verifier-Judge agreement averages 0.837 with a median of 0.850 across the corpus. Two independently prompted models, from different families, scoring the same answers against the same rubric without sight of each other's scores, agree to that degree. This is the single strongest piece of evidence that the rubric is being applied consistently rather than idiosyncratically.`,
        `Cross-model agreement between the two candidate answers, measured as pairwise BERTScore, averages only 0.220. The two generators produce substantively different text on most questions. For the diversity argument of Section 3.3 this is good news: two models that said the same thing would make the comparison vacuous. For the signal itself it is a limitation, since a signal clustered at the low end of its range has little dynamic range to contribute, and its 0.10 weight therefore does less work than the nominal allocation suggests.`,
      ],
    },
    {
      heading: "Are the Six Signals Independent?",
      paras: [
        `The confidence score combines six signals on the premise that they carry different evidence. If they were strongly correlated the blend would be theatre - six numbers measuring one thing, with the weights creating an illusion of breadth. The corpus allows the premise to be tested directly.`,
      ],
      table: {
        caption: "Table 5.10: Pearson correlation between confidence signals (5,000 final answers)",
        head: ["", "Judge", "Simil.", "Agree.", "Ver-Jdg", "Wiki", "Wikidata"],
        rows: [
          ["Judge rubric", "1.00", "−0.07", "0.12", "0.61", "0.05", "−0.02"],
          ["Similarity", "−0.07", "1.00", "−0.00", "−0.01", "−0.08", "−0.08"],
          ["Model agreement", "0.12", "−0.00", "1.00", "0.25", "0.01", "−0.04"],
          ["Verifier–Judge", "0.61", "−0.01", "0.25", "1.00", "0.04", "−0.05"],
          ["Wikipedia", "0.05", "−0.08", "0.01", "0.04", "1.00", "0.11"],
          ["Wikidata", "−0.02", "−0.08", "−0.04", "−0.05", "0.11", "1.00"],
        ],
      },
      paras2: [
        `The premise holds. Of the fifteen distinct signal pairs, thirteen have an absolute correlation below 0.13, and most sit within a few hundredths of zero. The signals are close to mutually orthogonal, which is the strongest possible justification for blending them: each contributes evidence the others do not.`,
        `Three entries deserve individual comment.`,
        `The Judge and the Verifier-Judge agreement signal correlate at 0.61, by some distance the largest value in the table. This is partly by construction - the agreement measure is computed against the Judge's own total, so the two cannot be independent - and it means the confidence score carries roughly 0.50 of effective weight on the Judge's opinion rather than the nominal 0.40. That is a design observation rather than an error, but it is not what the weight table implies, and it is recorded here rather than left for a reader to derive.`,
        `Wikipedia and Wikidata correlate at only 0.11 despite both being external encyclopedia checks on the same answer. Two sources of the same kind would be expected to agree far more strongly. The low value vindicates the choice of structurally different sources - one prose, one a knowledge graph - because they evidently fail on different questions, which is precisely what makes their combination informative.`,
        `Semantic similarity is essentially uncorrelated with everything, including the Judge at −0.07. It measures whether the answer is about the question, which no other signal measures, and it is the clearest case in the table of a signal earning its weight by being different rather than by being strong.`,
        `Against the composite score, the signals rank Judge 0.73, Wikipedia 0.61, Verifier-Judge 0.57, Wikidata 0.29, model agreement 0.27 and similarity 0.25. Wikipedia's influence is notably higher than its 0.15 weight suggests, because on the 44 per cent of attempts where it is available it varies widely, whereas several other signals cluster.`,
      ],
    },
    {
      heading: "Availability of the External Signals",
      paras: [
        `The two external encyclopedia checks carry a combined nominal weight of 0.25, a quarter of the confidence score. How often they actually contribute is a separate question, and the answer is a genuine limitation of the system as built.`,
      ],
      table: {
        caption: "Table 5.6: External signal availability across 8,432 attempts",
        head: ["Signal", "Available", "Unavailable", "Availability", "Mean when present"],
        rows: [
          ["Wikipedia", "3,745", "4,687", "44.4%", "0.606"],
          ["Wikidata", "3,830", "4,602", "45.4%", "0.472"],
        ],
      },
      paras2: [
        `Both external checks are absent more often than they are present. When no sufficiently relevant article or entity is found the signal returns nothing and its weight is redistributed, which is the correct behaviour - scoring an unverifiable claim as wrong would be worse - but it means that for the majority of answers the confidence score is carried by the Judge, semantic similarity and the two agreement signals alone.`,
        `This qualifies the claim that the architecture grounds its judgements outside the model family. It does so for roughly 45 per cent of attempts. For the remainder, every contributing signal originates from a language model or an embedding of one, and the external corroboration that distinguishes this design is simply not available. Improving retrieval coverage is therefore a higher-value direction than re-weighting the signals that already exist.`,
      ],
    },
    {
      heading: "Position Skew in the Judge",
      paras: [
        `The Judge declared the answer in the second prompt slot the winner in 3,345 of 5,000 final records, against 1,655 for the first slot - 66.9 per cent against 33.1 per cent.`,
        `Because the assignment of models to slots is randomised per question, this cannot be a quality difference between the two generators. It is a position effect in the Judge, and a large one. Decomposed by true model identity rather than slot, the same records give a much smaller preference of roughly 57 to 43 in Mistral's favour, which is the genuine model difference such as it is.`,
        `The practical significance is that the raw winner column is close to useless as a statement about which model is better, and would be badly misleading if reported as one. It is retained because the identity mapping is stored alongside it, which allows the position component to be removed after the fact. A system that had not recorded that mapping would have 5,000 records of an uninterpretable verdict.`,
        `This finding is also what motivated the bias investigation of Section 5.8. An evaluator with a documented 34-point position skew makes it implausible that a downstream consumer of its verdicts is unbiased, and that suspicion proved correct.`,
      ],
    },
    {
      heading: "Comparing the Two Generators",
      paras: [
        `With the position mapping recorded, the corpus supports a comparison of the two generators by true model identity rather than by prompt slot. The result is more interesting than a simple ranking, because the two evaluators do not agree about whether a difference exists at all.`,
      ],
      table: {
        caption: "Table 5.7: The two generators compared by true identity (5,000 final records)",
        head: ["Measure", "LLaMA 3", "Mistral", "Difference"],
        rows: [
          ["Judge rubric total (/80)", "61.66", "64.34", "+2.68 to Mistral"],
          ["Verifier rubric total (/80)", "72.69", "72.91", "+0.22 to Mistral"],
          ["Mean answer length (words)", "366", "317", "+49 to LLaMA 3"],
          ["Judge declared winner", "2,150 (43.0%)", "2,850 (57.0%)", "z = −9.90"],
        ],
      },
      paras2: [
        `The Judge sees a clear and statistically unambiguous difference. It scores Mistral 2.68 rubric points higher on average and declares it the winner in 57.0 per cent of questions against 43.0 per cent - a deviation from parity with a z-statistic of −9.90, which on 5,000 records is not attributable to chance by any margin.`,
        `The Verifier, scoring the same 5,000 pairs of answers against the same eight criteria, sees a difference of 0.22 points. That is a twelfth of the gap the Judge reports, and on the scale of a rubric scored out of eighty it is indistinguishable from no difference at all.`,
        `Two independent evaluators disagreeing about whether a difference exists is a more informative result than either evaluator's verdict taken alone. There are two readings and the data here do not separate them. The difference may be real but subtle, with the Judge more sensitive to it than the Verifier - consistent with the Judge's generally larger score variance reported in Section 5.5. Or the Judge's preference may be a model-specific artefact that the Verifier simply does not share, in which case the 57 to 43 win rate measures a property of qwen3.5:9b rather than a property of Mistral.`,
        `This report does not claim to resolve it, and the ambiguity is reported rather than collapsed into whichever reading is more convenient. Resolving it would require a third independent evaluator, or the human study proposed in Chapter 8. What can be said is that any statement of the form "Mistral outperforms LLaMA 3 on this corpus" rests entirely on one evaluator's judgement and is not corroborated by the other.`,
        `The length figures bear on the earlier bias analysis. LLaMA 3 writes 15 per cent longer answers, which is exactly the kind of difference that could drive a verbosity effect - and it is the competing explanation tested and excluded in Section 5.9.`,
      ],
    },
    {
      heading: "Computational Cost",
      paras: [
        `A single attempt - two generations, two evaluations, the embedding work and the external lookups - takes 62.3 seconds on average, with a median of 58.5 seconds. The closeness of mean and median indicates a reasonably symmetric distribution without a heavy tail of pathological cases.`,
        `Across 8,432 attempts the corpus represents approximately 145.8 GPU-hours of computation on a single RTX 4090. At a mean of 1.69 attempts per question, a question costs roughly 105 seconds end to end.`,
        `Two observations follow. First, the regeneration loop is the dominant cost multiplier: eliminating it would reduce total compute by about 40 per cent, which is the price paid for the quality mechanism. Second, the Judge is the dominant per-attempt cost, being the largest model invoked and invoked on every attempt - which is what makes the distillation direction in Chapter 8 attractive, since replacing it with a small regressor would cut evaluation to milliseconds.`,
        `These figures also explain why the corpus took several days of wall-clock time and why the resilience work described in Section 4.7 was not optional.`,
      ],
    },
    {
      heading: "Threshold Calibration: the Censoring Problem",
      paras: [
        `The regeneration threshold cannot be calibrated naively, and the reason is structural rather than statistical fussiness.`,
        `The quantity that ought to determine the threshold is: for an answer scoring x, would regenerating it produce a better answer? But answers above the operating threshold are never regenerated, so for the entire region above the current threshold, that quantity has never been observed. The data are censored precisely where the decision is most delicate. Fitting a threshold to the visible data alone estimates the wrong quantity, and does so in a direction that tends to confirm whatever threshold is already in force.`,
        `The remedy adopted here is a control group. A random fraction of answers that have already passed the gate are regenerated anyway, purely for measurement. This yields unbiased observations above the threshold at a modest cost in computation - 165 such regenerations over the corpus.`,
        `The control group introduces a complication of its own. Sub-threshold answers are regenerated with certainty, while above-threshold answers are regenerated only with the control probability. The resulting sample is stratified, not random, and treating a control-sampled row as equally representative as a census row undercounts the above-threshold population by the reciprocal of the control probability. Inverse-probability-of-sampling weighting corrects for this, with each control row carrying weight equal to one over the probability in force when it was generated.`,
      ],
    },
    {
      heading: "Threshold Calibration: Three Independent Routes",
      paras: [
        `Three analyses were applied to the corrected data. They are independent in the sense that they rest on different assumptions and could in principle disagree; that they do not is the substance of the result.`,
        `First, a two-proportion significance test compared the improvement rate between confidence bands. The rate differs across bands beyond what sampling noise explains, at p = 0.011. This establishes that the confidence score carries information about whether regeneration will help - a precondition for any threshold being meaningful at all.`,
        `Second, a receiver-operating-characteristic analysis treated the attempt's confidence score as a predictor of whether a regeneration would improve the answer. The area under the curve is 0.629. This is modest - a perfect predictor scores 1.0 and a coin flip 0.5 - and it is reported as it is rather than framed favourably. The score discriminates, but weakly. Maximising Youden's J places the point optimum at t = 0.70, with sensitivity 54.6 per cent and specificity 64.4 per cent.`,
        `Third, a bootstrap over 2,000 resamples gave a median optimal cutoff of 0.72, a modal value of 0.70, and a 95 per cent confidence interval of [0.69, 0.75].`,
      ],
      figure: "roc",
    },
    {
      heading: "Threshold Calibration: Choosing the Operating Point",
      paras: [
        `The J statistic is nearly flat across 0.70 to 0.74. Values in that band are statistically indistinguishable, which means the choice among them is a policy decision rather than a statistical one - a point worth making explicitly, because presenting any single value in that range as "the optimum" would overstate what the data support.`,
      ],
      figure: "youden",
      table: {
        caption: "Table 5.2: Threshold operating points",
        head: ["Threshold", "Youden's J", "Sensitivity", "Specificity", "Status"],
        rows: [
          ["0.70", "0.190", "54.6%", "64.4%", "ROC point optimum"],
          ["0.72", "0.170", "66.7%", "50.3%", "Adopted (bootstrap median)"],
          ["0.75", "0.169", "86.7%", "30.2%", "Earlier recall-first choice"],
        ],
      },
      paras2: [
        `The adopted value of 0.72 is the bootstrap median and sits in the middle of the plateau, balancing sensitivity against specificity. The earlier value of 0.75, which this project used for most of its duration, sat at the very upper edge of the confidence interval and traded specificity heavily for recall: it caught 86.7 per cent of improvable answers at the cost of needlessly regenerating roughly seven in ten answers that were already fine.`,
        `The bootstrap distribution is the strongest single piece of evidence that the answer is stable rather than an artefact of this particular corpus, and it is reproduced below.`,
      ],
      figure2: "bootstrap",
    },
    {
      heading: "Evaluator Bias: Measuring the Combiner",
      paras: [
        `The most substantial experimental result of this project concerns the Combiner, the agent that synthesises the final answer from the best attempt.`,
        `For most of the project the Combiner was llama3, which is also one of the two generators. It was therefore merging its own writing against another model's on every question. The symptom had already been recorded much earlier - similarity metrics computed against the final answer were biased toward one candidate - and the response at the time was to exclude those metrics from the confidence score. That removed the bias from the measurements and left it entirely intact in the shipped answer.`,
        `The effect was measured across all 5,000 final records. Both candidate answers and the final answer were embedded with the same encoder used elsewhere in the pipeline, and the difference in cosine similarity between the final answer and each candidate gives a signed preference. Mapping that preference onto model identity using the recorded position mapping yields the identity lean; leaving it in slot terms yields the position lean.`,
        `Crossing the two factors is essential, because the marginal figures are misleading on their own. The headline number - 58.7 per cent of final answers closer to the llama3 candidate - conflates two distinct effects that happen to point the same way.`,
      ],
    },
    {
      heading: "Evaluator Bias: Decomposition",
      table: {
        caption: "Table 5.3: Combiner bias, effects separated",
        head: ["Effect", "Magnitude", "Significance"],
        rows: [
          ["Identity: own-answer preference, position held fixed", "+18.1 pp", "p ≈ 1.7 × 10⁻⁸⁹"],
          ["Position: first-slot preference, identity averaged", "+10.8 pp", "p ≈ 5.7 × 10⁻⁵³"],
          ["Length: correlation with word-count advantage", "r = +0.029", "Not supported"],
        ],
      },
      paras: [
        `Length was a credible competing explanation and was tested rather than dismissed. The llama3 generator does write longer answers on average - 366 words against Mistral's 317 - and a synthesiser that simply retained more of the longer source would produce exactly this pattern. However the correlation between length advantage and preference is only +0.029, and the effect persists at 61.1 per cent among length-matched pairs (word counts within 10 per cent, n = 1,645, p = 2 × 10⁻¹⁹). Length does not account for it.`,
        `The mechanism proved more specific than simple style recognition. The preference is conditional on the Judge agreeing with it. Where the Judge selected the llama3 answer, the final answer favoured it 69.4 per cent of the time. Where the Judge selected the other candidate, the figure was 50.7 per cent - not statistically distinguishable from chance (p = 0.465).`,
        `Stated as obedience: the Combiner followed the Judge 69.4 per cent of the time when the Judge pointed at the Combiner's own output, and only 49.3 per cent when it pointed elsewhere. A twenty-point asymmetry in how readily an instruction is followed, conditioned on whether the instruction favours oneself.`,
        `The full three-way crossing makes the structure visible, and every cell is individually significant. The decisive cell is the second: 1,815 records in which the llama3 answer occupied the first slot and the Judge had selected the other candidate. Mistral's answer was sitting there, selected, in the other slot - and the final answer still landed closer to llama3 in 64.0 per cent of cases.`,
      ],
      figure: "combiner_bias",
    },
    {
      heading: "Evaluator Bias: the Correction and its Limits",
      paras: [
        `The Combiner was reassigned to gemma2:9b, a model that is neither generator, nor the Verifier, nor the Judge. The reasoning was that this removes SELF-preference by construction rather than reducing it: a model with no answer of its own among the two it is merging has nothing of its own to prefer. That reasoning is sound as far as it goes, but it does not follow that the replacement is therefore unbiased - a point the measurement below makes, and which would have been missed had the change been adopted on the argument alone.`,
        `A controlled replay was built to verify this rather than assume it. Because the Combiner is strictly terminal - the confidence score never takes the final answer as an input, and the Combiner runs once after the regeneration loop closes - every one of its inputs is already stored per record. The Combiner can therefore be re-run in isolation across the existing corpus, with the question, both candidates and both evaluator outputs frozen, and only the model varied. The design crosses two models against two presentation orders, so that averaging the orders within a question cancels position exactly and isolates identity, while comparing them isolates position.`,
        `The replay required one precaution that is easy to overlook. When the presentation order is swapped, the "Answer 1" and "Answer 2" references inside the stored evaluator text must be remapped to match; without that, the Combiner receives a verdict pointing at the wrong candidate, which contaminates the very effect being measured.`,
        `The replay is now complete: 400 questions across two models and two presentation orders, 1,600 synthesis calls, with no failures. Its results are given in Table 5.8, and they are more nuanced than "the replacement worked".`,
      ],
      table: {
        caption: "Table 5.8: Controlled replay, 400 questions × 2 models × 2 orders",
        head: ["Measure", "llama3 (baseline)", "gemma2:9b (adopted)"],
        rows: [
          ["Prefers prompt slot 1", "80.5%", "50.7%"],
          ["Leans toward the LLaMA 3 candidate", "62.7%", "35.2%"],
          ["Distance from 50/50 parity on identity", "12.7 pp", "14.8 pp"],
          ["Same, with answer length controlled", "15.5 pp", "7.3 pp"],
          ["Mean output length (cap: 150 words)", "223 words (max 543)", "131 words (max 199)"],
        ],
      },
      paras2: [
        `The position result is unambiguous and is the most important line in the table. Where the original Combiner tracked whichever answer it read first in 80.5 per cent of questions, the replacement does so in 50.7 per cent - within a single percentage point of perfect neutrality. This was not expected. The position effect had been described earlier in this chapter as a property of prompt reading rather than of model identity, and therefore as something a model swap could not address; the measurement contradicts that reasoning, and the reasoning was wrong rather than the measurement.`,
        `The identity result does not support the simpler claim that might have been made, and is reported as it stands. The replacement does not land on parity: it leans toward the Mistral candidate in 64.8 per cent of questions, which is 14.8 points from parity against the original's 12.7 points in the opposite direction. On the raw identity measure the replacement is marginally worse, and the lean has changed sign rather than disappeared.`,
        `That lean cannot be self-preference, because gemma2:9b has no answer of its own among the two it is merging. The obvious candidate explanation is length, and testing it accounts for about half the gap. The replacement compresses hard - 131 words on average against the original's 223 - so it must discard more, and the LLaMA 3 candidate is the longer source at 366 words against 317. Restricting to length-matched pairs moves the replacement from 35.2 per cent to 42.7 per cent, which is 7.3 points from parity; the same restriction moves the original the other way, from 62.7 to 65.5 per cent, confirming that length never explained the original's bias.`,
        `The honest summary is therefore three-part. The replacement eliminates the position effect, which was the larger structural defect. It eliminates self-preference by construction, since it has no self. It introduces a smaller, length-mediated lean toward the shorter source, which is a different and more tractable problem than an evaluator favouring its own output, and which an extractive selector would remove entirely. It also respects the 150-word instruction that the original exceeded by up to a factor of 3.6.`,
        `What remains unaddressed is that the per-question coin flip only ever made the position effect unbiased with respect to identity rather than absent - and for the live service, which fixed LLaMA 3 in slot one, not even that. Chapter 8 discusses extractive selection as the remedy that would remove both the residual position sensitivity and the length-mediated lean by construction.`,
      ],
    },
    {
      heading: "Measurement Errors Detected and Corrected",
      paras: [
        `Five errors were identified during the project that would have corrupted reported results had they gone unnoticed. They are recorded here because a report presenting only its successes misrepresents how the work was actually done, and because each was found by the same habit rather than by luck: a result that looked too clean was checked instead of accepted.`,
      ],
      table: {
        caption: "Table 5.4: Measurement errors and corrections",
        head: ["Error", "How it was noticed", "Consequence if unnoticed", "Correction"],
        rows: [
          ["Evaluator reported a rubric total inconsistent with its own criterion scores", "A total of 55 against a stated maximum of 40", "Inflated or deflated confidence scores", "Totals recomputed from criterion scores"],
          ["A 'second opinion' signal was derived from the Judge's own output", "It correlated with the Judge too tightly to be independent", "Self-agreement silently inflating confidence", "Signal removed from the score"],
          ["Threshold analysis applied one sampling weight although the control rate changed mid-run", "ROC gave AUC ≈ 0.51 and an optimum below the current threshold, contradicting a clean earlier result", "A mis-weighted, wrong threshold", "Per-record weighting by the rate actually in force"],
          ["Restart-orphaned attempts produced duplicate final rows for four questions", "5,003 final rows for 5,000 questions", "Aggregate statistics over a corpus of the wrong size", "Rows corrected; the write now targets a unique row id"],
          ["The results viewer labelled winners by prompt slot, not model identity", "A screenshot showing 23 of 24 recent wins to one model", "A false conclusion that the pipeline was overwhelmingly biased", "Winner name derived from the recorded identity columns"],
        ],
      },
      paras2: [
        `The third, fourth and fifth deserve comment, because each produces plausible output rather than an error.`,
        `The third arose because the control probability was raised from 0.08 to 0.60 partway through the run. Applying the current value to every control record undercounts those sampled under the old rate by a factor of 7.5, which corrupts sensitivity, specificity and AUC - all of which depend on population composition - while leaving the simple per-band rates untouched. The symptom was that the ROC analysis contradicted a band comparison that had already been established as clean and significant. Two analyses of the same data disagreeing is informative; the disagreement was traced to the weighting rather than averaged away.`,
        `The fourth is a schema trap. Attempts were being marked final by matching on question index and attempt number, a pair that appears unique but is not. If the process is interrupted between inserting an attempt and marking it final, the question is reprocessed from scratch on restart, and its fresh first attempt shares that pair with the orphaned one - so both get flagged. Four questions were affected. The fix was to return the row identifier at insertion and target the update by that identifier alone.`,
        `The fifth never touched the data at all, which is what makes it worth recording. The results viewer rendered the winning model's name as "A means LLaMA 3, B means Mistral" - true before answer order was randomised, and never updated afterwards. The stored data was correct throughout; only the display was wrong. It surfaced when a screenshot showed 23 of 24 recent questions won by one model, which looked like overwhelming bias. Checking those exact rows in the database showed the opposite: the coin flip had simply landed the same way for a stretch, and the true split was close. A reader of that screen would have drawn a firm and entirely false conclusion about the system, from data that was never wrong.`,
      ],
    },
    {
      heading: "The Retrieval Path Was Inert Throughout",
      paras: [
        `Section 3.10 describes a retrieval subsystem with a minimum-similarity gate, and Section 3.4 defines a Context Relevance criterion scored against retrieved material. Both descriptions are accurate about the implementation and misleading about the corpus, and the discrepancy was found late.`,
        `The batch harness calls its per-attempt routine with the retrieval-context parameter left at its default of empty, and never overrides it. Every one of the 5,000 questions in the calibration corpus therefore ran with retrieval completely inert. No chunk was ever retrieved, no similarity gate was ever evaluated, and the Context Relevance criterion was scored by its fallback definition - whether the answer stays on topic - on every single record.`,
        `Three consequences follow, and all three limit what this report can claim.`,
        `First, the minimum-similarity threshold of 0.35 has never been calibrated and, unlike the confidence threshold, currently cannot be. This is not a sample-size problem that more generation would solve; it is the absence of a data path. The parameter only executes in the live interactive service, which sees a tiny fraction of the batch harness's traffic, and until recently that service recorded no retrieval outcome anywhere persistent. There is nothing in the corpus against which to fit it.`,
        `Second, the Context Relevance scores reported in Table 5.5 - Judge 8.38, Verifier 9.25 - measure topic adherence, not fidelity to supplied material. They should not be read as evidence that the system grounds answers in documents, because on this corpus it never had any.`,
        `Third, the retrieval subsystem as a whole is untested at scale. It works in the live service and was exercised during development, but no claim in Chapter 5 rests on it, and none should be read as doing so.`,
        `Instrumentation has since been added: the live service now logs, per query, whether context was injected, how many chunks, and the similarity of the best match. That provides the data path the calibration needs, by the same control-group method used for the confidence threshold - injecting context on a random fraction of queries that fall below the gate, to produce the observations the gate otherwise suppresses. The calibration itself remains outstanding and is listed in Chapter 8.`,
        `This is reported in the results chapter rather than buried in limitations because it bears directly on how two of the tables above should be read.`,
      ],
    },
    {
      heading: "Threats to Validity",
      paras: [
        `Several threats bound the conclusions of this chapter and are stated explicitly.`,
        `Construct validity. The label-free improvement criterion defines "better" as an increase across the five non-judge signals. This is a proxy for quality, not quality itself, and it was chosen specifically to exclude the Judge and avoid circularity. A system that improved on those five signals while becoming less accurate would be scored as improved, and this methodology would not detect it.`,
        `Internal validity. The AUC of 0.629 indicates weak discrimination. The threshold is calibrated on a real relationship, demonstrated significant by an independent test, but it is not a strong one, and the near-flat J curve reflects that. A stronger predictor would produce a sharper optimum.`,
        `External validity. All results are specific to this model set, this corpus and this rubric. The protocol is expected to transfer and the numbers are not; this has not been tested.`,
        `Statistical conclusion validity. The very small p-values reported for the bias effects reflect a large corpus and should be read as evidence that the effects are real, not that they are large. The effect sizes - 18.1 and 10.8 percentage points - are the quantities of practical interest, and they are reported alongside every p-value for that reason.`,
        `Instrumentation validity. The retrieval path was inert for the entire corpus (Section 5.14), so the Context Relevance scores measure topic adherence rather than fidelity to supplied material, and no claim here rests on the retrieval subsystem. Separately, two of the five errors in Table 5.4 were in the measurement and display layers rather than in the pipeline, which is a reminder that a correct system observed through a faulty instrument is indistinguishable from a faulty system.`,
        `Sample size in the replay. The controlled replay of Section 5.9 used 400 of the 5,000 questions. At that size the 95 per cent interval on a proportion is roughly five percentage points, which is comfortably narrower than the effects reported - a 30-point shift in position preference and a 27-point shift in identity lean - but not narrow enough to support fine distinctions. The claim that the replacement sits 7.3 points from parity when length is controlled should be read as "closer to parity than the baseline", not as a precise figure.`,
        `Unresolved disagreement. Section 5.8 reports two evaluators disagreeing about whether the generators differ at all, and the data do not separate the two readings. This is the largest single open question in the work, and it propagates: if the Judge's preference is an artefact rather than a quality signal, then the winner column - and therefore the Judge's contribution to every confidence score - carries that artefact. Nothing in this report rules that out.`,
      ],
    },
  ],
};

const CH6 = {
  title: "Conclusion and Recommendations",
  sections: [
    {
      heading: "Conclusions",
      paras: [
        `This project set out to determine whether a locally hosted question-answering system can be validated without human-annotated ground truth, and the answer is a qualified yes. Internal consistency, evaluator discrimination, relative improvement under regeneration and the calibration of an operating threshold are all achievable label-free. Absolute factual accuracy is not, and no such claim is made anywhere in this report.`,
        `The threshold calibration demonstrates that a parameter commonly chosen by intuition can be derived from data even when those data are censored by the parameter itself, provided a control group is deliberately introduced to produce the observations the system would otherwise never generate. Three independent statistical routes converged on the same narrow band, and the adopted value of 0.72 is the bootstrap median of that band. The discrimination underlying it is weak - an AUC of 0.629 - and that is reported rather than obscured.`,
        `The most significant finding is methodological. Turning the measurement apparatus on itself revealed that the synthesising agent preferred its own generated answers by 18.1 percentage points, with a separate 10.8 point preference for the first prompt slot, and that neither effect is explained by answer length. This was not a suspected weakness confirmed; it was a quantified defect in the project's own prior design, found by measurement, and corrected. The mechanism - selective obedience to an evaluator depending on whether the evaluator's verdict was flattering - is more specific and more interesting than the generic "self-preference" the literature describes.`,
        `A system of this kind is therefore best understood not as a correctness oracle but as a calibrated quality gate. It reliably separates weaker answers from stronger ones and acts on that separation, while remaining honest about what it cannot certify.`,
      ],
    },
    {
      heading: "Recommendations",
      bullets: [
        "No model should both generate and evaluate within an evaluation pipeline. The cost of violating this is measurable, and was measured here at 18.1 percentage points.",
        "Randomising presentation order is necessary but not sufficient. It makes a position effect unbiased with respect to identity; it does not remove the effect. Systems should state which of the two they have achieved rather than claiming to have addressed position bias.",
        "Any threshold governing a feedback loop should be calibrated against a deliberately injected control group, because the loop censors exactly the observations needed to calibrate it.",
        "Evaluator arithmetic should be recomputed rather than trusted, and any signal that performs unexpectedly well should be traced to its source before being relied upon.",
        "Effect sizes should be reported alongside p-values. On a corpus of several thousand records, significance is cheap and magnitude is the quantity of interest.",
        "Measurement errors should be documented rather than quietly corrected. Several of the most useful findings in this project originated in investigating an anomaly that could have been smoothed over.",
      ],
    },
  ],
};

const CH7 = {
  title: "Future Scope",
  sections: [
    {
      heading: "Eliminating the Position Effect by Construction",
      paras: [
        `The residual position effect arises because a generative synthesiser reads a prompt in order and over-weights what it reads first. An extractive approach would not have this property. Maximal marginal relevance selects sentences by a combination of relevance to the query and non-redundancy with what has already been selected; it scores content, and prompt position is not an input to the scoring at all.`,
        `Such an approach would remove both the position and identity terms by construction. It would also make the contribution of each source directly countable rather than inferred from embedding similarity - one could simply report what fraction of the selected sentences came from each generator, turning bias from an emergent property into a design parameter that can be constrained. A useful side effect is that it would calibrate the embedding-based lean metric used throughout Section 5.8, since the true source split would be known exactly.`,
        `One property of maximal marginal relevance must be addressed before adopting it. Its diversity term rewards selecting sentences dissimilar to those already chosen, and a contradiction is maximally dissimilar. The method is therefore structurally inclined to include both sides of a factual disagreement, which is the opposite of what a synthesiser should do and directly conflicts with the Combiner's stated job of removing contradictions the Verifier flagged.`,
        `A hybrid design addresses this. Extraction selects the content - bias-free, balanced, length-exact and auditable - and a small model performs only surface realisation, smoothing transitions and resolving dangling references, explicitly forbidden from adding or removing material. The selection decision, which is where the bias lived, moves out of the language model entirely, while fluency and contradiction handling are retained.`,
      ],
    },
    {
      heading: "A Human-Annotated Validation Study",
      paras: [
        `The label-free methodology establishes internal properties but cannot establish absolute accuracy. A blind, balanced study in which human raters score a stratified sample of answers would allow the confidence score to be validated against human judgement, and would convert the system's relative claims into absolute ones.`,
        `A rating harness and a pre-registered analysis for such a study have been prepared: a balanced sample, a blind presentation order, and a binomial test specified in advance so that the analysis cannot be chosen after seeing the data. What remains is the rating effort itself. Even a modest study of a few hundred items would materially strengthen every quality claim in Chapter 5.`,
      ],
    },
    {
      heading: "Calibrating the Retrieval Threshold",
      paras: [
        `The retrieval subsystem applies a minimum similarity threshold below which retrieved material is excluded, so that an unrelated document cannot contaminate an answer. That threshold has not received the same treatment as the confidence threshold; it was set by inspection.`,
        `Retrieval decisions are now logged per query - whether context was injected, how many chunks, and at what similarity - which provides exactly the data required to calibrate it by the same control-group method. The analogous control would inject context on a random fraction of queries that fall below the threshold, producing the censored observations the gate otherwise suppresses.`,
      ],
    },
    {
      heading: "Distillation of the Judge",
      paras: [
        `Evaluation latency is dominated by the Judge, a nine-billion-parameter model invoked at least once per attempt. Training a small regression model to replicate the Judge's per-criterion rubric scores from the question-answer pair would reduce evaluation to milliseconds and permit the pipeline to run at interactive speed.`,
        `This direction was explored early in the project and set aside in favour of establishing the validation methodology first - a sequencing decision that proved correct, since the bias findings of Section 5.8 would have been distilled into the student model had it been trained on the uncorrected pipeline. The corpus generated by this project is well suited to the task, containing per-criterion scores from two independent evaluators for 8,432 attempts.`,
        `The obvious caution is that a distilled judge inherits whatever biases the teacher had. Distillation should follow bias correction, not precede it.`,
      ],
    },
    {
      heading: "Broader Signal Set and Adaptive Weighting",
      paras: [
        `The six signals and their weights were chosen as a reasoned prior and have been only partially swept. A systematic weight optimisation against the control-group improvement criterion would establish whether the current allocation is near-optimal or merely reasonable.`,
        `Further signals are available without additional model calls: answer-length distribution relative to question type, named-entity overlap between the two candidates, and the variance of per-criterion scores within a single evaluator, which may itself indicate uncertainty. Whether any of these adds discriminative power beyond the existing six is an empirical question the corpus can answer.`,
      ],
    },
    {
      heading: "Generalisation",
      paras: [
        `The protocol developed here - blind evaluation, discrimination testing, control-group calibration under censoring, and bias decomposition with confounds crossed - is model-agnostic and domain-agnostic. The tuned values are not.`,
        `Re-deriving them on a different model set would test whether the method transfers while the numbers do not, which is the expected outcome and is stated here as a hypothesis rather than a result. A particularly informative variant would substitute two generators from the same family, where correlated errors should measurably weaken the cross-model agreement signal - a prediction the methodology makes and that could be falsified.`,
      ],
    },
  ],
};

module.exports = { CH4, CH5, CH6, CH7 };
