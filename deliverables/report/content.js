/**
 * deliverables/report/content.js
 * ------------------------------
 * All prose for the B.E. project report, kept separate from layout so the
 * wording can be revised without touching the docx plumbing.
 *
 * Every figure quoted here is sourced from the repository - RESEARCH_LOG.md
 * sections 1-37, training/optimal_threshold_roc.py and
 * training/combiner_bias_analysis.py - not estimated. Where a result is
 * provisional it says so in the text rather than being rounded into certainty.
 *
 * Placeholders in square brackets are the fields only the team can supply.
 */

const PLACEHOLDER = {
  students: [
    { name: "Swaroop Naik",     roll: "23102A0001", email: "swaroop.naik@vit.edu.in" },
    { name: "Nidhi Bhawari",    roll: "23102A0006", email: "nidhi.bhawari@vit.edu.in" },
    { name: "Devanshi Mahajan", roll: "23102A0069", email: "devanshi.mahajan@vit.edu.in" },
  ],
  guide: "Dr. Suja Jayachandran",
  // Inferred from the institutional firstname.lastname pattern that all three
  // student addresses follow - CONFIRM before submission.
  guideEmail: "suja.jayachandran@vit.edu.in",
  guideDesignation: "",
  hod: "Ravindra Sangale",
  principal: "Sangeeta Joshi",
  groupId: "[GROUP ID]",
};

const TITLE = "AGENTIC MULTI-LLM VALIDATION SYSTEM: LABEL-FREE QUALITY ASSURANCE FOR LOCALLY HOSTED LARGE LANGUAGE MODELS";
const TITLE_SENTENCE = "Agentic Multi-LLM Validation System: Label-Free Quality Assurance for Locally Hosted Large Language Models";

const ACKNOWLEDGEMENT = [
  `We express our sincere gratitude to our guide, ${PLACEHOLDER.guide}, Department of Computer Engineering, Vidyalankar Institute of Technology, for the guidance, patience and critical questioning that shaped this work. The insistence on measuring claims rather than asserting them is the single habit that most improved this project, and several results in Chapter 5 exist only because a comfortable-looking number was questioned instead of accepted.`,
  `We thank the Head of the Department and the faculty of the Department of Computer Engineering for providing the laboratory facilities and the computational resources without which a fully local, multi-model pipeline would not have been feasible.`,
  `We are grateful to the project coordinators for their guidance on the evaluation schedule and documentation standards, and to our peers for reviewing early demonstrations and asking the awkward questions that exposed more than one hidden assumption.`,
  `Finally, we thank our families for their patience during the long experimental runs that this project required.`,
];

const ABSTRACT = [
  `Large Language Models produce fluent text that is frequently wrong, and the standard remedy - asking a second model to grade the first - inherits well documented pathologies of its own. Evaluator models are known to prefer answers in particular prompt positions and to prefer text they themselves generated. This project asks a narrower and more tractable question: can the quality of a locally hosted question-answering system be validated when no human-annotated ground truth is available at all?`,
  `The system presented here answers each question twice, using two independently prompted local models (LLaMA 3 and Mistral), and then validates the pair rather than trusting either. An independent Verifier (phi3) and an independent Judge (qwen3.5:9b) score both candidate answers blind against an eight-factor, eighty-point rubric. Semantic similarity, cross-model agreement and two external encyclopedia checks against Wikipedia and Wikidata are combined with the Judge's rubric total into a single weighted confidence score in the range zero to one. Any answer falling below a calibrated threshold is regenerated automatically, up to a bounded number of attempts, and a sixth agent synthesises the final response from the best attempt. The entire pipeline runs offline on local hardware with no external paid interfaces.`,
  `Validation is label-free by construction. A self-generated corpus of 5,000 questions across ten knowledge domains was produced, and the decision threshold was calibrated against censored data using a deliberately injected control group, receiver-operating-characteristic analysis with Youden's J statistic, and a 2,000-sample bootstrap, yielding an adopted operating point of 0.72 with a 95% confidence interval of [0.69, 0.75].`,
  `The investigation also produced a negative result of independent interest. Measured across all 5,000 records with prompt position and evaluator verdict crossed as controls, the original synthesising agent was found to prefer its own generated answer by 18.1 percentage points, and to prefer whichever answer occupied the first prompt slot by a further 10.8 percentage points. Replacing that agent with a model that is neither generator removes the first effect by construction. Three further measurement errors were detected and corrected during the project before they reached any reported conclusion; these are documented rather than omitted.`,
];

const ABBREVIATIONS = [
  ["API", "Application Programming Interface"],
  ["AUC", "Area Under the Curve"],
  ["BERT", "Bidirectional Encoder Representations from Transformers"],
  ["BLEU", "Bilingual Evaluation Understudy"],
  ["CI", "Confidence Interval"],
  ["CPU", "Central Processing Unit"],
  ["GPU", "Graphics Processing Unit"],
  ["HTTP", "Hypertext Transfer Protocol"],
  ["J", "Youden's J statistic (sensitivity + specificity − 1)"],
  ["LLM", "Large Language Model"],
  ["NLP", "Natural Language Processing"],
  ["pp", "Percentage Points"],
  ["RAG", "Retrieval-Augmented Generation"],
  ["ROC", "Receiver Operating Characteristic"],
  ["ROUGE", "Recall-Oriented Understudy for Gisting Evaluation"],
  ["SSE", "Server-Sent Events"],
  ["SQL", "Structured Query Language"],
  ["VRAM", "Video Random Access Memory"],
  ["τ (tau)", "Confidence threshold below which an answer is regenerated"],
];

