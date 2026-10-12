/**
 * deliverables/report/content.js
 * ------------------------------
 * Front matter, figure/table registries and appendices for the B.E. project
 * report. The chapters themselves live in chapters_1_3.js and chapters_4_7.js.
 *
 * Every figure quoted in the text is sourced from the repository -
 * RESEARCH_LOG.md sections 1-37, training/optimal_threshold_roc.py and
 * training/combiner_bias_analysis.py - not estimated. The plates are generated
 * by make_figures.py, which IMPORTS those same analysis functions, so the
 * figures and the prose cannot drift apart.
 *
 * Placeholders in square brackets are fields only the team can supply.
 */

const { CH1, CH2, CH3 } = require("./chapters_1_3.js");
const { CH4, CH5, CH6, CH7 } = require("./chapters_4_7.js");
const { CH_TESTING } = require("./chapter_testing.js");

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
  `We thank ${PLACEHOLDER.hod}, Head of the Department of Computer Engineering, and ${PLACEHOLDER.principal}, Principal, for providing the laboratory facilities and the computational resources without which a fully local, six-model pipeline would not have been feasible.`,
  `We are grateful to the project coordinators for their guidance on the evaluation schedule and documentation standards, and to our peers for reviewing early demonstrations and asking the awkward questions that exposed more than one hidden assumption.`,
  `Finally, we thank our families for their patience during the long unattended experimental runs that this project required.`,
];

// Target 250-350 words per the format guidelines.
const ABSTRACT = [
  `Large Language Models produce fluent text that is frequently wrong, and the standard remedy - asking a second model to grade the first - inherits well documented pathologies of its own. Evaluator models are known to prefer answers in particular prompt positions, to prefer longer answers, and to prefer text they themselves generated. This project asks a narrower and more tractable question: can the quality of a locally hosted question-answering system be validated when no human-annotated ground truth is available at all?`,
  `The system presented here answers each question twice, using two independently prompted local models, and then validates the pair rather than trusting either. An independent Verifier and an independent Judge score both candidates blind against an eight-factor, eighty-point rubric. Semantic similarity, cross-model agreement and two external encyclopedia checks are combined with the Judge's total into a single weighted confidence score. Any answer below a calibrated threshold is regenerated automatically, up to a bounded number of attempts, and a sixth agent synthesises the final response. The pipeline runs entirely offline with no external paid interfaces.`,
  `Validation is label-free by construction. A self-generated corpus of 5,000 questions across ten domains was produced, and the decision threshold calibrated against censored data using a deliberately injected control group, receiver-operating-characteristic analysis with Youden's J statistic, and a 2,000-sample bootstrap, yielding an adopted operating point of 0.72 with a 95 per cent confidence interval of [0.69, 0.75].`,
  `The investigation also produced a negative result of independent interest. Measured across all 5,000 records with prompt position and evaluator verdict crossed as controls, and answer length tested and excluded as a competing explanation, the original synthesising agent was found to prefer its own generated answer by 18.1 percentage points and whichever answer occupied the first prompt slot by a further 10.8 points. Replacing that agent with a model that is neither generator removes the first effect by construction. Four measurement errors were detected and corrected before reaching any reported conclusion; these are documented rather than omitted.`,
];

const ABBREVIATIONS = [
  ["API", "Application Programming Interface"],
  ["AUC", "Area Under the Curve"],
  ["BERT", "Bidirectional Encoder Representations from Transformers"],
  ["BLEU", "Bilingual Evaluation Understudy"],
  ["CI", "Confidence Interval"],
  ["CPU", "Central Processing Unit"],
  ["DDL", "Data Definition Language"],
  ["GPU", "Graphics Processing Unit"],
  ["HTTP", "Hypertext Transfer Protocol"],
  ["J", "Youden's J statistic (sensitivity + specificity − 1)"],
  ["LLM", "Large Language Model"],
  ["MMR", "Maximal Marginal Relevance"],
  ["NLP", "Natural Language Processing"],
  ["pp", "Percentage Points"],
  ["RAG", "Retrieval-Augmented Generation"],
  ["ROC", "Receiver Operating Characteristic"],
  ["ROUGE", "Recall-Oriented Understudy for Gisting Evaluation"],
  ["SSE", "Server-Sent Events"],
  ["SQL", "Structured Query Language"],
  ["VRAM", "Video Random Access Memory"],
  ["τ (tau)", "Confidence threshold below which an answer is regenerated"],
  ["r", "Pearson correlation coefficient"],
  ["p", "Probability value of a statistical test"],
  ["n", "Sample size"],
];

