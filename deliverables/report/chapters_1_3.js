/**
 * deliverables/report/chapters_1_3.js
 * -----------------------------------
 * Chapters 1-3: Introduction, Literature Review, System Architecture.
 *
 * Section shape: { heading, paras[], bullets[], table{}, paras2[], figure }
 * `figure` names a key in FIGURES (content.js) and places it after the section.
 */

const CH1 = {
  title: "Introduction",
  sections: [
    {
      heading: "Background",
      paras: [
        `Large Language Models have moved in a very short time from research artefacts to components that ordinary software is expected to depend upon. They summarise documents, answer questions, draft code and power customer-facing assistants. Their central practical weakness is well known and has not been solved: they generate text that is fluent, confident and internally coherent whether or not it is correct.`,
        `This failure mode is qualitatively different from the failures engineers are used to. A database that cannot reach its host raises an exception. A parser given malformed input reports a syntax error. A language model given a question it cannot answer does not raise anything at all; it produces a well-formed paragraph in the same register as a correct one, and the burden of detecting the error falls entirely on the reader. A wrong answer is not merely possible, it is indistinguishable in tone from a right one.`,
        `The response that has emerged across industry and research is to use a second model as an evaluator, a pattern commonly called LLM-as-a-judge. Its appeal is that it scales. Evaluation becomes a function call rather than a human reading answers, which means it can run on every output rather than on a sample. It is also, however, a measurement instrument built from the same material as the thing being measured, and a growing body of work shows that such instruments carry systematic biases of their own.`,
        `A second constraint motivates this work specifically. Much of the published evaluation literature assumes access either to human preference labels or to a frontier commercial model acting as a reference judge. Both assumptions fail for a department laboratory, which has neither an annotation budget nor an API budget, and both fail for any deployment handling data that cannot leave the institution - medical records, student records, internal documents. This project therefore restricts itself to models that run locally, on a single workstation, with no external paid interfaces of any kind.`,
      ],
    },
    {
      heading: "Motivation",
      paras: [
        `Two observations motivated the specific direction this project took.`,
        `The first is that quality assurance for language model outputs is usually discussed as though a ground truth were available. Benchmarks publish accuracy figures against reference answers; leaderboards rank systems by agreement with human preference. In a deployed system answering open-ended questions from real users, neither exists. There is no reference answer to compare against, and no annotator standing by. If quality can only be assessed where labels exist, then it cannot be assessed where it actually matters.`,
        `The second is that the evaluation machinery is rarely itself evaluated. A pipeline that uses one model to grade another produces numbers, and those numbers are generally reported as measurements. But if the grader systematically prefers answers in a particular prompt position, or prefers text written in its own style, then the numbers are contaminated, and any improvement measured against them may be an artefact of the instrument rather than a change in the system. This is not a hypothetical concern: it is documented in the literature, and as Chapter 5 shows, it was present and substantial in this project's own first design.`,
        `The combination suggests a research question that is narrower than "how good is this system" and considerably more tractable: can the quality of a locally hosted question-answering system be validated, and improved, when no human-annotated ground truth is available - and can the validation machinery be held to the same standard of scrutiny it applies to the system it measures?`,
      ],
    },
    {
      heading: "Problem Statement",
      paras: [
        `Given a question-answering system assembled from locally hosted Large Language Models, and given no human-annotated ground truth for its outputs, determine whether the quality of its answers can be validated, quantified and improved - and determine the extent to which the validation machinery itself is biased.`,
        `The second clause is not decorative. If the evaluation apparatus silently prefers one model, one answer position or one writing style, then every quality figure it produces is contaminated, and improvements measured against it may be artefacts. A validation system that cannot be turned on itself is of limited scientific value.`,
        `Three sub-problems follow. First, a quality signal must be constructed from evidence that is available without labels. Second, any decision threshold applied to that signal must be chosen from data rather than intuition - and the obvious way to do so fails, because a threshold that gates a feedback loop censors exactly the observations needed to calibrate it. Third, the apparatus must be measured for position and identity bias with the confounds properly controlled, which requires an experimental design rather than an inspection.`,
      ],
    },
    {
      heading: "Objectives",
      bullets: [
        "Design and implement a multi-agent question-answering pipeline in which generation and evaluation are performed by different models, running entirely offline on local hardware.",
        "Define a multi-signal confidence score that combines model-internal and external evidence, so that no single signal dominates the quality decision.",
        "Establish an automatic regeneration mechanism gated on that confidence score, with a bounded number of attempts and a guarantee that regeneration cannot degrade the shipped answer.",
        "Calibrate the regeneration threshold from data rather than intuition, accounting for the fact that the available observations are censored by the gate itself.",
        "Generate a corpus large enough for the calibration to be statistically meaningful, without human annotation, and resilient enough to survive a multi-day unattended run.",
        "Measure the validation apparatus for position bias and self-preference bias, with answer length controlled as a competing explanation, and correct what is found.",
        "Document measurement errors made during the project, including those caught before they influenced any conclusion.",
      ],
    },
    {
      heading: "Scope",
      paras: [
        `The system is scoped to open-ended factual and technical question answering in English, over ten general knowledge domains: Science and Technology, History and Geography, Health and Medicine, Economics and Finance, Philosophy and Ethics, Environment and Climate, Psychology and Behaviour, Society and Culture, Mathematics and Logic, and Space and Astronomy.`,
        `It is not scoped to mathematical reasoning requiring symbolic manipulation, to code generation, to multi-turn dialogue, or to languages other than English. An optional retrieval mode accepts user-supplied documents, but document-grounded question answering is a secondary capability rather than the object of study.`,
      ],
    },
    {
      heading: "Limitations",
      paras: [
        `Three limitations are stated at the outset rather than deferred to the conclusion, because they bound what the results in Chapter 5 can be taken to mean.`,
        `First, the validation is label-free. This means it can establish internal consistency, evaluator discrimination, relative improvement under regeneration, and the calibration of an operating threshold. It cannot establish absolute factual accuracy. A claim of the form "the system is 86 per cent correct" is not supported by this methodology and is not made anywhere in this report.`,
        `Second, the tuned values are specific to this model set. The threshold, the signal weights and the choice of judge were derived against these six models on this corpus. The protocol is expected to transfer; the numbers are not. That expectation has not been tested and is stated as a hypothesis in Chapter 8.`,
        `Third, the position effect documented in Section 5.8 is mitigated but not eliminated. Randomising presentation order makes the effect unbiased with respect to model identity, and changing the synthesising model removes the identity component, but a generative synthesiser still over-weights whatever it reads first. This is recorded as an open problem rather than presented as solved.`,
      ],
    },
    {
      heading: "Contributions",
      bullets: [
        "A label-free validation methodology for a multi-model question-answering pipeline, requiring neither human annotation nor a commercial reference judge.",
        "A technique for calibrating a decision threshold under censoring, by deliberately injecting a control group of observations the gate would otherwise never produce.",
        "A threshold derived by three independent statistical routes - a two-proportion significance test, ROC analysis with Youden's J, and a 2,000-sample bootstrap - which converge on one narrow band.",
        "A decomposition of synthesiser bias into position and identity components, with answer length tested and excluded as a competing explanation, which overturned the project's own prior architectural decision.",
        "A documented account of four measurement errors detected during the work, including the reasoning that exposed each, offered as a contribution rather than concealed.",
      ],
    },
    {
      heading: "Organisation of the Report",
      paras: [
        `Chapter 2 surveys the literature on automated evaluation of generated text, on the documented biases of model-based evaluators, and on the statistical methods used later for threshold selection, and identifies the gap this work addresses. Chapter 3 presents the system architecture: the six stages, the rubric, the confidence score and the bias controls, with the reasoning behind each design decision. Chapter 4 describes the implementation, including the data generation harness and the resilience mechanisms that an unattended multi-day experimental run required. Chapter 5 presents the experiments and results, and is the substantive chapter: corpus characteristics, judge selection, verifier discrimination, threshold calibration, the combiner bias investigation, and the measurement errors detected along the way. Chapter 6 reports the system testing and validation that establishes the implementation behaves as specified, which is a different kind of evidence from the experiments of Chapter 5 and is kept separate from them. Chapter 7 draws conclusions and makes recommendations. Chapter 8 sets out future scope, including the extractive approach that would eliminate the residual position effect by construction.`,
      ],
    },
  ],
};