/* Figures actually embedded in the document. The list is deliberately limited
 * to figures that exist: a List of Figures promising plates the reader cannot
 * find is worse than a short list. Further figures (ROC curve, bootstrap
 * distribution, per-criterion variance) are generated by the scripts in
 * training/ and are added when the report is expanded to full length. */
const FIGURES = [
  { n: "3.1", caption: "Six-stage pipeline architecture",
    file: "fig_architecture.png", widthIn: 4.4, chapter: 3, after: "Pipeline Overview" },
  { n: "4.1", caption: "Streaming interface: pipeline progress rendered stage by stage",
    file: "fig_interface.png", widthIn: 5.9, chapter: 4, after: "Streaming Interface" },
  { n: "5.1", caption: "Dataset generation monitor at completion of the 5,000-question corpus",
    file: "fig_dataset.png", widthIn: 5.9, chapter: 5, after: "Experimental Setup" },
];

/* Numbered tables actually present, in document order. */
const TABLES = [
  ["3.1", "Agent roles, models and decoding parameters"],
  ["3.2", "The eight-factor evaluation rubric"],
  ["3.3", "Confidence score signal weights"],
  ["5.1", "Dataset composition"],
  ["5.2", "Threshold operating points"],
  ["5.3", "Combiner bias decomposition"],
  ["5.4", "Measurement errors and corrections"],
];

/* ------------------------------------------------------------------ *
 * Chapters. Each entry: { title, sections: [{ heading, paras[], ... }] }
 * A section may also carry: bullets[], table{caption,head,rows}, caption
 * ------------------------------------------------------------------ */

