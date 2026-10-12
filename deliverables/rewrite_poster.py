"""
deliverables/rewrite_poster.py
==============================
Rewrites FYP_POSTER.html to describe the project as it actually is.

The poster had drifted badly. It was written during the Sem 5-6 prototype phase
and still sold a project that was subsequently abandoned: a BERT "neural judge"
distilled from an LLM judge, with a human feedback loop, trained on a
150-of-1,000 sample dataset, scored on a five-criterion /50 rubric, by a Mistral
judge and a LLaMA 3 verifier, on a MacBook. None of that is true any more. What
it omitted was the work that actually got done - the label-free validation
methodology, the control-group threshold calibration, and the evaluator-bias
decomposition.

This script replaces the header and all three body columns. The stylesheet,
layout classes and institutional branding are untouched, so the poster keeps the
department's visual format.

Run:  py -3.13 deliverables/rewrite_poster.py
"""

from __future__ import annotations

import io
import re
from pathlib import Path

POSTER = Path(__file__).parent.parent / "FYP_POSTER.html"

TITLE = ("Agentic Multi-LLM Validation System<br>"
         "Label-Free Quality Assurance for Locally Hosted Large Language Models")

NAMES = """      Swaroop Naik<br>
      Nidhi Bhawari<br>
      Devanshi Mahajan<br>
      <span style="margin-top:6px;display:block">Guide: Dr. Suja Jayachandran</span>
"""