const CH2 = {
  title: "Literature Review",
  sections: [
    {
      heading: "Overlap-Based Automatic Metrics",
      paras: [
        `The earliest widely adopted automatic metrics for generated text, BLEU and ROUGE, measure n-gram overlap against one or more reference texts. BLEU was designed for machine translation and rewards precision of n-grams against a reference; ROUGE was designed for summarisation and emphasises recall. Both became standard because they are cheap, deterministic and correlate acceptably with human judgement on the tasks they were designed for.`,
        `They carry an assumption that does not transfer to open-ended question answering: that a good output resembles a specific reference output. For a question admitting many correct phrasings - and most open-ended questions do - overlap with any single reference is a weak proxy for quality. A correct answer phrased differently from the reference scores poorly; an incorrect answer that happens to reuse the reference's vocabulary scores well.`,
        `For this project the objection is more fundamental still. There is no reference. The methodology is label-free by construction, so a reference-based metric is not merely imprecise here, it is inapplicable.`,
      ],
    },
    {
      heading: "Embedding-Based Metrics",
      paras: [
        `Embedding-based metrics improve on surface overlap by comparing contextual representations rather than tokens. BERTScore computes a similarity between the contextual embeddings of candidate and reference tokens, which tolerates paraphrase: a correct answer using different words is no longer penalised simply for using them.`,
        `Sentence-BERT provides the sentence-level embeddings that make such comparisons efficient at scale, by fine-tuning a transformer with a siamese objective so that sentence vectors can be compared directly with cosine similarity rather than requiring a cross-encoder pass per pair.`,
        `These remain reference-based, and therefore still require a reference answer this project does not have. Embedding similarity is nevertheless used here, but in two restricted roles that do not require one: as a relevance signal between the question and the answer, and as an agreement signal between the two independently generated candidate answers.`,
        `The distinction between "similarity to a reference" and "similarity between two candidates" is not a technicality, and an early version of this project violated it. Section 5.4 documents what happened when a similarity signal was computed against the combined final answer: because the same model both wrote one candidate and drafted the final answer, the metric measured self-similarity and rewarded it. The signal was removed.`,
      ],
    },
    {
      heading: "LLM-as-a-Judge",
      paras: [
        `Using a strong language model to grade the outputs of another has become the dominant evaluation strategy for open-ended generation. Work on MT-Bench and Chatbot Arena established that model judges correlate reasonably well with human preference at the aggregate level, which is what made the approach credible enough to adopt widely.`,
        `Subsequent work refined the pattern. G-Eval uses chain-of-thought prompting with a form-filling paradigm to obtain more stable numeric scores, on the observation that asking a model to reason before scoring reduces variance relative to asking for a bare number. Prometheus demonstrated that an open, comparatively small model can be fine-tuned on evaluation rubrics to approach the grading behaviour of a much larger proprietary one, which is directly relevant to any locally hosted deployment: it establishes that a capable judge need not be a frontier model.`,
        `This project adopts the structured-rubric element of that line of work. Both evaluators score against an explicit eight-criterion rubric with a justification required per criterion, rather than producing a holistic preference. Structured scoring is what makes two independent evaluators comparable, and therefore what makes their agreement a usable signal.`,
      ],
    },
    {
      heading: "Documented Biases of Model-Based Evaluators",
      paras: [
        `The same literature that established LLM-as-a-judge also documents its failure modes, and these are the direct motivation for the bias controls described in Section 3.9 and the measurements in Section 5.8.`,
      ],
      bullets: [
        "Position bias: evaluators favour candidates presented in a particular slot, independent of content. The effect is reproducible and large enough to reverse a verdict, which is why presentation order must be randomised rather than fixed.",
        "Verbosity bias: longer answers are preferred, independent of whether the additional length adds information. Any claimed quality effect must therefore be tested against length as a competing explanation.",
        "Self-enhancement bias: evaluators prefer text generated by themselves or by models of their own family. This is the reason no model in this system both generates and evaluates.",
      ],
      paras2: [
        `The practical consequence is that an evaluation architecture cannot be assumed to be neutral because it was intended to be. Neutrality is an empirical property and must be measured. Chapter 5 measures it, and finds that this project's own first design was not neutral.`,
      ],
    },
    {
      heading: "Multi-Agent Orchestration",
      paras: [
        `Frameworks such as AutoGen popularised the decomposition of a task across several cooperating model-backed agents with distinct roles, communicating through structured messages. The argument is twofold: specialised roles with narrow prompts outperform a single model asked to do everything at once, and disagreement between agents is itself informative.`,
        `This project adopts the role decomposition and rejects one common convenience of these frameworks: reusing the same underlying model for several roles. Reuse is attractive operationally - fewer model weights to hold, fewer downloads, less memory pressure - and it is the default in many published examples. But if the generator and the judge are the same model, the evaluation is not independent, and the architecture quietly reintroduces exactly the self-preference bias the literature warns about.`,
        `Section 5.8 quantifies what that convenience costs when it is measured rather than assumed away. The cost was 18.1 percentage points of preference for the model's own output, which is not a rounding error.`,
      ],
    },
    {
      heading: "Retrieval-Augmented Generation and External Grounding",
      paras: [
        `Retrieval-Augmented Generation reduces hallucination by conditioning generation on retrieved documents rather than relying solely on parametric knowledge. It is relevant to this project in two ways.`,
        `First, as an optional input mode: users may upload documents, which are chunked, embedded and retrieved by similarity at query time. Second, and more importantly, as the conceptual basis for the external fact-checking signals. The system queries Wikipedia and Wikidata as two structurally different encyclopedia sources - one prose, one a structured knowledge graph - so that corroboration comes from outside the model family rather than from another model's opinion.`,
        `The choice of two structurally different sources is deliberate. Two prose sources would share failure modes; a prose source and a structured source fail differently, so agreement between them is stronger evidence than agreement between two of a kind.`,
      ],
    },
    {
      heading: "Threshold Selection and Diagnostic Statistics",
      paras: [
        `Choosing an operating point on a continuous score is a problem with a mature literature in diagnostic testing, and this project borrows from it directly rather than inventing a procedure.`,
        `The receiver operating characteristic curve plots sensitivity against one minus specificity across all candidate cutoffs, and the area under it summarises whether the score discriminates at all, independent of any particular cutoff. Youden's J statistic, defined as sensitivity plus specificity minus one, is the standard criterion for selecting a single optimal cutoff from such a curve, corresponding geometrically to the point of maximum vertical distance from the diagonal.`,
        `The bootstrap provides a confidence interval for that optimum by resampling the data with replacement and recomputing the optimum in each resample, which answers a question a single point estimate cannot: whether the chosen cutoff is stable or an artefact of this particular sample.`,
        `One further element is required here and is not part of the standard recipe. The data in this project are not a simple random sample: they arise from a stratified design in which sub-threshold answers are observed with certainty and above-threshold answers only with a small probability. Inverse-probability-of-sampling weighting, standard in case-control analysis, corrects for this. Section 5.7 explains why omitting it produced a nonsensical result, and Section 5.10 records that the error was caught before it was reported.`,
      ],
    },
    {
      heading: "Self-Consistency and Ensemble Approaches",
      paras: [
        `A related line of work improves reliability by sampling a model several times and aggregating, rather than by introducing a second evaluator. Self-consistency decoding samples multiple reasoning paths and takes a majority vote over the final answers, on the observation that correct reasoning converges while errors diverge.`,
        `The architecture in this project is an ensemble of a particular kind, and the difference from self-consistency is worth stating because it is easy to conflate the two. Self-consistency samples one model repeatedly, so its diversity is sampling noise around a single model's beliefs; a systematic error in that model appears in every sample and the majority vote entrenches it. This system samples two different models from different families, so a systematic error in one is not shared by the other, and disagreement between them is informative rather than merely noisy.`,
        `That difference is what licenses treating cross-model agreement as a corroboration signal at all. Agreement between two samples of the same model would carry almost no information about correctness. The corpus bears out the diversity: mean pairwise BERTScore between the two candidates is 0.220, reported in Section 5.6, which is low enough to confirm the two generators are genuinely producing different text rather than paraphrasing a shared prior.`,
      ],
    },
    {
      heading: "Calibration and Uncertainty",
      paras: [
        `The confidence score produced by this system invites comparison with the calibration literature in machine learning, where a model is said to be calibrated if its stated confidence matches its empirical accuracy - of all predictions made with 70 per cent confidence, 70 per cent should be correct.`,
        `That standard cannot be applied here, and the reason is instructive rather than merely inconvenient. Calibration in that sense requires ground-truth correctness to compare the confidence against, which is exactly what this project does not have. The score produced here is therefore not a calibrated probability of correctness, and is deliberately never described as one.`,
        `What it is instead is a ranked quality signal with a calibrated decision threshold. The distinction matters for how the output should be read: a score of 0.80 means this answer is better supported than one scoring 0.60, not that it is 80 per cent likely to be true. The threshold is calibrated in the diagnostic-testing sense of Section 2.7 - an operating point chosen to balance sensitivity against specificity on an observable outcome - not in the probabilistic sense.`,
        `Establishing genuine calibration would require the human-annotated study proposed in Chapter 8, which is the shortest path from the relative claims this report makes to the absolute ones it declines to make.`,
      ],
    },
    {
      heading: "Comparative Summary",
      table: {
        caption: "Table 2.1: Evaluation approaches and their applicability to this project",
        head: ["Approach", "Needs reference?", "Needs human labels?", "Needs external API?", "Used here"],
        rows: [
          ["BLEU / ROUGE", "Yes", "No", "No", "No - no reference exists"],
          ["BERTScore vs reference", "Yes", "No", "No", "No - no reference exists"],
          ["BERTScore between candidates", "No", "No", "No", "Yes - agreement signal"],
          ["Human preference rating", "No", "Yes", "No", "No - no annotation budget"],
          ["Commercial LLM judge", "No", "No", "Yes", "No - offline constraint"],
          ["Local LLM judge, rubric-based", "No", "No", "No", "Yes - Verifier and Judge"],
          ["External encyclopedia check", "No", "No", "No (public, free)", "Yes - Wikipedia, Wikidata"],
        ],
      },
    },
    {
      heading: "Identified Gap",
      paras: [
        `The literature establishes that model-based evaluation works at aggregate scale, and that it is biased in known directions. What is comparatively sparse is a complete, reproducible account of building such a system under a hard no-ground-truth, no-external-API constraint, and then turning the measurement apparatus on itself to quantify its own bias with the confounds properly controlled.`,
        `Most reported bias studies examine a judge in isolation, on a curated benchmark, with the biases known in advance. This project examines an evaluator embedded in a working pipeline, on a corpus the pipeline generated itself, where the bias was not suspected until it was measured - and where the measurement changed the architecture.`,
        `The specific contributions against that gap are listed in Section 1.7 and demonstrated in Chapter 5.`,
      ],
    },
  ],
};