const CHAPTERS = [
  {
    title: "Introduction",
    sections: [
      {
        heading: "Background",
        paras: [
          `Large Language Models have moved in a very short time from research artefacts to components that ordinary software is expected to depend upon. Their central practical weakness is well known and has not been solved: they generate text that is fluent, confident and internally coherent whether or not it is correct. A model does not signal uncertainty in the way a traditional component signals an error, and a wrong answer is typically indistinguishable in tone from a right one.`,
          `The response that has emerged across industry and research is to use a second model as an evaluator - the "LLM-as-a-judge" pattern. It is attractive because it scales: evaluation becomes a function call rather than a human reading answers. It is also, however, a measurement instrument built from the same material as the thing being measured, and a growing body of work shows that such instruments carry systematic biases. Evaluator models prefer answers presented in certain positions, prefer longer answers, and prefer text generated by themselves or by models of their own family.`,
          `A second constraint motivates this work. Much of the published evaluation literature assumes access either to human preference labels or to a frontier commercial model acting as a reference judge. Both assumptions fail for a department laboratory and for any deployment handling data that cannot leave the institution. This project therefore restricts itself to models that run locally, on a single workstation, with no external paid interfaces of any kind.`,
        ],
      },
      {
        heading: "Problem Statement",
        paras: [
          `Given a question-answering system assembled from locally hosted Large Language Models, and given no human-annotated ground truth for its outputs, determine whether the quality of its answers can be validated, quantified and improved - and determine the extent to which the validation machinery itself is biased.`,
          `The second clause is not decorative. If the evaluation apparatus silently prefers one model, one answer position or one writing style, then every quality figure it produces is contaminated, and improvements measured against it may be artefacts. A validation system that cannot be turned on itself is of limited scientific value.`,
        ],
      },
      {
        heading: "Objectives",
        bullets: [
          "Design and implement a multi-agent question-answering pipeline in which generation and evaluation are performed by different models, running entirely offline.",
          "Define a multi-signal confidence score that combines model-internal and external evidence, so that no single signal dominates the quality decision.",
          "Establish an automatic regeneration mechanism gated on that confidence score, with a bounded number of attempts.",
          "Calibrate the regeneration threshold from data rather than intuition, accounting for the fact that the available observations are censored by the gate itself.",
          "Generate a corpus large enough for the calibration to be statistically meaningful, without human annotation.",
          "Measure the validation apparatus for position bias and self-preference bias, and correct what is found.",
          "Document measurement errors made during the project, including those caught before they influenced any conclusion.",
        ],
      },
      {
        heading: "Scope and Limitations",
        paras: [
          `The system is scoped to open-ended factual and technical question answering in English, over ten general knowledge domains. It is not scoped to mathematical reasoning requiring symbolic manipulation, to code generation, or to multi-turn dialogue.`,
          `Three limitations are stated at the outset and revisited in Chapter 6. First, the validation is label-free, which means it can establish internal consistency, discrimination and relative improvement, but it cannot establish absolute factual accuracy; a claim that the system is "86 per cent correct" is not supported by this methodology and is not made. Second, the tuned values - the threshold, the signal weights, the choice of judge - are specific to this model set and would require re-derivation on another. Third, the position effect documented in Chapter 5 is mitigated but not eliminated.`,
        ],
      },
      {
        heading: "Organisation of the Report",
        paras: [
          `Chapter 2 surveys the relevant literature on automated evaluation of generated text and on the known biases of model-based evaluators, and identifies the gap this work addresses. Chapter 3 presents the system architecture, the rubric and the confidence score. Chapter 4 describes the implementation, including the data generation harness and the resilience mechanisms that an unattended multi-day experimental run required. Chapter 5 presents the experiments and results, including the threshold calibration, the bias investigations and the measurement errors detected along the way. Chapter 6 draws conclusions and makes recommendations, and Chapter 7 sets out future scope.`,
        ],
      },
    ],
  },

  {
    title: "Literature Review",
    sections: [
      {
        heading: "Automatic Metrics for Generated Text",
        paras: [
          `The earliest automatic metrics for generated text, BLEU and ROUGE, measure n-gram overlap against one or more reference texts. They were designed for machine translation and summarisation respectively, and they carry an assumption that does not transfer to open-ended question answering: that a good output resembles a specific reference output. For a question admitting many correct phrasings, overlap with any single reference is a weak proxy for quality.`,
          `Embedding-based metrics such as BERTScore improve on this by comparing contextual embeddings rather than surface tokens, tolerating paraphrase. They remain reference-based, however, and still require a reference answer that this project, by construction, does not have.`,
          `This project uses embedding similarity, but deliberately not as a quality metric against a reference. It is used in two restricted roles: as a relevance signal between the question and the answer, and as an agreement signal between the two independently generated candidate answers. The distinction matters, and an early version of this project violated it; Section 5.2 documents the consequence.`,
        ],
      },
      {
        heading: "LLM-as-a-Judge",
        paras: [
          `Using a strong language model to grade the outputs of another has become the dominant evaluation strategy for open-ended generation. Work on MT-Bench and Chatbot Arena established that model judges correlate reasonably well with human preference at the aggregate level, which is what made the approach credible.`,
          `Subsequent work refined the pattern. G-Eval uses chain-of-thought prompting with form-filling to obtain more stable numeric scores. Prometheus demonstrated that an open, comparatively small model can be fine-tuned to approach the grading behaviour of a much larger proprietary one, which is directly relevant to a locally hosted deployment.`,
          `The same literature documents the failure modes. Model judges exhibit position bias, favouring candidates presented in a particular slot; verbosity bias, favouring longer answers; and self-enhancement bias, favouring text generated by themselves or by related models. These are not incidental: they are reproducible, and they are large enough to reverse a verdict.`,
        ],
      },
      {
        heading: "Multi-Agent Orchestration",
        paras: [
          `Frameworks such as AutoGen and CrewAI popularised the decomposition of a task across several cooperating model-backed agents with distinct roles. The argument is that specialised roles with narrow prompts outperform a single model asked to do everything at once, and that disagreement between agents is itself informative.`,
          `This project adopts the role decomposition but rejects one common convenience of these frameworks: reusing the same underlying model for several roles. If the generator and the judge are the same model, the evaluation is not independent, and the architecture quietly reintroduces exactly the self-preference bias that the literature warns about. Chapter 5 shows what that costs when it is measured rather than assumed away.`,
        ],
      },
      {
        heading: "Retrieval-Augmented Generation and External Grounding",
        paras: [
          `Retrieval-Augmented Generation reduces hallucination by conditioning generation on retrieved documents. It is relevant here in two ways: as an optional input mode for user-supplied documents, and as the conceptual basis for the external fact-checking signals. The system queries Wikipedia and Wikidata as two structurally different encyclopedia sources, so that corroboration comes from outside the model family rather than from another model's opinion.`,
        ],
      },
      {
        heading: "Identified Gap",
        paras: [
          `The literature establishes that model-based evaluation works at aggregate scale and that it is biased in known directions. What is comparatively sparse is a complete, reproducible account of building such a system under a hard no-ground-truth, no-external-API constraint, and then turning the measurement apparatus on itself to quantify its own bias with the confounds properly controlled.`,
          `This project addresses that gap. The specific contributions are: a label-free validation methodology using a deliberately injected control group to defeat censoring; a threshold calibrated by three independent statistical routes that agree; and a decomposition of evaluator bias into position and identity components, with length controlled, which produced a result that overturned the project's own prior design decision.`,
        ],
      },
    ],
  },

  {
    title: "System Architecture",
    sections: [
      {
        heading: "Design Principles",
        paras: [
          `Three principles constrain the architecture. First, separation of concerns between generation and evaluation: no model both produces an answer and judges or merges it. Second, blindness: evaluators never learn which system produced which candidate, and answer order is randomised per question. Third, plurality of evidence: the quality decision rests on several signals of different kinds, so that no single failing signal can dominate.`,
        ],
      },
      {
        heading: "Pipeline Overview",
        paras: [
          `The pipeline executes six stages for each question. Stages 1 and 2 generate two candidate answers independently. Stage 3 applies the Verifier. Stage 4 computes semantic and external signals. Stage 5 applies the Judge. Stage 6 synthesises the final answer from the best attempt. Between stages 5 and 6 the weighted confidence score is computed and the regeneration gate is evaluated.`,
        ],
      },
      {
        heading: "Agent Roles and Model Assignment",
        paras: [
          `Each role is served by a deliberately chosen model. The two generators are different model families so that their errors are less likely to correlate. The Verifier and the Judge are both distinct from the generators and from each other. The Combiner is distinct from every generator, for reasons established empirically in Section 5.5.`,
        ],
        table: {
          caption: "Table 3.1: Agent roles, models and decoding parameters",
          head: ["Stage", "Agent", "Model", "Temp.", "Max tokens", "Responsibility"],
          rows: [
            ["1", "Generator A", "llama3", "0.7", "600", "Produce a candidate answer"],
            ["2", "Generator B", "mistral", "0.7", "600", "Produce an independent candidate"],
            ["3", "Verifier", "phi3:latest", "0.1", "700", "Score both candidates on the rubric"],
            ["4", "Similarity Scorer", "all-MiniLM-L6-v2", "—", "—", "Embedding relevance and agreement"],
            ["5", "Judge", "qwen3.5:9b", "0.1", "900", "Score both and declare a winner"],
            ["6", "Combiner", "gemma2:9b", "0.4", "1000", "Synthesise the final answer"],
          ],
        },
        paras2: [
          `The Judge runs with internal reasoning disabled. With reasoning enabled, qwen3.5:9b consumes its entire generation budget on an internal deliberation and returns an empty response on long rubric prompts - a failure that is silent, in that the pipeline receives a well-formed but empty reply. Disabling reasoning resolved it.`,
        ],
      },
      {
        heading: "The Eight-Factor Rubric",
        paras: [
          `Both the Verifier and the Judge score each candidate answer against the same eight criteria, each on a scale of zero to ten, for a maximum of eighty points per answer. Using an identical rubric for two independent evaluators is what makes their agreement a meaningful signal.`,
        ],
        table: {
          caption: "Table 3.2: The eight-factor evaluation rubric",
          head: ["Criterion", "What it measures"],
          rows: [
            ["Factual Correctness", "Whether the stated facts are accurate"],
            ["Question Relevance", "Whether the answer addresses what was asked"],
            ["Context Relevance", "Consistency with any supplied reference material"],
            ["Faithfulness", "Whether claims are supportable rather than invented"],
            ["Completeness", "Whether the answer covers the question adequately"],
            ["Hallucination-Free", "Absence of fabricated specifics"],
            ["Clarity", "Structure and readability"],
            ["Consistency", "Absence of internal self-contradiction"],
          ],
        },
        paras2: [
          `Rubric totals are recomputed from the individual criterion scores rather than taken from the model's own stated total. This is not defensive programming for its own sake: evaluator models were observed stating totals that did not match the sum of the scores they had just produced, including a total of 55 reported against a maximum of 40. Arithmetic is not delegated to the model.`,
        ],
      },
      {
        heading: "The Weighted Confidence Score",
        paras: [
          `Six signals are combined into a single value between zero and one. Any signal that is unavailable for a given answer is dropped and the remaining weights are renormalised proportionally, so the score degrades gracefully rather than failing.`,
        ],
        table: {
          caption: "Table 3.3: Confidence score signal weights",
          head: ["Signal", "Weight", "Source"],
          rows: [
            ["Judge rubric total", "0.40", "Judge model, normalised from /80"],
            ["Semantic similarity", "0.15", "Embedding cosine, question to answer"],
            ["Wikipedia check", "0.15", "External encyclopedia, relevance-gated"],
            ["Model agreement", "0.10", "BERTScore between the two candidates"],
            ["Verifier-Judge agreement", "0.10", "Concordance of two independent evaluators"],
            ["Wikidata check", "0.10", "Second, structurally different external source"],
          ],
        },
        paras2: [
          `One omission is deliberate and important. No signal referenced against the final combined answer is included. Such signals were found to be systematically biased toward whichever candidate the Combiner had been built from, because for most of the project the Combiner and one generator were the same model. Section 5.5 quantifies that effect.`,
        ],
      },
      {
        heading: "Regeneration Gate",
        paras: [
          `If the weighted confidence score for an attempt falls below the threshold, the pipeline discards the attempt and generates again, to a maximum of two further attempts. The highest-scoring attempt is retained even if a later attempt regresses, so regeneration cannot make the shipped answer worse. The threshold value is derived in Section 5.4.`,
        ],
      },
      {
        heading: "Bias Controls",
        paras: [
          `Two controls operate on every question. Brand-blind prompting removes any mention of which system produced a candidate from the evaluator prompts. Position randomisation assigns the two candidates to the two prompt slots by a fresh coin flip per question, with the true mapping recorded separately so that per-model statistics remain recoverable afterwards.`,
          `It is worth being precise about what randomisation achieves. It makes a position effect unbiased with respect to model identity; it does not remove the position effect itself. An evaluator that favours the first slot still favours the first slot - randomisation only ensures that the favour falls equally on both systems across a large corpus. Section 5.5 shows why that distinction has practical consequences.`,
        ],
      },
    ],
  },

  {
    title: "Implementation",
    sections: [
      {
        heading: "Technology Stack",
        bullets: [
          "Model runtime: Ollama, serving all six models locally over HTTP.",
          "Orchestration: Python with asyncio; LangChain's Ollama binding wraps each agent.",
          "Web service: FastAPI, streaming pipeline progress to the browser over Server-Sent Events.",
          "Embeddings: sentence-transformers with all-MiniLM-L6-v2, executed on GPU.",
          "Persistence: SQLite, one row per attempt, retaining every raw signal.",
          "Frontend: dependency-free HTML, CSS and JavaScript consuming the event stream.",
          "Hardware: a single workstation with an NVIDIA RTX 4090 (24 GB VRAM).",
        ],
      },
      {
        heading: "Concurrency and Memory Constraints",
        paras: [
          `The six models together exceed the available video memory if resident simultaneously, so the pipeline runs with a concurrency of one and relies on the runtime to load and evict model weights as stages execute. An earlier configuration that ran the Verifier and the Judge concurrently produced memory over-subscription stalls, and the two are now deliberately sequential despite the latency cost.`,
        ],
      },
      {
        heading: "Streaming Interface",
        paras: [
          `Because a complete pipeline run takes on the order of one to two minutes, a request-response interface would present the user with an unexplained pause. The service instead emits a typed event as each stage starts and completes, and the frontend renders the pipeline filling in progressively, including each attempt's confidence score and the reason for any regeneration. The interface is therefore not only a demonstration surface but the primary debugging tool for the pipeline's behaviour.`,
        ],
      },
      {
        heading: "Dataset Generation Harness",
        paras: [
          `A batch harness runs the full pipeline over a question corpus and records every raw signal for every attempt - not merely the final answer. This matters for the analyses in Chapter 5, which depend on being able to reconstruct what each evaluator saw and in what order.`,
          `The harness is restartable. It records which question indices are complete and resumes from the first incomplete one, because a run spanning several days is interrupted in practice by reboots, driver updates and power events.`,
        ],
      },
      {
        heading: "Resilience",
        paras: [
          `Three separate multi-hour gaps in generation occurred before resilience was addressed, caused by terminal closure, session teardown and the machine sleeping. A scheduled task external to any interactive session now checks every five minutes that the required processes are alive and restarts any that are not. This is unglamorous engineering, but a multi-day unattended experimental run is not achievable without it.`,
        ],
      },
      {
        heading: "Data Model",
        paras: [
          `Each attempt is stored as one row carrying the question, both candidate answers, the true model-to-position mapping, every per-criterion score from both evaluators, all six confidence signals, the weighted score, the regeneration reason and the elapsed time. The final attempt for a question additionally carries the combined answer.`,
          `A subtle defect in this schema was found at the end of the generation run and is documented in Section 5.6, because it illustrates a class of bug that silently corrupts aggregate statistics.`,
        ],
      },
    ],
  },

  {
    title: "Experiments and Results",
    sections: [
      {
        heading: "Experimental Setup",
        paras: [
          `A corpus of 5,000 questions spanning ten knowledge domains was generated and processed through the complete pipeline, producing 8,432 attempt records of which 5,000 are final answers. All reported statistics are computed over this corpus unless stated otherwise.`,
        ],
        table: {
          caption: "Table 5.1: Dataset composition",
          head: ["Property", "Value"],
          rows: [
            ["Questions", "5,000"],
            ["Knowledge domains", "10"],
            ["Total attempt records", "8,432"],
            ["Final answers", "5,000"],
            ["Mean attempts per question", "1.69"],
            ["Maximum attempts permitted", "3"],
          ],
        },
      },
      {
        heading: "Judge Selection, and an Evaluator Coupling Error",
        paras: [
          `Several candidate judge models were evaluated. The selection criterion was not agreement with any reference, which was unavailable, but per-criterion discrimination: a useful judge must produce differentiated scores across the eight rubric criteria rather than collapsing them.`,
          `One candidate, CompassJudger-1, assigned all eight criteria an identical score on between 75 and 80 per cent of answers once scoring blind. A rubric that always returns the same value on every axis carries almost no information, and the model was rejected on that basis.`,
          `A more instructive failure concerned a signal, not a model. A "second opinion" agreement signal was found to have been derived, indirectly, from the Judge's own output. It therefore agreed with the Judge by construction and inflated the confidence score. The clue was that it performed suspiciously well. It was removed from the score entirely.`,
        ],
      },
      {
        heading: "Verifier Discrimination",
        paras: [
          `For the Verifier's scores to be meaningful, the Verifier must be capable of distinguishing good answers from bad ones. This was tested directly by presenting deliberately corrupted answers alongside intact ones. The Verifier scored intact answers in the range 77 to 80 out of 80, and corrupted answers between 0 and 8, a separation of roughly 74.5 points.`,
          `This result is important for interpreting the bias findings that follow. It establishes that the evaluators are not simply assigning high scores indiscriminately; they discriminate strongly when there is something to discriminate.`,
        ],
      },
      {
        heading: "Threshold Calibration Under Censored Data",
        paras: [
          `The regeneration threshold cannot be calibrated naively, because the data available to calibrate it are censored by the threshold itself. Answers above the operating threshold are never regenerated, so no observation exists of whether regenerating them would have helped. Fitting to the visible data alone estimates the wrong quantity.`,
          `The remedy was a control group. A random fraction of answers that had already passed the gate were regenerated anyway, purely for measurement. This yields unbiased observations above the threshold at a modest cost in computation.`,
          `Three independent analyses were then applied to the resulting data. A two-proportion significance test confirmed that the improvement rate differs across confidence bands beyond what sampling noise explains, at p = 0.011. A receiver-operating-characteristic analysis maximising Youden's J statistic placed the point optimum at 0.70, with an area under the curve of 0.629. A bootstrap over 2,000 resamples gave a median optimal cutoff of 0.72, a modal value of 0.70, and a 95 per cent confidence interval of [0.69, 0.75].`,
        ],
        table: {
          caption: "Table 5.2: Threshold operating points",
          head: ["Threshold", "Youden's J", "Sensitivity", "Specificity", "Status"],
          rows: [
            ["0.70", "0.190", "—", "—", "ROC point optimum"],
            ["0.72", "0.170", "66.7%", "50.3%", "Adopted (bootstrap median)"],
            ["0.75", "0.169", "86.7%", "30.2%", "Earlier recall-first choice"],
          ],
        },
        paras2: [
          `The J statistic is nearly flat across 0.70 to 0.74, which means values in that band are statistically indistinguishable and the choice among them is a policy decision rather than a statistical one. The adopted value of 0.72 is the bootstrap median and sits in the middle of the plateau, balancing sensitivity against specificity. The earlier value of 0.75 sat at the very upper edge of the confidence interval and traded specificity heavily for recall.`,
        ],
      },
      {
        heading: "Evaluator Bias: Position and Identity",
        paras: [
          `The most substantial experimental result of the project concerns the Combiner, the agent that synthesises the final answer. For most of the project the Combiner was llama3, which is also one of the two generators. It was therefore merging its own writing against another model's on every question.`,
          `The effect was measured across all 5,000 final records by embedding the two candidate answers and the final answer, and determining which candidate the final answer sat closer to. Crossing prompt position against model identity separates two effects that are otherwise conflated.`,
        ],
        table: {
          caption: "Table 5.3: Combiner bias decomposition",
          head: ["Effect", "Magnitude", "Significance"],
          rows: [
            ["Identity (own-answer preference, position fixed)", "+18.1 pp", "p ≈ 1.7 × 10⁻⁸⁹"],
            ["Position (first-slot preference, identity averaged)", "+10.8 pp", "p ≈ 5.7 × 10⁻⁵³"],
            ["Length (candidate confound)", "r = +0.029", "Not supported"],
          ],
        },
        paras2: [
          `Length was a credible alternative explanation and was tested rather than dismissed. The llama3 generator does write longer answers on average, 366 words against 317. However the correlation between length advantage and preference is only +0.029, and the effect persists at 61.1 per cent among length-matched pairs, so length does not account for it.`,
          `The mechanism proved more specific than simple style recognition. The preference is conditional on the Judge agreeing: where the Judge selected the llama3 answer, the final answer favoured it 69.4 per cent of the time, but where the Judge selected the other candidate, the figure was 50.7 per cent, which is not statistically distinguishable from chance. The Combiner followed the Judge 69.4 per cent of the time when the Judge pointed at its own output, and only 49.3 per cent when it pointed elsewhere - a twenty point asymmetry in obedience. In the 1,815 records where the llama3 answer occupied the first slot and the Judge had selected the other candidate, the final answer still landed closer to llama3 in 64.0 per cent of cases.`,
          `The Combiner was consequently reassigned to gemma2:9b, a model that is neither generator, nor the Verifier, nor the Judge, which removes the identity term by construction rather than reducing it. A controlled replay on a held-out sample, with every input frozen and only the Combiner model varied, indicates that the replacement is close to position-neutral where the original preferred the first slot in roughly four cases out of five. That replay is at the time of writing partially complete and its figures are therefore reported as provisional.`,
          `The position effect is not resolved by changing the model and is recorded as an open problem. Chapter 7 discusses extractive selection as a candidate remedy that would eliminate it by construction.`,
        ],
      },
      {
        heading: "Measurement Errors Detected and Corrected",
        paras: [
          `Four errors were identified during the project that would have corrupted reported results had they gone unnoticed. They are recorded here because a report that presents only its successes misrepresents how the work was actually done, and because each was found by the same habit: a result that looked too clean was checked rather than accepted.`,
        ],
        table: {
          caption: "Table 5.4: Measurement errors and corrections",
          head: ["Error", "Consequence if unnoticed", "Correction"],
          rows: [
            ["Evaluator model reported a rubric total inconsistent with its own criterion scores", "Inflated or deflated confidence scores", "Totals recomputed from criterion scores"],
            ["A 'second opinion' signal was derived from the Judge's own output", "Self-agreement inflating confidence", "Signal removed from the score"],
            ["Threshold analysis applied a single sampling weight although the control rate changed mid-run", "Mis-weighted threshold estimate", "Per-record historical weighting applied"],
            ["Restart-orphaned attempts produced duplicate final rows for four questions", "Aggregate statistics over a corpus of the wrong size", "Rows corrected and the write targeted by unique row identifier"],
          ],
        },
        paras2: [
          `The fourth deserves comment. Attempts were being marked final by matching on question index and attempt number, a pair that appears unique but is not: if the process is interrupted between inserting an attempt and marking it, the question is reprocessed on restart and its fresh attempt shares the same pair. The fix was to return the row identifier at insertion and target the update by that identifier alone.`,
        ],
      },
    ],
  },

  {
    title: "Conclusion and Recommendations",
    sections: [
      {
        heading: "Conclusions",
        paras: [
          `This project set out to determine whether a locally hosted question-answering system can be validated without human-annotated ground truth, and the answer is a qualified yes. Internal consistency, evaluator discrimination, relative improvement under regeneration and the calibration of an operating threshold are all achievable label-free. Absolute factual accuracy is not, and no such claim is made.`,
          `The threshold calibration demonstrates that a parameter which is commonly chosen by intuition can be derived from data even when those data are censored by the parameter itself, provided a control group is deliberately introduced. Three independent statistical routes converged on the same narrow band, and the adopted value of 0.72 is the bootstrap median of that band.`,
          `The most significant finding is methodological. Turning the measurement apparatus on itself revealed that the synthesising agent preferred its own generated answers by 18.1 percentage points, with a separate 10.8 point preference for the first prompt slot, and that neither effect is explained by answer length. This was not a suspected weakness that was confirmed; it was a quantified defect in the project's own prior design, found by measurement, and corrected.`,
          `A system of this kind is therefore best understood not as a correctness oracle but as a calibrated quality gate: it reliably separates weaker answers from stronger ones and acts on that separation, while remaining honest about what it cannot certify.`,
        ],
      },
      {
        heading: "Recommendations",
        bullets: [
          "No model should both generate and evaluate within an evaluation pipeline. The cost of violating this is measurable and was measured here at 18.1 percentage points.",
          "Randomising presentation order is necessary but not sufficient. It makes a position effect unbiased with respect to identity; it does not remove the effect, and systems should state which of the two they have achieved.",
          "Any threshold governing a feedback loop should be calibrated against a control group, because the loop censors exactly the observations needed to calibrate it.",
          "Evaluator arithmetic should be recomputed rather than trusted, and any signal that performs unexpectedly well should be traced to its source before being relied upon.",
          "Measurement errors should be documented rather than quietly corrected; several of the most useful findings in this project originated in investigating an anomaly.",
        ],
      },
    ],
  },

  {
    title: "Future Scope",
    sections: [
      {
        heading: "Eliminating the Position Effect by Construction",
        paras: [
          `The residual position effect arises because a generative synthesiser reads a prompt in order. An extractive approach would not: maximal marginal relevance selects sentences by relevance and non-redundancy, scoring content rather than position, which removes both the position and identity terms by construction and makes the contribution of each source directly countable rather than inferred.`,
          `One property of maximal marginal relevance must be addressed before adopting it. Its diversity term rewards selecting sentences that are dissimilar to those already chosen, and a contradiction is maximally dissimilar - so the method is structurally inclined to include both sides of a factual disagreement, which is the opposite of what a synthesiser should do. A hybrid in which extraction selects the content and a small model performs only surface realisation, forbidden from adding or removing material, would retain the bias elimination while preserving fluency.`,
        ],
      },
      {
        heading: "A Human-Annotated Validation Study",
        paras: [
          `The label-free methodology establishes internal properties but cannot establish absolute accuracy. A blind, balanced study in which human raters score a stratified sample of answers would allow the confidence score to be validated against human judgement and would convert the system's relative claims into absolute ones. A rating harness and a pre-registered analysis for such a study have been prepared.`,
        ],
      },
      {
        heading: "Calibrating the Retrieval Threshold",
        paras: [
          `The retrieval component applies a minimum similarity threshold below which retrieved material is excluded, so that an unrelated document cannot contaminate an answer. That threshold has not yet received the same treatment as the confidence threshold. Retrieval decisions are now logged, which provides the data required to calibrate it by the same control-group method.`,
        ],
      },
      {
        heading: "Distillation of the Judge",
        paras: [
          `Evaluation latency is dominated by the Judge. Training a small regression model to replicate the Judge's rubric scores from the question-answer pair would reduce evaluation to milliseconds and permit the pipeline to run at interactive speed. This was explored and set aside in favour of establishing the validation methodology first; the corpus generated by this project is well suited to it, since it contains per-criterion scores for 8,432 attempts.`,
        ],
      },
      {
        heading: "Generalisation",
        paras: [
          `The protocol - blind evaluation, discrimination testing, control-group calibration, bias decomposition - is model-agnostic and domain-agnostic. The tuned values are not. Re-deriving them on a different model set would test whether the method transfers while the numbers do not, which is the expected outcome and is stated here as a hypothesis rather than a result.`,
        ],
      },
    ],
  },
];