/* Figures, keyed by the name a chapter section refers to. Only figures that
 * actually exist are listed: a List of Figures promising plates the reader
 * cannot find is worse than a short list. */
const FIGURES = {
  architecture:       { n: "3.1", file: "fig_architecture.png",       widthIn: 4.3, caption: "Six-stage pipeline architecture, showing the regeneration loop and the signals feeding the confidence score" },
  interface:          { n: "4.1", file: "fig_interface.png",          widthIn: 5.9, caption: "Streaming interface: the pipeline renders stage by stage as it executes" },
  dataset:            { n: "5.1", file: "fig_dataset.png",            widthIn: 5.9, caption: "Dataset generation monitor at completion of the 5,000-question corpus" },
  score_distribution: { n: "5.2", file: "fig_score_distribution.png", widthIn: 5.5, caption: "Distribution of the weighted confidence score, all attempts against final answers, with the adopted threshold marked" },
  attempts:           { n: "5.3", file: "fig_attempts.png",           widthIn: 6.1, caption: "Attempts per question, and the reason each regeneration was triggered" },
  roc:                { n: "5.4", file: "fig_roc.png",                widthIn: 3.5, caption: "Receiver operating characteristic of the confidence score against observed improvement, sampling-corrected" },
  youden:             { n: "5.5", file: "fig_youden.png",             widthIn: 5.5, caption: "Youden's J across candidate thresholds, showing the near-flat plateau between 0.70 and 0.74" },
  bootstrap:          { n: "5.6", file: "fig_bootstrap.png",          widthIn: 5.5, caption: "Bootstrap distribution of the optimal threshold over 2,000 weighted resamples" },
  combiner_bias:      { n: "5.7", file: "fig_combiner_bias.png",      widthIn: 6.1, caption: "Combiner preference crossed by prompt position, model identity and judge verdict, with the two effects separated" },
};

const FIGURE_ORDER = ["architecture", "interface", "dataset", "score_distribution",
                      "attempts", "roc", "youden", "bootstrap", "combiner_bias"];

const TABLES = [
  ["2.1", "Evaluation approaches and their applicability to this project"],
  ["3.1", "Agent roles, models and decoding parameters"],
  ["3.2", "The eight-factor evaluation rubric"],
  ["3.3", "Confidence score signal weights"],
  ["5.1", "Corpus composition"],
  ["5.2", "Threshold operating points"],
  ["5.3", "Combiner bias, effects separated"],
  ["5.4", "Measurement errors and corrections"],
  ["5.5", "Per-criterion scores for the winning answer"],
  ["5.6", "External signal availability across 8,432 attempts"],
  ["5.7", "The two generators compared by true identity"],
  ["6.1", "Observed failure modes and system response"],
  ["H.1", "Sampling-corrected ROC across all candidate cutoffs"],
  ["I.1", "Signals for question 4, attempt 2"],
  ["K.1", "Terms as used in this report"],
];

const CHAPTERS = [CH1, CH2, CH3, CH4, CH5, CH_TESTING, CH6, CH7];