const CH3 = {
  title: "System Architecture",
  sections: [
    {
      heading: "Design Principles",
      paras: [
        `Three principles constrain the architecture, and most of the specific decisions in this chapter follow from one of them.`,
      ],
      bullets: [
        "Separation of concerns between generation and evaluation. No model both produces an answer and judges or merges it. This is the principle that the original design violated at the combiner, and Section 5.8 reports the cost.",
        "Blindness. Evaluators never learn which system produced which candidate, and the mapping of candidates to prompt positions is randomised per question.",
        "Plurality of evidence. The quality decision rests on six signals of different kinds - a model's rubric judgement, geometric similarity, cross-model agreement, inter-evaluator agreement, and two external encyclopedia checks - so that no single failing signal can dominate the outcome.",
      ],
    },
    {
      heading: "Pipeline Overview",
      paras: [
        `The pipeline executes six stages per question. Stages 1 and 2 generate two candidate answers independently. Stage 3 applies the Verifier. Stage 4 computes semantic and external signals. Stage 5 applies the Judge. Stage 6 synthesises the final answer from the best attempt. Between stages 5 and 6 the weighted confidence score is computed and the regeneration gate evaluated; if the gate fails, control returns to stages 1 and 2 for a further attempt.`,
        `Stages 3 and 4 run concurrently with one another, as do stages 1 and 2, because they have no data dependency. Stage 5 runs strictly after stage 3 despite also being independent of it, for reasons of memory rather than correctness; Section 4.4 explains.`,
      ],
      figure: "architecture",
    },
    {
      heading: "Agent Roles and Model Assignment",
      paras: [
        `Each role is served by a deliberately chosen model. The two generators are different model families, so that their errors are less likely to correlate - two models from the same family trained on overlapping data tend to be wrong in the same places, which would make their agreement worthless as a signal. The Verifier and the Judge are each distinct from the generators and from each other. The Combiner is distinct from every generator, for reasons established empirically in Section 5.8 rather than assumed at design time.`,
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
        `The temperature assignments follow the role. Generators run at 0.7, because diversity between the two candidates is the point - two identical answers would make the comparison vacuous. Evaluators run at 0.1, because scoring should be as close to deterministic as the runtime allows; an evaluator that returns a different score for the same input on consecutive calls cannot support any claim about the system. The Combiner sits between at 0.4: synthesis needs enough freedom to produce fluent connective prose, but not enough to invent.`,
        `The Judge runs with internal reasoning disabled. With reasoning enabled, qwen3.5:9b consumes its entire generation budget on an internal deliberation and returns an empty response on long rubric prompts. The failure is silent in the worst way: the pipeline receives a well-formed but empty reply rather than an error, so the symptom is missing scores rather than a crash. Disabling reasoning resolved it.`,
      ],
    },
    {
      heading: "The Eight-Factor Rubric",
      paras: [
        `Both the Verifier and the Judge score each candidate answer against the same eight criteria, each on a scale of zero to ten, for a maximum of eighty points per answer. Using an identical rubric for two independent evaluators is what makes their agreement a meaningful signal: if they were scoring different things, agreement would mean nothing.`,
      ],
      table: {
        caption: "Table 3.2: The eight-factor evaluation rubric",
        head: ["Criterion", "What it measures", "Typical failure it catches"],
        rows: [
          ["Factual Correctness", "Whether the stated facts are accurate", "Confident but wrong dates, figures, names"],
          ["Question Relevance", "Whether the answer addresses what was asked", "Answering an adjacent, easier question"],
          ["Context Relevance", "Consistency with supplied reference material", "Ignoring or contradicting provided documents"],
          ["Faithfulness", "Whether claims are supportable rather than invented", "Plausible but unsupported specifics"],
          ["Completeness", "Whether the answer covers the question adequately", "Addressing one half of a two-part question"],
          ["Hallucination-Free", "Absence of fabricated specifics", "Invented citations, statistics, quotations"],
          ["Clarity", "Structure and readability", "A correct answer the reader cannot follow"],
          ["Consistency", "Absence of internal self-contradiction", "Asserting X and later implying not-X"],
        ],
      },
      paras2: [
        `Each criterion requires a one-sentence justification alongside its numeric score. This is not for display: requiring a justification measurably reduces the tendency to assign the same score to every criterion, which is the degenerate behaviour that disqualified one candidate judge model in Section 5.3.`,
        `Rubric totals are recomputed from the individual criterion scores rather than taken from the model's own stated total. This is not defensive programming for its own sake. Evaluator models were observed stating totals that did not match the sum of the scores they had just produced, in one case reporting a total of 55 against a stated maximum of 40. Arithmetic is not delegated to the model.`,
      ],
    },
    {
      heading: "Semantic and Agreement Signals",
      paras: [
        `Two signals are computed without any language model. Semantic similarity is the cosine similarity between the embedding of the question and the embedding of the answer, using all-MiniLM-L6-v2. It measures relevance - whether the answer is about what was asked - and not correctness; a fluent, on-topic, entirely false answer scores well here, which is precisely why it carries only modest weight.`,
        `Model agreement is the pairwise BERTScore between the two candidate answers. Two models prompted independently, from different families, arriving at substantively similar answers is weak corroborating evidence that the answer is right; substantive disagreement is evidence that at least one is wrong. The signal is symmetric and does not reference the final answer, which keeps it free of the self-similarity confound described in Section 2.2.`,
        `Verifier-Judge agreement measures the concordance between the two evaluators' independent rubric totals for the winning answer. Two independent evaluators agreeing is a stronger signal than either alone. The Judge does not see the Verifier's scores, which is what makes the agreement informative rather than circular - an earlier design did leak them, and Section 5.4 records the consequence.`,
      ],
    },
    {
      heading: "External Fact-Checking",
      paras: [
        `Two external signals ground the evaluation outside the model family entirely. The Wikipedia check extracts salient entities from the question and answer, retrieves the corresponding articles, and scores the overlap between the answer's claims and the retrieved text. The Wikidata check queries the structured knowledge graph for entity-property assertions and tests whether the answer's specific claims are consistent with them.`,
        `Both are relevance-gated. If no sufficiently relevant article or entity is found, the signal returns nothing rather than a low score, and its weight is redistributed across the remaining signals. This matters: a question about an obscure topic should not be penalised for the absence of an encyclopedia entry, which would conflate "unverifiable" with "wrong".`,
      ],
    },
    {
      heading: "The Weighted Confidence Score",
      paras: [
        `Six signals are combined into a single value in the range zero to one. Each signal is first mapped onto that range - the Judge's rubric total by division by eighty, the others natively - and then combined as a weighted sum.`,
        `Any signal that is unavailable for a given answer is dropped and the remaining weights are renormalised proportionally, so the score remains on the same scale regardless of how many signals contributed. Formally, for the set S of available signals with values v and nominal weights w, the score is the sum over S of v times w, divided by the sum over S of w.`,
      ],
      table: {
        caption: "Table 3.3: Confidence score signal weights",
        head: ["Signal", "Weight", "Kind of evidence"],
        rows: [
          ["Judge rubric total", "0.40", "Structured model judgement, normalised from /80"],
          ["Semantic similarity", "0.15", "Geometric relevance, question to answer"],
          ["Wikipedia check", "0.15", "External prose corroboration"],
          ["Model agreement", "0.10", "Cross-model corroboration (BERTScore A vs B)"],
          ["Verifier-Judge agreement", "0.10", "Inter-evaluator concordance"],
          ["Wikidata check", "0.10", "External structured corroboration"],
        ],
      },
      paras2: [
        `The Judge carries the largest single weight at 0.40 because it is the only signal that assesses correctness directly rather than by proxy. It is deliberately kept below one half, so that the remaining five signals together can outweigh it: a confidently wrong Judge should be outvoted by the combination of poor relevance, cross-model disagreement and failed external checks.`,
        `One omission is deliberate and important. No signal referenced against the final combined answer is included. Such signals were found to be systematically biased toward whichever candidate the Combiner had been built from, because for most of this project the Combiner and one generator were the same model. The bias was removed from the scoring by excluding those metrics; it remained in the shipped answer until Section 5.8 measured it.`,
      ],
    },
    {
      heading: "The Regeneration Gate",
      paras: [
        `If the weighted confidence score for an attempt falls below the threshold, the pipeline discards nothing but proceeds to generate again, to a maximum of two further attempts. The highest-scoring attempt is retained even if a later attempt scores lower, so regeneration cannot make the shipped answer worse than it would otherwise have been. This is a deliberate asymmetry: the loop can only improve the outcome or leave it unchanged.`,
        `The attempt bound exists because the loop would otherwise be unbounded on questions the model set simply cannot answer well - and such questions exist. Three attempts was chosen as the point beyond which, in practice, further attempts produced variation rather than improvement.`,
        `The threshold value itself is the subject of Section 5.7 and is not a design parameter chosen here.`,
      ],
    },
    {
      heading: "Bias Controls",
      paras: [
        `Two controls operate on every question.`,
        `Brand-blind prompting removes any mention of which system produced a candidate from the evaluator prompts. The candidates are presented only as "Answer 1" and "Answer 2". This is necessary but not sufficient, because a model may still infer provenance from style.`,
        `Position randomisation assigns the two candidates to the two prompt slots by a fresh coin flip per question, with the true mapping recorded in separate columns so that per-model statistics remain recoverable afterwards. Without the recorded mapping the randomisation would destroy the very data needed to analyse identity effects; with it, position and identity can be crossed, which is what makes Section 5.8 possible.`,
        `It is worth being precise about what randomisation achieves, because the distinction has practical consequences and was initially stated too loosely in this project's own documentation. Randomisation makes a position effect unbiased with respect to model identity. It does not remove the position effect. An evaluator that favours the first slot still favours the first slot; randomisation only ensures that the favour falls equally on both systems across a large corpus. A system claiming to have addressed position bias should state which of the two it has achieved.`,
      ],
    },
    {
      heading: "Retrieval Subsystem",
      paras: [
        `An optional retrieval mode allows users to supply documents. Uploaded files are chunked, embedded with the same encoder used elsewhere in the pipeline, and stored in a local vector table. At query time the question is embedded and the most similar chunks retrieved.`,
        `A minimum similarity threshold gates retrieval: if the best matching chunk falls below it, no context is injected and the question is answered from parametric knowledge alone. The purpose is to prevent an unrelated document from contaminating an answer merely because it happens to be the only document available. Retrieval decisions - whether context was injected, how many chunks, and at what similarity - are logged per query, which provides the data to calibrate that threshold by the same control-group method used for the confidence threshold. That calibration has not yet been performed and is listed in Chapter 8.`,
      ],
    },
  ],
};

module.exports = { CH1, CH2, CH3 };