BODY = """  <div class="body">

    <!-- ════ LEFT COLUMN ════ -->
    <div class="col">

      <!-- ABSTRACT -->
      <div class="section">
        <div class="section-title h-blue">Abstract</div>
        <div class="section-body">
          <p>Large Language Models produce fluent text that is frequently wrong, and the usual remedy &mdash; asking a second model to grade the first &mdash; inherits well-documented pathologies of its own. This project asks a narrower, tractable question: <b>can the quality of a locally hosted question-answering system be validated when no human-annotated ground truth exists at all?</b></p>
          <p>The system answers each question twice using two independently prompted local models (LLaMA&nbsp;3 and Mistral), then validates the pair rather than trusting either. An independent Verifier (phi3) and Judge (qwen3.5:9b) score both candidates <b>blind</b> on an eight-factor, 80-point rubric. Semantic similarity, cross-model agreement and external Wikipedia/Wikidata checks are blended into one 0&ndash;1 confidence score; anything below a calibrated threshold is regenerated automatically, and a sixth agent (Gemma&nbsp;2&nbsp;9B) synthesises the final answer. Everything runs offline, with no paid APIs.</p>
          <p>Validation is <b>label-free by construction</b>. A self-generated 5,000-question corpus was produced and the decision threshold calibrated against censored data using a deliberately injected control group, ROC analysis with Youden's J, and a 2,000-sample bootstrap &mdash; giving an adopted operating point of <b>&tau;&nbsp;=&nbsp;0.72</b>, 95% CI [0.69, 0.75].</p>
        </div>
      </div>

      <!-- INTRODUCTION -->
      <div class="section">
        <div class="section-title h-pink">Introduction</div>
        <div class="section-body">
          <p>An LLM does not signal uncertainty the way a traditional component signals an error: a wrong answer is indistinguishable in tone from a right one. The dominant response is the <b>LLM-as-a-judge</b> pattern, which scales well but is a measurement instrument built from the same material as the thing it measures.</p>
          <ul>
            <li><b>Human evaluation</b> &mdash; accurate, but expensive, slow and unscalable.</li>
            <li><b>LLM-as-a-judge</b> &mdash; fast, but exhibits <i>position</i>, <i>verbosity</i> and <i>self-preference</i> bias large enough to reverse a verdict.</li>
          </ul>
          <p>A second constraint shapes this work: much of the evaluation literature assumes human preference labels or a frontier commercial judge. Both fail for a department laboratory and for any deployment whose data cannot leave the institution. This project therefore restricts itself to <b>models running locally on a single workstation</b>, and builds validation that works without labels.</p>
          <p>Crucially, the validation apparatus is then <b>turned on itself</b> and measured for the very biases the literature warns about. A system that cannot be audited this way is of limited scientific value.</p>
        </div>
      </div>

      <!-- LITERATURE SURVEY -->
      <div class="section">
        <div class="section-title h-teal">Literature Survey</div>
        <div class="section-body">
          <p><b>[1] MT-Bench &amp; LLM-as-a-Judge</b> &ndash; Zheng et al. (NeurIPS 2023) established that model judges correlate with human preference in aggregate, and documented position and self-enhancement bias. Our work reproduces those biases locally and <i>quantifies</i> them on our own pipeline.</p>
          <p><b>[2] G-Eval</b> &ndash; Liu et al. (EMNLP 2023) used chain-of-thought form-filling for more stable numeric scores. Our eight-factor rubric with per-criterion justifications follows the same principle of structured scoring over free-form judgement.</p>
          <p><b>[3] Prometheus</b> &ndash; Kim et al. (ICLR 2024) showed an open, smaller model can approach proprietary grading behaviour, which is what makes a fully local judge credible.</p>
          <p><b>[4] BERTScore</b> &ndash; Zhang et al. (ICLR 2020). Embedding-based, but <i>reference-based</i>: unusable as a quality metric here. We use it only for cross-model agreement, never against a reference answer.</p>
          <p><b>[5] AutoGen</b> &ndash; Wu et al. (2023) popularised multi-agent role decomposition. We adopt the decomposition but reject reusing one model across roles, which silently destroys evaluator independence.</p>
          <p><b>[6] Youden's J</b> &ndash; Youden (1950), and <b>[7] the Bootstrap</b> &ndash; Efron &amp; Tibshirani (1993): the statistical basis for choosing and bounding our decision threshold.</p>
          <p><b>Gap addressed:</b> a complete, reproducible account of building such a system under a hard no-ground-truth, no-external-API constraint, and then measuring its own bias with position, identity and length properly controlled.</p>
        </div>
      </div>

      <!-- OBJECTIVES -->
      <div class="section">
        <div class="section-title h-purple">Objectives</div>
        <div class="section-body">
          <ul>
            <li>Build a <b>six-agent pipeline</b> in which generation and evaluation are performed by <b>different</b> models, running fully offline via Ollama with real-time SSE streaming.</li>
            <li>Define a <b>multi-signal confidence score</b> blending model-internal and external evidence so no single signal dominates.</li>
            <li>Gate an <b>automatic regeneration loop</b> on that score, with a bounded attempt count.</li>
            <li><b>Calibrate the threshold from data</b> rather than intuition &mdash; accounting for the fact that the gate censors exactly the observations needed to calibrate it.</li>
            <li>Generate a corpus large enough for that calibration to be statistically meaningful, <b>without human annotation</b>.</li>
            <li><b>Measure the validation apparatus itself</b> for position and self-preference bias, and correct what is found.</li>
            <li>Document measurement errors made along the way, including those caught before they reached a conclusion.</li>
          </ul>
        </div>
      </div>

    </div><!-- /left col -->

    <!-- ════ MIDDLE COLUMN ════ -->
    <div class="col">

      <!-- METHODOLOGY -->
      <div class="section">
        <div class="section-title h-cyan">Methodology</div>
        <div class="section-body">
          <p><b>Phase 1 &ndash; Multi-Agent Pipeline</b></p>
          <ul>
            <li>FastAPI backend streaming every stage transition over Server-Sent Events.</li>
            <li>LLaMA&nbsp;3 and Mistral generate independently via <code>asyncio.gather()</code> (langchain-ollama).</li>
            <li>Verifier (<b>phi3</b>, temp=0.1) and Judge (<b>qwen3.5:9b</b>, temp=0.1, reasoning disabled) each score <i>both</i> answers on the same <b>8-factor / 80-point</b> rubric.</li>
            <li>Combiner (<b>Gemma&nbsp;2&nbsp;9B</b>, temp=0.4) synthesises a &le;150-word answer &mdash; deliberately <b>not</b> one of the generators.</li>
          </ul>
          <p><b>Phase 2 &ndash; Bias Controls</b></p>
          <ul>
            <li><b>Brand-blind prompts:</b> evaluators never learn which system wrote which answer.</li>
            <li><b>Position randomisation:</b> a fresh coin-flip per question assigns answers to slots; the true mapping is stored separately so per-model statistics stay recoverable.</li>
            <li>Rubric totals are <b>recomputed</b> from criterion scores &mdash; evaluators were observed stating totals that contradicted their own scores.</li>
          </ul>
          <p><b>Phase 3 &ndash; Label-Free Calibration</b></p>
          <ul>
            <li>Answers above the gate are never regenerated, so the data are <b>censored</b>. A random fraction of <i>passing</i> answers is regenerated anyway, purely to measure &mdash; a <b>control group</b>.</li>
            <li>Three independent routes: two-proportion z-test, ROC with Youden's J, and a 2,000-sample bootstrap.</li>
          </ul>
          <p><b>Phase 4 &ndash; Auditing the Auditor</b></p>
          <ul>
            <li>Embed both candidates and the final answer; measure which the final sits closer to.</li>
            <li>Cross <b>position &times; identity &times; judge verdict</b> to separate effects that are otherwise conflated; control for answer length.</li>
          </ul>
        </div>
      </div>

      <!-- FLOW DIAGRAM -->
      <div class="section">
        <div class="section-title h-pink">Flow Diagram</div>
        <div class="flow-wrap">

          <div class="flow-box blue">User Query</div>
          <div class="flow-arrow">▼</div>

          <div class="flow-box yellow">Context Injection (last 5 queries) &middot; optional RAG retrieval</div>
          <div class="flow-arrow">▼</div>

          <div class="flow-label">── STAGE 1 &amp; 2 — PARALLEL GENERATION ──</div>
          <div class="flow-para">
            <div class="flow-box blue">🔵 LLaMA 3<br>Answer Generator<br><span style="font-size:8px;font-weight:400">temp=0.7 | 600 tokens</span></div>
            <div class="flow-box purple">🟣 Mistral<br>Answer Generator<br><span style="font-size:8px;font-weight:400">temp=0.7 | 600 tokens</span></div>
          </div>
          <div class="flow-label" style="font-style:italic">answer order is a fresh coin-flip &mdash; evaluators never see which model wrote which</div>
          <div class="flow-arrow">▼</div>

          <div class="flow-label">── STAGE 3 &amp; 4 — PARALLEL VALIDATION ──</div>
          <div class="flow-para">
            <div class="flow-box teal">🔍 Verifier (phi3)<br>8-factor rubric /80<br><span style="font-size:8px;font-weight:400">temp=0.1 | blind</span></div>
            <div class="flow-box yellow">📊 Similarity Scorer<br>(No LLM)<br><span style="font-size:8px;font-weight:400">MiniLM embeddings</span></div>
          </div>
          <div class="flow-arrow">▼</div>

          <div class="flow-label">── STAGE 5 — SEQUENTIAL ──</div>
          <div class="flow-box red">⚖️ Judge (qwen3.5:9b)<br>8-factor rubric /80 + winner<br><span style="font-size:8px;font-weight:400">blind · reasoning off · temp=0.1</span></div>
          <div class="flow-arrow">▼</div>

          <div class="flow-para">
            <div class="flow-box teal">🌐 Wikipedia<br><span style="font-size:8px;font-weight:400">relevance-gated</span></div>
            <div class="flow-box teal">🗂️ Wikidata<br><span style="font-size:8px;font-weight:400">entity match</span></div>
          </div>
          <div class="flow-arrow">▼</div>

          <div class="flow-box purple">Weighted Confidence Score (6 signals → 0–1)<br><span style="font-size:8px;font-weight:400">judge .40 · similarity .15 · wikipedia .15 · agreement .10 · verifier–judge .10 · wikidata .10</span></div>
          <div class="flow-arrow">▼</div>

          <div class="flow-box red">◆ GATE — is score ≥ 0.72 ?<br><span style="font-size:8px;font-weight:400">below → regenerate (max 3 attempts, best attempt kept)</span></div>
          <div class="flow-arrow">▼</div>

          <div class="flow-label">── STAGE 6 — SEQUENTIAL ──</div>
          <div class="flow-box green">✦ Combiner (Gemma 2 9B)<br>Final answer ≤150 words<br><span style="font-size:8px;font-weight:400">not a generator — no answer of its own to prefer</span></div>
          <div class="flow-arrow">▼</div>

          <div class="flow-box blue">SQLite — every raw signal of every attempt logged</div>

        </div>
      </div>

      <!-- EXPERIMENTAL DETAILS -->
      <div class="section">
        <div class="section-title h-pink">Experimental Details</div>
        <div class="section-body">
          <p><b>Dataset:</b> <b>5,000 questions</b> across 10 domains &mdash; Science &amp; Technology, History &amp; Geography, Health &amp; Medicine, Economics &amp; Finance, Philosophy &amp; Ethics, Environment &amp; Climate, Psychology &amp; Behaviour, Society &amp; Culture, Mathematics &amp; Logic, Space &amp; Astronomy. <b>8,432</b> attempt records; 5,000 final answers; mean 1.69 attempts per question.</p>
          <p><b>Models (all local via Ollama):</b> generators <code>llama3</code> and <code>mistral</code> (temp 0.7, 600 tok); Verifier <code>phi3:latest</code> (0.1, 700); Judge <code>qwen3.5:9b</code> (0.1, 900, reasoning off); Combiner <code>gemma2:9b</code> (0.4, 1000).</p>
          <p><b>Embedding Model:</b> all-MiniLM-L6-v2 (22.7M params, 384-dim, sentence-transformers), GPU-resident.</p>
          <p><b>Rubric (8 criteria &times; 10 = 80):</b> Factual Correctness, Question Relevance, Context Relevance, Faithfulness, Completeness, Hallucination-Free, Clarity, Consistency &mdash; applied identically by Verifier and Judge, which is what makes their agreement meaningful.</p>
          <p><b>Hardware:</b> single workstation, NVIDIA RTX 4090 (24&nbsp;GB VRAM), Windows, Python 3.13. The six models exceed VRAM if co-resident, so the pipeline runs at concurrency 1 and the runtime evicts weights between stages.</p>
          <p><b>Statistical Methods:</b> two-proportion z-test; ROC with Youden's J; 2,000-sample bootstrap; Wilson intervals; inverse-probability weighting for a control rate that changed mid-run.</p>
          <p><b>Software Stack:</b> Python · FastAPI · Ollama · LangChain · sentence-transformers · scikit-learn · SciPy · SQLite · NumPy.</p>
        </div>
      </div>

    </div><!-- /middle col -->

    <!-- ════ RIGHT COLUMN ════ -->
    <div class="col">

      <!-- RESULTS -->
      <div class="section">
        <div class="section-title h-mauve">Results</div>
        <div class="section-body">

          <p><b>✅ Threshold calibrated from data (n = 5,000):</b></p>
          <ul>
            <li>Three independent routes agree: z-test <b>p = 0.011</b>; ROC point optimum <b>t = 0.70</b> (AUC <b>0.629</b>); bootstrap median <b>0.72</b>, 95% CI <b>[0.69, 0.75]</b>.</li>
            <li>Youden's J is near-flat across 0.70&ndash;0.74, so that band is statistically indistinguishable &mdash; the choice within it is policy, not statistics.</li>
            <li><b>&tau; = 0.72 adopted</b> (bootstrap median): sensitivity <b>66.7%</b>, specificity <b>50.3%</b>. The earlier 0.75 sat at the very edge of the CI, trading specificity (30.2%) for recall.</li>
          </ul>

          <p style="margin-top:6px"><b>🔍 The validation apparatus audited itself:</b></p>
          <ul>
            <li>The original Combiner was <code>llama3</code> &mdash; also a generator, so it was merging <i>its own writing</i> against Mistral's.</li>
            <li><b>Identity effect: +18.1 pp</b> preference for its own answer, position held fixed (p &asymp; 1.7&times;10<sup>&minus;89</sup>).</li>
            <li><b>Position effect: +10.8 pp</b> toward whichever answer sat in prompt slot 1 (p &asymp; 5.7&times;10<sup>&minus;53</sup>).</li>
            <li><b>Length ruled out:</b> r = +0.029; the effect persists at <b>61.1%</b> among length-matched pairs.</li>
            <li>Mechanism is <i>selective obedience</i>: the Combiner followed the Judge <b>69.4%</b> of the time when the Judge picked its own answer, but only <b>49.3%</b> otherwise.</li>
            <li>Fixed by construction &mdash; Gemma 2 9B has no answer of its own among the two it merges.</li>
          </ul>

          <p style="margin-top:6px"><b>🧪 Evaluator discrimination verified:</b> the Verifier scores intact answers <b>77&ndash;80/80</b> and deliberately corrupted answers <b>0&ndash;8/80</b> &mdash; a <b>74.5-point</b> separation, confirming the evaluators discriminate rather than rubber-stamp.</p>

          <p style="margin-top:6px;padding:4px 6px;background:#fff8e1;border-left:3px solid #f9a825;font-size:10.5px;">
            <b>⚠️ Four measurement errors were caught before they reached a conclusion</b> &mdash; a model reporting a total contradicting its own scores; a &ldquo;second opinion&rdquo; signal secretly derived from the Judge; a sampling weight applied after the rate had changed mid-run; and restart-orphaned duplicate final rows. Each was found by checking a result that looked <i>too clean</i>.
          </p>

        </div>
      </div>

      <!-- CONCLUSION -->
      <div class="section">
        <div class="section-title h-pink">Conclusion</div>
        <div class="section-body">
          <p>A locally hosted question-answering system <b>can</b> be validated without ground truth &mdash; with honest limits. Internal consistency, evaluator discrimination, relative improvement and threshold calibration are all achievable label-free. <b>Absolute factual accuracy is not</b>, and no such claim is made.</p>
          <p>Key contributions:</p>
          <ul>
            <li><b>A label-free validation methodology</b> using a deliberately injected control group to defeat the censoring that the regeneration gate itself creates.</li>
            <li><b>A threshold derived three independent ways</b> that converge on one narrow band &mdash; &tau; = 0.72, CI [0.69, 0.75] &mdash; rather than chosen by intuition.</li>
            <li><b>A measured decomposition of evaluator bias</b> into identity (+18.1 pp) and position (+10.8 pp) components with length controlled &mdash; which <i>overturned this project's own prior design decision</i>.</li>
            <li><b>A fully offline six-agent system</b> in which no model both writes an answer and evaluates or merges it.</li>
          </ul>
          <p>The system is best understood not as a correctness oracle but as a <b>calibrated quality gate</b>: it reliably separates weaker answers from stronger ones and acts on that separation, while remaining honest about what it cannot certify. <b>Open problem:</b> the +10.8 pp position effect is mitigated but not eliminated; extractive selection (MMR) would remove it by construction.</p>
        </div>
      </div>

      <!-- REFERENCES -->
      <div class="section">
        <div class="section-title h-green">References</div>
        <div class="section-body">
          <p>[1] L. Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena," <i>NeurIPS</i>, 2023.</p>
          <p>[2] Y. Liu et al., "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment," <i>EMNLP</i>, 2023.</p>
          <p>[3] S. Kim et al., "Prometheus: Inducing Fine-grained Evaluation Capability in Language Models," <i>ICLR</i>, 2024.</p>
          <p>[4] T. Zhang et al., "BERTScore: Evaluating Text Generation with BERT," <i>ICLR</i>, 2020.</p>
          <p>[5] Q. Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation," <i>arXiv:2308.08155</i>, 2023.</p>
          <p>[6] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," <i>NeurIPS</i>, 2020.</p>
          <p>[7] N. Reimers &amp; I. Gurevych, "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks," <i>EMNLP</i>, 2019.</p>
          <p>[8] W. J. Youden, "Index for rating diagnostic tests," <i>Cancer</i>, vol. 3, no. 1, pp. 32&ndash;35, 1950.</p>
          <p>[9] B. Efron &amp; R. J. Tibshirani, <i>An Introduction to the Bootstrap</i>. Chapman &amp; Hall, 1993.</p>
          <p>[10] J. Carbonell &amp; J. Goldstein, "The use of MMR, diversity-based reranking...," <i>ACM SIGIR</i>, 1998.</p>
          <p>[11] A. Q. Jiang et al., "Mistral 7B," <i>arXiv:2310.06825</i>, 2023.</p>
          <p>[12] Gemma Team, "Gemma 2: Improving Open Language Models at a Practical Size," <i>arXiv:2408.00118</i>, 2024.</p>
        </div>
      </div>

    </div><!-- /right col -->
  </div><!-- /body -->
"""