const REFERENCES = [
  "L. Zheng et al., “Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena,” in Advances in Neural Information Processing Systems (NeurIPS), 2023.",
  "Y. Liu, D. Iter, Y. Xu, S. Wang, R. Xu and C. Zhu, “G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment,” in Proc. EMNLP, 2023.",
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
  "J. A. Hanley and B. J. McNeil, “The meaning and use of the area under a receiver operating characteristic (ROC) curve,” Radiology, vol. 143, no. 1, pp. 29–36, 1982.",
  "J. Carbonell and J. Goldstein, “The use of MMR, diversity-based reranking for reordering documents and producing summaries,” in Proc. ACM SIGIR, 1998.",
  "AI@Meta, “Llama 3 Model Card,” 2024.",
  "A. Q. Jiang et al., “Mistral 7B,” arXiv:2310.06825, 2023.",
  "M. Abdin et al., “Phi-3 Technical Report: A Highly Capable Language Model Locally on Your Phone,” arXiv:2404.14219, 2024.",
  "Gemma Team, “Gemma 2: Improving Open Language Models at a Practical Size,” arXiv:2408.00118, 2024.",
  "A. Yang et al., “Qwen2.5 Technical Report,” arXiv:2412.15115, 2024.",
  "D. Vrandečić and M. Krötzsch, “Wikidata: a free collaborative knowledgebase,” Communications of the ACM, vol. 57, no. 10, pp. 78–85, 2014.",
  "A. Agresti and B. A. Coull, “Approximate is better than exact for interval estimation of binomial proportions,” The American Statistician, vol. 52, no. 2, pp. 119–126, 1998.",
];