const REFERENCES = [
  "L. Zheng et al., “Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena,” in Advances in Neural Information Processing Systems (NeurIPS), 2023.",
  "Y. Liu et al., “G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment,” in Proc. EMNLP, 2023.",
  "S. Kim et al., “Prometheus: Inducing Fine-grained Evaluation Capability in Language Models,” in Proc. ICLR, 2024.",
  "T. Zhang, V. Kishore, F. Wu, K. Q. Weinberger and Y. Artzi, “BERTScore: Evaluating Text Generation with BERT,” in Proc. ICLR, 2020.",
  "K. Papineni, S. Roukos, T. Ward and W. Zhu, “BLEU: a Method for Automatic Evaluation of Machine Translation,” in Proc. ACL, 2002.",
  "C.-Y. Lin, “ROUGE: A Package for Automatic Evaluation of Summaries,” in Text Summarization Branches Out, ACL Workshop, 2004.",
  "Q. Wu et al., “AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation,” arXiv:2308.08155, 2023.",
  "P. Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” in Advances in Neural Information Processing Systems (NeurIPS), 2020.",
  "N. Reimers and I. Gurevych, “Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks,” in Proc. EMNLP, 2019.",
  "J. Devlin, M.-W. Chang, K. Lee and K. Toutanova, “BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding,” in Proc. NAACL-HLT, 2019.",
  "W. J. Youden, “Index for rating diagnostic tests,” Cancer, vol. 3, no. 1, pp. 32–35, 1950.",
  "B. Efron and R. J. Tibshirani, An Introduction to the Bootstrap. New York: Chapman & Hall, 1993.",
  "E. B. Wilson, “Probable inference, the law of succession, and statistical inference,” Journal of the American Statistical Association, vol. 22, no. 158, pp. 209–212, 1927.",
  "J. Carbonell and J. Goldstein, “The use of MMR, diversity-based reranking for reordering documents and producing summaries,” in Proc. ACM SIGIR, 1998.",
  "AI@Meta, “Llama 3 Model Card,” 2024.",
  "A. Q. Jiang et al., “Mistral 7B,” arXiv:2310.06825, 2023.",
  "M. Abdin et al., “Phi-3 Technical Report: A Highly Capable Language Model Locally on Your Phone,” arXiv:2404.14219, 2024.",
  "Gemma Team, “Gemma 2: Improving Open Language Models at a Practical Size,” arXiv:2408.00118, 2024.",
  "A. Yang et al., “Qwen2.5 Technical Report,” arXiv:2412.15115, 2024.",
  "D. Vrandečić and M. Krötzsch, “Wikidata: a free collaborative knowledgebase,” Communications of the ACM, vol. 57, no. 10, pp. 78–85, 2014.",
];