def main() -> None:
    s = io.open(POSTER, encoding="utf-8").read()
    before = len(s)

    # 1. title
    s, n1 = re.subn(
        r'(<div class="title">).*?(</div>)',
        lambda m: m.group(1) + TITLE + m.group(2),
        s, count=1, flags=re.S)

    # 2. academic year - align with the official report template (2026-27)
    s, n2 = re.subn(r'(<div class="year">)[^<]*(</div>)',
                    r'\g<1>Academic Year 2026–27\g<2>', s, count=1)

    # 3. author block
    s, n3 = re.subn(r'(<div class="header-names">\s*\n).*?(\s*</div>)',
                    lambda m: m.group(1) + NAMES + m.group(2),
                    s, count=1, flags=re.S)

    # 4. the whole three-column body
    s, n4 = re.subn(r'  <div class="body">.*?  </div><!-- /body -->',
                    lambda m: BODY.rstrip("\n"), s, count=1, flags=re.S)

    io.open(POSTER, "w", encoding="utf-8", newline="").write(s)
    print(f"title:{n1}  year:{n2}  names:{n3}  body:{n4}")
    print(f"{before} -> {len(s)} bytes")

    stale = [w for w in ("Neural Judge", "neural judge", "BERT-based", "MacBook",
                         "1,000-sample", "5-Criterion", "5 criteria", "Name 1",
                         "Human Feedback Loop", "PandaLM", "RewardBench")
             if w in s]
    print("stale phrases remaining:", stale or "none")


if __name__ == "__main__":
    main()