const APPENDICES = [
  {
    title: "Appendix A: Agent Configuration",
    paras: [
      `Each agent is instantiated with a role description, a model identifier, a decoding temperature and a token budget, as given in Table 3.1. The table is reproduced here with the rationale for each decoding choice.`,
      `Generators run at temperature 0.7. Diversity between the two candidates is the point of having two, and a lower temperature would produce near-identical answers from which no agreement signal could be derived.`,
      `Evaluators run at temperature 0.1. Scoring should be as close to deterministic as the runtime permits; an evaluator returning different scores for identical input on consecutive calls cannot support any claim about the system.`,
      `The Combiner runs at 0.4, between the two. Synthesis requires enough freedom to produce fluent connective prose, and not enough to invent material absent from both sources.`,
      `The Judge additionally sets the reasoning flag to false. With internal reasoning enabled, qwen3.5:9b expends its entire generation budget on deliberation and returns an empty string on long rubric prompts - a silent failure, since the caller receives a well-formed but empty response rather than an error.`,
    ],
  },
  {
    title: "Appendix B: Evaluator Prompt Structure",
    paras: [
      `Evaluator prompts are brand-blind. They present the question and both candidate answers, labelled only as "Answer 1" and "Answer 2", with no reference to which system produced either. The Verifier prompt has the following structure, with the retrieved-context block present only when retrieval is active:`,
      `An optional block of retrieved reference documents; then the question; then the two answers under "--- ANSWER 1 ---" and "--- ANSWER 2 ---" headings; then the instruction to score both answers on all eight criteria, writing one sentence per score explaining why and referencing specific content from the answer. Where no reference documents were supplied, Context Relevance is to be scored on whether the answer stays on topic. The prompt closes by requiring the total to be computed as the sum of the eight scores, to a maximum of eighty.`,
      `The Judge prompt follows the same structure and additionally requires an overall winner and a short reasoning paragraph. The Judge does not receive the Verifier's scores; the two evaluations are independent, which is what makes their agreement a usable signal rather than an echo.`,
      `One property of the evaluator output matters downstream and is easy to overlook. The reasoning prose refers to the candidates by label - "Answer 1 adheres more strictly to the prompt", for instance. Any downstream consumer that reorders the answers must remap those labels, or it will act on a verdict pointing at the wrong text. Section 5.10 records that exactly this defect was present in the live service.`,
    ],
  },
  {
    title: "Appendix C: The Eight-Factor Rubric in Full",
    paras: [
      `Each criterion is scored from 0 to 10 for each answer, for a maximum of 80 per answer, and each score requires a one-sentence justification.`,
      `Factual Correctness: whether the facts stated are accurate. Catches confident but incorrect dates, figures and names.`,
      `Question Relevance: whether the answer addresses the question actually asked. Catches answers that drift to an adjacent, easier question.`,
      `Context Relevance: consistency with supplied reference material, or, where none was supplied, whether the answer remains on topic.`,
      `Faithfulness: whether the claims made are supportable rather than invented. Catches plausible but unsupported specifics.`,
      `Completeness: whether the answer covers the question adequately. Catches answers addressing only one half of a two-part question.`,
      `Hallucination-Free: absence of fabricated specifics such as invented citations, statistics or quotations.`,
      `Clarity: structure and readability. A correct answer the reader cannot follow is of limited use.`,
      `Consistency: absence of internal self-contradiction within the answer.`,
      `Totals are recomputed from the criterion scores rather than read from the model's stated total, because evaluators were observed reporting totals inconsistent with their own scores.`,
    ],
  },
  {
    title: "Appendix D: Confidence Score Computation",
    paras: [
      `For the set S of signals available for a given answer, with values v normalised to the range [0, 1] and nominal weights w from Table 3.3, the weighted confidence score is the sum over S of v multiplied by w, divided by the sum over S of w.`,
      `The division renormalises the weights across whichever signals are present, so the score remains on the same scale regardless of how many contributed. The Judge's rubric total is normalised by division by eighty; the remaining signals are natively in range.`,
      `A signal is unavailable when its source produced nothing - most commonly when an external encyclopedia check found no sufficiently relevant article or entity. Returning nothing rather than a low score is deliberate: it avoids conflating "unverifiable" with "wrong", which would penalise questions about obscure topics for the absence of an encyclopedia entry.`,
      `Deliberately excluded are any signals referenced against the final combined answer. Such signals were found to be biased toward whichever candidate the Combiner had been built from, for the reasons quantified in Section 5.8.`,
    ],
  },
  {
    title: "Appendix E: Database Schema",
    paras: [
      `One row is written per attempt into the pipeline_runs table. The principal columns are as follows.`,
      `Identity and sequencing: id (primary key), question_idx, question, attempt_number, is_final_attempt.`,
      `Candidates and provenance: answer_a, answer_b, model_a, model_b - the last two recording which physical model occupied which prompt slot for this question, which is what makes the identity analyses in Section 5.8 possible after the fact.`,
      `Raw evaluator output: verifier_raw, judge_raw - the complete text returned by each evaluator, retained so that an analysis months later can reconstruct exactly what each evaluator saw.`,
      `Parsed scores: for each of the eight criteria, four columns - verifier and judge, answer A and answer B - plus verifier_total_a, verifier_total_b, judge_total_a, judge_total_b and winner.`,
      `Signals: sem_sim_a, sem_sim_b, length_score_a, length_score_b, word_count_a, word_count_b, model_agreement, verifier_judge_agreement, wikipedia_score, wikipedia_source, wikidata_score, wikidata_source.`,
      `Outcome: weighted_score, regen_reason, final_answer, elapsed_secs, created_at.`,
      `Indexes on question_idx and is_final_attempt were added after a paginated browse query over the full corpus began timing out at high offsets; with them the worst-case page load returns in under a fifth of a second.`,
    ],
  },
  {
    title: "Appendix F: Threshold Calibration Procedure",
    paras: [
      `The calibration proceeds in five steps.`,
      `First, a control group is formed: a random fraction of answers passing the gate are regenerated regardless, producing observations the gate would otherwise censor.`,
      `Second, each record is weighted by the inverse of the control probability actually in force when it was generated. That probability changed from 0.08 to 0.60 partway through the run, so records carry weight 12.5 or approximately 1.667 accordingly, while census records - those regenerated because they genuinely failed the gate - carry weight 1.0.`,
      `Third, an improvement label is derived for each record from the five non-judge signals. The Judge is deliberately excluded from the improvement criterion to avoid circularity, since the Judge's own score is the dominant input to the threshold being calibrated.`,
      `Fourth, the receiver-operating-characteristic curve is computed over a grid of candidate cutoffs from 0.50 to 0.86 in steps of 0.01, and Youden's J maximised.`,
      `Fifth, the whole procedure is repeated over 2,000 bootstrap resamples of the labelled question set, with weights preserved, to obtain a confidence interval for the location of the optimum.`,
      `The analysis is reproducible by running training/optimal_threshold_roc.py. The figures in Section 5.7 are produced by make_figures.py, which imports that script's own functions and uses its grid and random seed, so that the plates cannot drift from the numbers in the text.`,
    ],
  },
  {
    title: "Appendix G: Combiner Bias Measurement Procedure",
    paras: [
      `For each final record, the two candidate answers and the final answer are embedded with all-MiniLM-L6-v2, the same encoder used elsewhere in the pipeline. The difference in cosine similarity between the final answer and each candidate gives a signed preference for that record.`,
      `Mapping that preference onto model identity using the recorded model_a and model_b columns yields the identity lean; leaving it in slot terms yields the position lean. Crossing the two, and further crossing by the Judge's recorded verdict, separates effects that are conflated in the marginal figures - which is necessary here, because the two effects point the same way and the marginal number is therefore misleading on its own.`,
      `Length is controlled in two ways: as a correlation between the word-count advantage and the preference, and by restricting the analysis to pairs whose word counts fall within ten per cent of one another.`,
      `The controlled replay freezes the question, both candidates and both evaluator outputs, and varies only the Combiner model and the presentation order. When the order is swapped, the "Answer 1" and "Answer 2" references inside the evaluator text are remapped accordingly; without that remapping the Combiner would receive a verdict pointing at the wrong candidate, contaminating the measurement.`,
      `The analysis is reproducible by running training/combiner_bias_analysis.py, and the replay by training/combiner_replay.py.`,
    ],
  },
  {
    title: "Appendix H: Full ROC Table",
    paras: [
      `The complete sampling-corrected receiver-operating-characteristic table underlying Section 5.7 and Figure 5.4. At each candidate cutoff t, an answer is "flagged" if its attempt-1 confidence score falls below t. Sensitivity is the weighted fraction of truly improvable answers correctly flagged; specificity is the weighted fraction of truly satisfactory answers correctly left alone. Youden's J is their sum less one. Area under the curve: 0.6291.`,
    ],
    table: {
      caption: "Table H.1: Sampling-corrected ROC across all candidate cutoffs",
      head: ["t", "n flagged", "n ok", "Sensitivity", "Specificity", "Youden J"],
      rows: [
        ["0.50", "31", "1973", "1.2%", "99.5%", "0.0074"],
        ["0.55", "71", "1933", "2.7%", "98.7%", "0.0139"],
        ["0.60", "199", "1805", "7.3%", "96.3%", "0.0366"],
        ["0.63", "362", "1642", "12.7%", "92.7%", "0.0541"],
        ["0.64", "452", "1552", "15.9%", "90.9%", "0.0679"],
        ["0.65", "565", "1439", "19.8%", "88.5%", "0.0827"],
        ["0.66", "720", "1284", "25.0%", "85.1%", "0.1005"],
        ["0.67", "896", "1108", "30.6%", "80.9%", "0.1158"],
        ["0.68", "1128", "876", "38.2%", "75.6%", "0.1383"],
        ["0.69", "1245", "759", "47.7%", "69.6%", "0.1727"],
        ["0.70", "1360", "644", "54.6%", "64.4%", "0.1897"],
        ["0.71", "1464", "540", "59.7%", "58.4%", "0.1807"],
        ["0.72", "1593", "411", "66.7%", "50.3%", "0.1697"],
        ["0.73", "1707", "297", "75.0%", "43.9%", "0.1897"],
        ["0.74", "1825", "179", "81.7%", "36.2%", "0.1792"],
        ["0.75", "1915", "89", "86.7%", "30.2%", "0.1688"],
        ["0.76", "1937", "67", "89.7%", "22.3%", "0.1199"],
        ["0.78", "1968", "36", "97.3%", "14.7%", "0.1200"],
        ["0.80", "2000", "4", "100.0%", "2.3%", "0.0235"],
        ["0.83", "2004", "0", "100.0%", "0.0%", "0.0000"],
      ],
    },
    paras2: [
      `Two features of the table deserve comment. The maximum of J is attained twice, at 0.70 and again at 0.73, both at 0.1897 - which is the flatness described in Section 5.7 made explicit rather than asserted. And above 0.80 the specificity collapses toward zero while sensitivity saturates at 100 per cent: at those cutoffs essentially every answer is flagged, the gate stops discriminating, and the regeneration loop would run on almost every question to no purpose.`,
    ],
  },
  {
    title: "Appendix I: A Worked Example",
    paras: [
      `One complete record from the corpus, traced through the pipeline. Question index 4: "How does a neural network learn from data?"`,
      `Position assignment for this question put Mistral in slot A and LLaMA 3 in slot B. The Judge declared answer B the winner, with rubric totals of 70 for A and 75 for B; the Verifier, scoring independently, reached the opposite ordering at 75 for A and 68 for B. This disagreement is exactly the situation the Verifier-Judge agreement signal exists to detect, and it scored 0.925 - high, because the agreement measure compares the evaluators' assessment of the winning answer rather than requiring them to pick the same winner.`,
    ],
    table: {
      caption: "Table I.1: Signals for question 4, attempt 2",
      head: ["Signal", "Value", "Weight", "Contribution"],
      rows: [
        ["Judge rubric total (B)", "75 / 80 = 0.938", "0.40", "0.375"],
        ["Semantic similarity (B)", "0.650", "0.15", "0.097"],
        ["Wikipedia check", "0.438", "0.15", "0.066"],
        ["Model agreement (BERTScore A–B)", "0.098", "0.10", "0.010"],
        ["Verifier–Judge agreement", "0.925", "0.10", "0.093"],
        ["Wikidata check", "0.404", "0.10", "0.040"],
        ["Weighted confidence score", "—", "1.00", "0.681"],
      ],
    },
    paras2: [
      `The winning answer's per-criterion scores from the Judge were 9, 9, 9, 10, 9, 10, 10, 9 across the eight criteria in rubric order, totalling 75. The Verifier scored the same answer 8, 8, 8, 9, 8, 9, 9, 9, totalling 68 - the systematic leniency gap of Section 5.5 running in the opposite direction here, which is a reminder that it is a tendency across 5,000 records rather than a rule holding on each.`,
      `The attempt history shows the gate working and then exhausting itself. Attempt 1 scored 0.6744, below the threshold, and triggered a regeneration. Attempt 2 scored 0.6808 - an improvement, but still below 0.72. The attempt bound was reached and the better of the two was shipped. This record is therefore one of the 1,849 final answers, 37.0 per cent of the corpus, that ship below the confidence threshold because the pipeline could not do better within its attempt budget.`,
      `Two further details are visible in this record. Model agreement is 0.098, very low: the two generators produced substantively different explanations of the same concept, which is the expected behaviour described in Section 5.6 and the reason that signal contributes only 0.010 to the final score here. And the shipped answer runs to 285 words against a prompt instruction of at most 150 - this record predates the Combiner change of Section 5.8, and the instruction-following failure it illustrates was one of the secondary reasons for that change.`,
    ],
  },
  {
    title: "Appendix J: Verbatim Evaluator Output",
    paras: [
      `A complete, unedited Judge output from the corpus, for the question "What is epigenetics?". It is reproduced to show the structure the parser consumes and the quality of justification the rubric elicits. Only the first answer's block is shown; the second follows the same form, after which the Judge declares a winner and gives an overall reasoning paragraph.`,
      `## Answer 1`,
      `- Factual Correctness: 9/10 | The definitions of epigenetics and the four listed mechanisms (DNA methylation, histone modification, chromatin remodeling, non-coding RNA) are scientifically accurate and standard.`,
      `- Question Relevance: 10/10 | Every sentence directly defines or elaborates on epigenetics without including unrelated tangents or generic introductions.`,
      `- Context Relevance: 9/10 | The answer aligns perfectly with general scientific consensus on epigenetics since no specific external context was provided to contradict.`,
      `- Faithfulness: 9/10 | All claims regarding mechanisms and biological roles are grounded in established biological knowledge without fabrication.`,
      `- Completeness: 9/10 | The response covers the definition, causes, specific mechanisms, and key biological implications comprehensively.`,
      `- Hallucination-Free: 10/10 | No invented statistics, names, or false causal links were introduced; all examples are standard textbook instances.`,
      `- Clarity: 9/10 | The use of numbered lists for mechanisms and processes makes the complex information easy to scan and understand.`,
      `- Consistency: 9/10 | No internal contradictions appear between the definition given and the mechanisms subsequently described.`,
      `Three properties of this output are worth drawing out. The justifications reference specific content from the answer rather than restating the criterion, which is what the prompt asks for and what distinguishes a usable score from a reflexive one. The scores are differentiated across criteria rather than uniform, which is the property that disqualified a candidate judge in Section 5.3. And the Context Relevance justification explicitly notes that no external context was supplied and states how it scored in that case - the fallback behaviour defined in the rubric, correctly applied.`,
      `The output is also the reason totals are recomputed rather than trusted. The eight scores above sum to 74; an evaluator that states its own total introduces an opportunity for arithmetic that does not match, and such mismatches were observed.`,
    ],
  },
  {
    title: "Appendix K: Glossary of Terms as Used in This Report",
    paras: [
      `Several terms in this report carry a narrower meaning than their general usage, and a few are used in a sense that differs from a common one. They are defined here as used.`,
    ],
    table: {
      caption: "Table K.1: Terms as used in this report",
      head: ["Term", "Meaning as used here"],
      rows: [
        ["Attempt", "One pass through stages 1-5 for a question. A question may have up to three."],
        ["Final answer", "The output of the Combiner for the highest-scoring attempt of a question."],
        ["Candidate", "One of the two independently generated answers, before synthesis."],
        ["Confidence score", "The weighted blend of six signals, in [0,1]. A ranked quality signal, NOT a probability of correctness."],
        ["Calibrated", "Of the threshold: chosen by diagnostic-test methodology. NOT calibration in the probabilistic sense (see Section 2.9)."],
        ["Label-free", "Requiring no human-annotated ground truth at any point, including for validation."],
        ["Censored data", "Observations the system structurally never produces, because the gate it would inform prevents them."],
        ["Control group", "Answers regenerated despite passing the gate, purely to produce censored observations."],
        ["Position / slot", "Which of the two prompt positions a candidate occupied for a given question."],
        ["Identity", "Which physical model produced a candidate, independent of its position."],
        ["Lean", "The signed difference in similarity between the final answer and each candidate."],
        ["Discrimination", "An evaluator's capacity to score good and bad answers differently."],
        ["Blind", "An evaluator sees neither model identity nor the other evaluator's scores."],
        ["Census row", "A record regenerated because it genuinely failed the gate; sampling weight 1.0."],
        ["Sensitivity", "Of improvable answers, the weighted fraction correctly flagged for regeneration."],
        ["Specificity", "Of satisfactory answers, the weighted fraction correctly left alone."],
      ],
    },
    paras2: [
      `Two of these warrant emphasis because misreading them would misrepresent the system's claims. The confidence score is a ranked signal, not a probability: a score of 0.80 means better supported than 0.60, not 80 per cent likely to be correct. And "calibrated" throughout this report refers to the choice of an operating point on that ranking, in the sense used in diagnostic testing, not to agreement between stated confidence and empirical accuracy - which, as Section 2.9 explains, cannot be established without the ground truth this methodology deliberately does without.`,
    ],
  },
  {
    title: "Appendix L: Reproducing the Results",
    paras: [
      `The pipeline is started by running the model runtime, then the web service, and opening the local address it prints. The batch harness generates the corpus and is restartable.`,
      `The analyses reported in Chapter 5 are each a single script. training/optimal_threshold_roc.py performs the threshold calibration and prints the ROC table, the AUC, the Youden optimum and the bootstrap interval. training/combiner_bias_analysis.py performs the bias decomposition over the full corpus and writes a per-record cache so that follow-up analysis requires no re-encoding. training/combiner_replay.py runs the controlled replay and scores it.`,
      `deliverables/report/make_figures.py regenerates every figure in Chapter 5 from the live corpus, and deliverables/report/build_report.js rebuilds this document.`,
      `Hardware used: a single workstation with an NVIDIA RTX 4090, 24 GB of video memory. The six models exceed that if co-resident, so the pipeline runs at concurrency one and the runtime evicts weights between stages.`,
    ],
  },
];

module.exports = {
  PLACEHOLDER, TITLE, TITLE_SENTENCE, ACKNOWLEDGEMENT, ABSTRACT,
  ABBREVIATIONS, FIGURES, FIGURE_ORDER, TABLES, CHAPTERS, REFERENCES, APPENDICES,
};