const APPENDICES = [
  {
    title: "Appendix A: Agent Prompt Configuration",
    paras: [
      `Each agent is instantiated with a role description, a model identifier, a decoding temperature and a token budget, as given in Table 3.1. Evaluator prompts are brand-blind: they refer to the two candidates only as "Answer 1" and "Answer 2", and contain no reference to which system produced either.`,
      `The Judge is additionally configured with internal reasoning disabled. The Combiner is instructed to merge and polish without introducing information absent from the source answers, and to produce at most 150 words.`,
    ],
  },
  {
    title: "Appendix B: Confidence Score Computation",
    paras: [
      `The weighted score is the sum over available signals of the signal value multiplied by its renormalised weight. Signals are each mapped to the range zero to one before weighting; the Judge rubric total is divided by eighty. Where a signal is unavailable its weight is redistributed proportionally across the remaining signals, so the score remains on the same scale regardless of how many signals contributed.`,
    ],
  },
  {
    title: "Appendix C: Threshold Calibration Procedure",
    paras: [
      `The calibration proceeds in four steps. First, a random fraction of answers passing the gate are regenerated regardless, forming the control group. Second, each record is weighted by the control probability actually in force when it was generated, since that probability changed during the run. Third, the receiver-operating-characteristic curve of the confidence score against observed improvement is computed and Youden's J maximised. Fourth, the procedure is repeated over 2,000 bootstrap resamples to obtain a confidence interval for the optimal cutoff.`,
    ],
  },
  {
    title: "Appendix D: Combiner Bias Measurement Procedure",
    paras: [
      `For each final record the two candidate answers and the final answer are embedded with the same encoder used elsewhere in the pipeline. The difference in cosine similarity between the final answer and each candidate gives a signed preference. Mapping that preference onto model identity using the recorded position mapping yields the identity lean; leaving it in slot terms yields the position lean. Crossing the two, and further crossing by the Judge's verdict, separates effects that are conflated in the marginal figures.`,
      `The controlled replay freezes the question, both candidates and both evaluator outputs, and varies only the Combiner model and the presentation order. When the order is swapped, the "Answer 1" and "Answer 2" references inside the evaluator text are remapped accordingly; without that remapping the Combiner would receive a verdict pointing at the wrong candidate, which would contaminate the measurement.`,
    ],
  },
];

module.exports = {
  PLACEHOLDER, TITLE, TITLE_SENTENCE, ACKNOWLEDGEMENT, ABSTRACT,
  ABBREVIATIONS, FIGURES, TABLES, CHAPTERS, REFERENCES, APPENDICES,
};
