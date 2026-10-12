"""
training/combiner_replay.py
============================
TIER 1 of the combiner-bias investigation: a controlled replay that swaps ONLY
the combiner model, with every other input frozen.

Why a replay is possible at all
-------------------------------
The Combiner is strictly terminal - utils/scoring.py never takes final_answer
as a signal, and generate_training_data_v2.py runs the combiner once, after the
regeneration loop closes. Every combiner input (question, answer_a, answer_b,
verifier_raw, judge_raw) is already stored per row. So the combiner can be
re-run in isolation on the existing corpus without regenerating the pipeline,
and without invalidating any dataset result.

Design: 2 models x 2 orders, fully crossed, each question its own control
-------------------------------------------------------------------------
  models : llama3    - reproduces production, the baseline to beat
           gemma2:9b - neutral candidate; neither generator, nor the verifier
                       (phi3), nor the judge (qwen3.5:9b), so it has no "self"
                       among the two answers it is merging
  orders : forward   - answers exactly as stored
           swapped   - answers exchanged, AND the A/B labels inside
                       verifier_raw / judge_raw remapped to match

Averaging the two orders within a question cancels position exactly, which
isolates IDENTITY lean. Comparing the two orders isolates POSITION lean. Tier 0
measured identity at +18.1 pp and position at +10.8 pp for llama3; this run
tests whether gemma2 drops the identity term.

The label remap matters: the judge does not only use "## Answer 1" headers, its
Overall Reasoning prose names "Answer 1" / "Answer 2" too. Swapping the answers
without remapping those references would feed the combiner a verdict pointing at
the wrong text - contaminating the very effect being measured.

Results stream into training/combiner_replay.db and the run is resumable, so a
restart (this project has a history of them) never loses completed calls. Models
are processed in an outer loop so Ollama reloads weights once per model, not
once per call.

Run:  py -3.13 training/combiner_replay.py --limit 10          # pilot
      py -3.13 training/combiner_replay.py --limit 200         # full
      py -3.13 training/combiner_replay.py --analyze           # score results
"""

from __future__ import annotations

import argparse
import os
import random
import re
import sqlite3
import sys
import time
from pathlib import Path

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

SRC_DB = ROOT / "data" / "judge_training_v2.db"
OUT_DB = ROOT / "training" / "combiner_replay.db"

BASELINE_MODEL = "llama3"
CANDIDATE_MODEL = "gemma2:9b"
SAMPLE_SEED = 20261012          # fixed so the sample is reproducible

# Swap "Answer 1" <-> "Answer 2" wherever they appear, atomically. Case and
# plural are preserved; only the digit moves. Used on verifier_raw / judge_raw
# whenever the two answers are exchanged in the prompt.
_LABEL = re.compile(r"\b(answers?)(\s*)([12])\b", re.IGNORECASE)


def remap_labels(text: str) -> str:
    def flip(m: re.Match) -> str:
        return f"{m.group(1)}{m.group(2)}{'2' if m.group(3) == '1' else '1'}"
    return _LABEL.sub(flip, text or "")


