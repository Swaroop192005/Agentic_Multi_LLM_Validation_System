/**
 * deliverables/report/chapter_testing.js
 * --------------------------------------
 * Chapter 6: System Testing and Validation.
 *
 * Deliberately separated from Chapter 5. Chapter 5 reports experiments that
 * produce findings about the problem domain; this chapter reports testing that
 * establishes the system behaves as specified. Conflating the two is a common
 * weakness in project reports - a discrimination test is evidence about an
 * evaluator, whereas a check that the gate fires at the right score is evidence
 * about an implementation, and they support different kinds of claim.
 */

const CH_TESTING = {
  title: "System Testing and Validation",
  sections: [
    {
      heading: "Testing Strategy",
      paras: [
        `The system has two kinds of correctness and they require different evidence. Functional correctness asks whether the implementation does what it was specified to do: whether the gate fires at the right score, whether a missing signal is renormalised rather than treated as zero, whether a restart resumes where it left off. Behavioural correctness asks whether the components exhibit the properties the architecture assumes: whether an evaluator can actually discriminate, whether randomisation is balanced, whether regeneration improves anything.`,
        `Chapter 5 addresses the second kind. This chapter addresses the first, together with the robustness testing that an unattended multi-day run required.`,
        `No automated unit test suite was maintained for the agent layer, and that is a limitation rather than a decision to defend. Agent outputs are non-deterministic text, so assertions about them are either trivially weak or brittle. Testing concentrated instead on the deterministic parts - score computation, parsing, persistence, resumption - and on observing the non-deterministic parts through the streaming interface.`,
      ],
    },
    {
      heading: "Score Computation and Renormalisation",
      paras: [
        `The weighted score function was exercised against hand-computed cases, because an error here would silently corrupt every downstream result and would not announce itself.`,
        `The cases checked were: all six signals present, which must reproduce the plain weighted sum; a single signal present, which must return that signal's own value because its renormalised weight is one; each external signal absent individually, which must redistribute its weight proportionally rather than treating the absence as a zero score; and no signals at all, which must raise rather than return a misleading zero.`,
        `The distinction between an absent signal and a zero-valued signal is the one that matters. An absent Wikipedia check means "this claim could not be verified"; a Wikipedia score of zero means "this claim was checked and contradicted". Collapsing the two would systematically penalise questions about topics with no encyclopedia coverage, and given the 44 per cent availability reported in Section 5.6, that error would have affected the majority of records.`,
      ],
    },
    {
      heading: "Rubric Parsing",
      paras: [
        `Evaluator output is free text in a requested format, and models do not always honour the format. The parser was therefore tested against the failure modes actually observed in the corpus rather than against an idealised specification.`,
        `Observed and handled: a criterion omitted entirely; a score written as a bare integer rather than as a fraction; a stated total inconsistent with the criterion scores; an extra "## Answer 1" heading appearing mid-output, which occurs in 625 of the 8,432 verifier outputs; and a reversal in which the model scores answer 2 before answer 1.`,
        `The handling policy is to recompute rather than to trust. Totals are summed from criterion scores. A missing criterion yields a missing value which propagates as an absent signal rather than a zero. Where the output cannot be parsed at all, the attempt is recorded with null scores rather than discarded, so that the failure is visible in the corpus rather than silently reducing the sample.`,
      ],
    },
    {
      heading: "Gate and Regeneration Logic",
      paras: [
        `The regeneration gate was verified against three properties.`,
        `First, the boundary: an attempt scoring exactly the threshold passes, and one scoring fractionally below it does not. The comparison is strictly less-than, so 0.72 passes and 0.7199 does not.`,
        `Second, the attempt bound: no question may produce more than three attempts. The corpus confirms this empirically - 5,005 first attempts, 2,001 second and 1,426 third, with no fourth.`,
        `Third, and most importantly, monotonicity of the shipped answer. The highest-scoring attempt is retained even when a later attempt scores lower, so regeneration cannot degrade the output. This was verified by querying the corpus for any question whose final flagged attempt was not its highest-scoring attempt; the query returns nothing.`,
      ],
    },
    {
      heading: "Randomisation Balance",
      paras: [
        `Position assignment is a per-question coin flip, and a biased or broken randomiser would invalidate every bias analysis in Chapter 5. Over the 5,000 final records, LLaMA 3 occupied the first slot in 2,435 cases and Mistral in 2,565 - 48.7 per cent against 51.3 per cent.`,
        `For a fair coin over 5,000 trials the standard deviation of the count is approximately 35, so the observed deviation of 65 from the expected 2,500 is under two standard deviations and entirely consistent with a fair process. The randomisation is sound, which is what licenses treating the position and identity factors as independent in Section 5.8.`,
      ],
    },
    {
      heading: "Persistence and Restart Behaviour",
      paras: [
        `The harness must resume correctly after interruption, because it was interrupted repeatedly in practice. Resumption was tested by terminating the process at several points in the attempt cycle and restarting it: between attempts, between the final attempt and the combiner call, and during the database write.`,
        `The third case is the one that exposed a real defect. Terminating between inserting an attempt and marking it final leaves an orphaned row, and on restart the question is reprocessed from scratch and produces a fresh attempt sharing the same question index and attempt number. The original code identified the row to flag by that pair, so both rows were flagged. Four questions in the corpus were affected, yielding 5,003 final rows for 5,000 questions.`,
        `This is reported in Section 5.10 as a measurement error, and it is reported here as a test outcome, because it is both: a bug that corrupted a statistic, and a defect that only a deliberate mid-write termination test would have surfaced. The fix returns the row identifier at insertion and targets the update by that identifier alone.`,
      ],
    },
    {
      heading: "Failure Modes and Degradation",
      paras: [
        `The system's behaviour was characterised under several failure conditions rather than assumed.`,
      ],
      table: {
        caption: "Table 6.1: Observed failure modes and system response",
        head: ["Condition", "Observed behaviour", "Handling"],
        rows: [
          ["Model runtime unreachable", "Agent call raises", "Health endpoint reports unavailable models before a run starts"],
          ["Evaluator returns empty text", "Parse yields no scores", "Attempt recorded with null scores; signal absent, not zero"],
          ["Reasoning-enabled judge on a long prompt", "Empty response, no error", "Reasoning disabled in configuration"],
          ["External lookup finds no entity", "No score returned", "Weight redistributed across remaining signals"],
          ["Two large models requested concurrently", "VRAM thrash, throughput collapse", "Concurrency fixed at one; evaluators sequential"],
          ["Process terminated mid-write", "Orphaned attempt row", "Final flag targeted by unique row id"],
          ["Host sleeps or session closes", "Generation silently stops", "External scheduled watchdog restarts the process"],
        ],
      },
      paras2: [
        `The second row is worth emphasising because it is the dangerous one. An evaluator returning empty text produces no error anywhere in the stack: the HTTP call succeeds, the string is well-formed, and the parser simply finds nothing in it. Without an explicit check this failure presents as a quiet reduction in signal availability rather than as a fault, and it would be easy to attribute to the external sources instead.`,
      ],
    },
    {
      heading: "End-to-End Verification",
      paras: [
        `After each significant change the full pipeline was exercised against a live question through the public interface, and the event stream inspected for all six stage-completion events, a non-null final answer, and a plausible confidence score.`,
        `The most recent such run, following the Combiner change of Section 5.8, completed all six stages and produced a 136-word final answer - within the 150-word instruction that the previous Combiner had been exceeding by up to a factor of 2.7.`,
        `One observation from these runs is worth recording for anyone reproducing the work. Under GPU contention - when an analysis job is running concurrently - the same query took 327 seconds rather than the usual 125, because the runtime spends most of its time evicting and reloading model weights rather than generating. The system does not fail under contention; it degrades, substantially and silently. On a single-GPU host, the pipeline and any analysis workload should not be run at the same time.`,
      ],
    },
  ],
};

module.exports = { CH_TESTING };