def init_out_db() -> sqlite3.Connection:
    conn = sqlite3.connect(OUT_DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS replay (
               question_idx  INTEGER,
               model         TEXT,
               order_mode    TEXT,       -- 'forward' | 'swapped'
               combined      TEXT,
               elapsed_secs  REAL,
               created_at    TEXT,
               PRIMARY KEY (question_idx, model, order_mode)
           )"""
    )
    conn.commit()
    return conn


def load_sample(limit: int) -> list[dict]:
    conn = sqlite3.connect(SRC_DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """SELECT question_idx, question, answer_a, answer_b,
                  verifier_raw, judge_raw, model_a, model_b, winner
           FROM pipeline_runs
           WHERE is_final_attempt = 1
             AND final_answer IS NOT NULL AND length(final_answer) > 0
             AND answer_a IS NOT NULL AND answer_b IS NOT NULL
             AND judge_raw IS NOT NULL AND verifier_raw IS NOT NULL
           ORDER BY question_idx"""
    ).fetchall()
    conn.close()
    rows = [dict(r) for r in rows]
    rng = random.Random(SAMPLE_SEED)
    rng.shuffle(rows)
    return rows[:limit]


def run_replay(limit: int, models: list[str]) -> None:
    from agents.base_agent import BaseAgent
    from agents.combiner_agent import build_combiner_prompt

    sample = load_sample(limit)
    out = init_out_db()
    done = {
        (q, m, o)
        for q, m, o in out.execute("SELECT question_idx, model, order_mode FROM replay")
    }

    total = len(sample) * len(models) * 2
    todo = total - sum(
        1 for r in sample for m in models for o in ("forward", "swapped")
        if (r["question_idx"], m, o) in done
    )
    print(f"Sample: {len(sample)} questions x {len(models)} models x 2 orders "
          f"= {total} calls ({todo} remaining)")

    n = 0
    t_start = time.time()
    # Outer loop over MODELS so Ollama loads each model's weights once.
    for model in models:
        print(f"\n{'=' * 64}\nCOMBINER MODEL: {model}\n{'=' * 64}")
        agent = BaseAgent(
            role=f"Combiner[{model}]",
            model_name=model,
            temperature=0.4,      # identical to production combiner
            num_predict=1000,     # identical to production combiner
            system_prompt=(
                "You are a senior AI editor and synthesiser. You excel at taking "
                "multiple imperfect pieces of writing and crafting a single masterpiece. "
                "You never introduce new information not found in the source answers - "
                "your role is to merge and polish, not invent. The final answer you "
                "produce is presented directly to the end user, so it must be accurate, "
                "clear, and complete. Use well-structured paragraphs or bullet points."
            ),
        )

        for r in sample:
            qidx = r["question_idx"]
            for order_mode in ("forward", "swapped"):
                if (qidx, model, order_mode) in done:
                    continue
                if order_mode == "forward":
                    a1, a2 = r["answer_a"], r["answer_b"]
                    ver, jud = r["verifier_raw"], r["judge_raw"]
                else:
                    a1, a2 = r["answer_b"], r["answer_a"]
                    ver = remap_labels(r["verifier_raw"])
                    jud = remap_labels(r["judge_raw"])

                prompt = build_combiner_prompt(r["question"], a1, a2, ver, jud)
                t0 = time.time()
                try:
                    combined = agent.run(prompt)
                except Exception as e:                      # keep the run alive
                    print(f"  !! q{qidx} {order_mode} failed: {e}")
                    continue
                dt = time.time() - t0
                out.execute(
                    "INSERT OR REPLACE INTO replay VALUES (?,?,?,?,?,datetime('now'))",
                    (qidx, model, order_mode, combined, dt),
                )
                out.commit()
                n += 1
                rate = (time.time() - t_start) / n
                print(f"  [{n}/{todo}] q{qidx:<5} {order_mode:<8} {dt:5.1f}s "
                      f"| avg {rate:4.1f}s | eta {(todo - n) * rate / 60:5.1f} min")
    out.close()
    print(f"\nDone: {n} calls in {(time.time() - t_start) / 60:.1f} min")


def analyze() -> None:
    """Score the replayed answers: identity lean (orders averaged, so position
    cancels) and position lean (orders compared)."""
    import numpy as np

    src = sqlite3.connect(SRC_DB)
    src.row_factory = sqlite3.Row
    meta = {
        r["question_idx"]: dict(r)
        for r in src.execute(
            """SELECT question_idx, answer_a, answer_b, model_a, winner
               FROM pipeline_runs WHERE is_final_attempt = 1"""
        )
    }
    src.close()

    out = sqlite3.connect(OUT_DB)
    rep = out.execute(
        "SELECT question_idx, model, order_mode, combined FROM replay"
    ).fetchall()
    out.close()
    if not rep:
        sys.exit("No replay rows yet - run without --analyze first.")

    # Encode every distinct text once.
    from sentence_transformers import SentenceTransformer
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    enc = SentenceTransformer("all-MiniLM-L6-v2", device=device)

    qids = sorted({q for q, _, _, _ in rep})
    src_texts, idx_of = [], {}
    for q in qids:
        idx_of[("A", q)] = len(src_texts); src_texts.append(meta[q]["answer_a"])
        idx_of[("B", q)] = len(src_texts); src_texts.append(meta[q]["answer_b"])
    for i, (q, m, o, c) in enumerate(rep):
        idx_of[("C", i)] = len(src_texts); src_texts.append(c or "")
    print(f"Encoding {len(src_texts)} texts on {device} ...")
    E = enc.encode(src_texts, batch_size=128, convert_to_numpy=True,
                   normalize_embeddings=True, show_progress_bar=True)

    # lean_llama > 0  => combined output sits closer to llama3's answer
    recs: dict[tuple[str, int], dict[str, float]] = {}
    for i, (q, m, o, c) in enumerate(rep):
        va, vb = E[idx_of[("A", q)]], E[idx_of[("B", q)]]
        vc = E[idx_of[("C", i)]]
        d_pos = float(vc @ va - vc @ vb)          # >0 => closer to stored slot A
        a_is_llama = meta[q]["model_a"] == "llama3"
        recs.setdefault((m, q), {})[o] = d_pos if a_is_llama else -d_pos
        recs[(m, q)]["_slot"] = d_pos if o == "forward" else recs[(m, q)].get("_slot", 0)

    print("\n" + "=" * 72)
    print("TIER 1 RESULTS - identity lean with position cancelled")
    print("=" * 72)
    print(f"{'model':<12} {'n':>5} {'identity lean':>15} {'leans llama3':>14} {'p':>10}")
    print("-" * 60)
    models = sorted({m for (m, _) in recs})
    summary = {}
    for m in models:
        pairs = [v for (mm, _), v in recs.items()
                 if mm == m and "forward" in v and "swapped" in v]
        if not pairs:
            continue
        # Average the two orders within a question: position cancels exactly.
        lean = np.array([(v["forward"] + v["swapped"]) / 2 for v in pairs])
        wins = int((lean > 0).sum()); n = len(lean)
        try:
            from scipy.stats import binomtest
            p = float(binomtest(wins, n, 0.5).pvalue)
        except Exception:
            p = float("nan")
        summary[m] = (n, lean.mean(), wins / n, p)
        print(f"{m:<12} {n:>5} {lean.mean():>+15.4f} {wins / n * 100:>13.1f}% {p:>10.3g}")

    print("\n" + "=" * 72)
    print("POSITION lean (same model, slot-1 preference across both orders)")
    print("=" * 72)
    print(f"{'model':<12} {'n':>5} {'slot-1 lean':>14} {'prefers slot 1':>16}")
    print("-" * 52)
    for m in models:
        vals = []
        for (mm, q), v in recs.items():
            if mm != m or "forward" not in v or "swapped" not in v:
                continue
            a_is_llama = meta[q]["model_a"] == "llama3"
            fwd_slot1 = v["forward"] if a_is_llama else -v["forward"]
            # in swapped order, stored-B occupies slot 1
            swp_slot1 = -(v["swapped"] if a_is_llama else -v["swapped"])
            vals.append((fwd_slot1 + swp_slot1) / 2)
        if vals:
            arr = np.array(vals)
            print(f"{m:<12} {len(arr):>5} {arr.mean():>+14.4f} "
                  f"{(arr > 0).mean() * 100:>15.1f}%")

    if BASELINE_MODEL in summary and CANDIDATE_MODEL in summary:
        b, c = summary[BASELINE_MODEL], summary[CANDIDATE_MODEL]
        print("\n" + "=" * 72)
        print("VERDICT")
        print("=" * 72)
        print(f"  {BASELINE_MODEL:<10} identity lean {b[1]:+.4f}  "
              f"({b[2] * 100:.1f}% toward llama3, p={b[3]:.3g})")
        print(f"  {CANDIDATE_MODEL:<10} identity lean {c[1]:+.4f}  "
              f"({c[2] * 100:.1f}% toward llama3, p={c[3]:.3g})")
        # Report DISTANCE FROM PARITY, not raw shift. A model can move a long way
        # and sail past 50/50 - "shifted 30 pp toward parity" would be flatly
        # misleading if it overshot and landed further from parity than it began.
        b_dist, c_dist = abs(b[2] - 0.5) * 100, abs(c[2] - 0.5) * 100
        print(f"  raw shift: {c[1] - b[1]:+.4f} cosine "
              f"({(c[2] - b[2]) * 100:+.1f} pp)")
        print(f"  |distance from 50/50 parity|: {BASELINE_MODEL} {b_dist:.1f} pp "
              f"-> {CANDIDATE_MODEL} {c_dist:.1f} pp "
              f"({'IMPROVED' if c_dist < b_dist else 'OVERSHOT - worse on identity'})")
        if (b[2] - 0.5) * (c[2] - 0.5) < 0:
            print("  NOTE: the lean CHANGED SIGN - the candidate does not merely "
                  "neutralise the\n        bias, it leans the other way. A new "
                  "asymmetry, not an absence of one.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10,
                    help="questions to sample (default 10, a pilot)")
    ap.add_argument("--models", default=f"{BASELINE_MODEL},{CANDIDATE_MODEL}")
    ap.add_argument("--analyze", action="store_true",
                    help="score existing replay rows instead of generating")
    args = ap.parse_args()
    if args.analyze:
        analyze()
    else:
        run_replay(args.limit, [m.strip() for m in args.models.split(",") if m.strip()])


if __name__ == "__main__":
    main()
