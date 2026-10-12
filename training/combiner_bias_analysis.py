"""
training/combiner_bias_analysis.py
===================================
TIER 0 of the combiner-bias investigation: does the Combiner (llama3) favour
its OWN generated answer when synthesising the final answer?

Why this matters
----------------
The Combiner is llama3, and llama3 is also one of the two generators. So in
every question one of the two answers it merges is its own writing.
utils/scoring.py already records that final_answer-referenced
BERTScore/BLEU/ROUGE were "systematically biased toward answer_a because the
same model (LLaMA 3) both writes answer_a and drafts final_answer as combiner"
- that bias was removed from the SCORING by excluding those metrics, but it was
never removed from the shipped answer. This script quantifies it.

Method (label-free, no ground truth needed)
-------------------------------------------
For each of the 5000 final rows, embed answer_a, answer_b and final_answer with
the same all-MiniLM-L6-v2 encoder the pipeline uses, then measure which source
answer the final answer sits closer to:

    delta_position = cos(final, answer_a) - cos(final, answer_b)
    lean_llama     = +delta_position if model_a == llama3 else -delta_position

Position is already randomised per question upstream (the coin flip in
generate_training_data_v2.py reaches build_combiner_prompt), so an identity
lean here cannot be explained by slot order. Three confounds are controlled:

  1. POSITION  - reported separately; should be near 50/50 by construction.
  2. JUDGE     - the combiner prompt receives judge_raw and is told to use the
                 judge's decision as guidance, so some lean is just obedience.
                 The decisive test conditions on the judge having picked the
                 MISTRAL answer: llama3-lean that survives that is
                 self-preference, not obedience.
  3. LENGTH    - a combiner may simply retain more of the LONGER source.
                 Reported as a correlation, and re-tested on a length-matched
                 subset.

Run:  py -3.13 training/combiner_bias_analysis.py
"""

from __future__ import annotations

import os
import re
import sqlite3
import sys
from pathlib import Path

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import numpy as np

ROOT = Path(__file__).parent.parent
DB = ROOT / "data" / "judge_training_v2.db"
EMBED_MODEL = "all-MiniLM-L6-v2"   # same encoder the pipeline scores with

# Combiner output often opens with a boilerplate lead-in ("Here is the final
# combined answer:"). It is equidistant from both sources so it mostly cancels,
# but stripping it reduces noise in the cosine deltas.
PREAMBLE = re.compile(r"^\s*here(?:\s+is|\W?s)\b[^\n:]{0,80}:\s*", re.IGNORECASE)


def strip_preamble(t: str) -> str:
    return PREAMBLE.sub("", t or "", count=1).strip()


def load_rows() -> list[dict]:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """SELECT question_idx, answer_a, answer_b, final_answer,
                  model_a, model_b, winner, word_count_a, word_count_b
           FROM pipeline_runs
           WHERE is_final_attempt = 1
             AND final_answer IS NOT NULL AND length(final_answer) > 0
             AND answer_a IS NOT NULL AND answer_b IS NOT NULL
           ORDER BY question_idx"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def embed_all(texts: list[str]):
    from sentence_transformers import SentenceTransformer
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  encoder: {EMBED_MODEL} on {device}")
    m = SentenceTransformer(EMBED_MODEL, device=device)
    return m.encode(
        texts, batch_size=128, convert_to_numpy=True,
        normalize_embeddings=True, show_progress_bar=True,
    )


def binom_p(successes: int, n: int) -> float:
    """Two-sided binomial test against p=0.5; falls back to a normal
    approximation if scipy is unavailable."""
    try:
        from scipy.stats import binomtest
        return float(binomtest(successes, n, 0.5, alternative="two-sided").pvalue)
    except Exception:
        from math import erfc, sqrt
        z = abs(successes - n / 2) / sqrt(n * 0.25)
        return float(erfc(z / sqrt(2)))


def pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def report_lean(label: str, lean: np.ndarray, indent: str = "") -> None:
    """lean > 0 means the final answer sits closer to llama3's answer."""
    n = len(lean)
    if n == 0:
        print(f"{indent}{label}: (no rows)")
        return
    wins = int((lean > 0).sum())
    p = binom_p(wins, n)
    stars = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else "ns"
    print(f"{indent}{label}")
    print(f"{indent}  n = {n}   closer to LLaMA 3: {wins} ({pct(wins / n)})   "
          f"closer to Mistral: {n - wins} ({pct((n - wins) / n)})")
    print(f"{indent}  mean cosine lean = {lean.mean():+.4f}  "
          f"(median {np.median(lean):+.4f})   binomial p = {p:.3g} {stars}")


def main() -> None:
    if not DB.exists():
        sys.exit(f"DB not found: {DB}")

    print("=" * 72)
    print("TIER 0 - COMBINER SELF-PREFERENCE ANALYSIS")
    print("=" * 72)

    rows = load_rows()
    print(f"\nLoaded {len(rows)} final rows from {DB.name}")

    texts = []
    for r in rows:
        texts += [r["answer_a"], r["answer_b"], strip_preamble(r["final_answer"])]
    print(f"Encoding {len(texts)} texts ...")
    emb = embed_all(texts).reshape(len(rows), 3, -1)

    a_vec, b_vec, f_vec = emb[:, 0], emb[:, 1], emb[:, 2]
    sim_a = np.einsum("ij,ij->i", f_vec, a_vec)   # vectors are L2-normalised
    sim_b = np.einsum("ij,ij->i", f_vec, b_vec)
    delta_pos = sim_a - sim_b                      # >0 => leans to POSITION a

    model_a = np.array([r["model_a"] for r in rows])
    winner = np.array([r["winner"] for r in rows])
    wc_a = np.array([r["word_count_a"] or 0 for r in rows], dtype=float)
    wc_b = np.array([r["word_count_b"] or 0 for r in rows], dtype=float)

    a_is_llama = model_a == "llama3"
    lean_llama = np.where(a_is_llama, delta_pos, -delta_pos)

    # Which physical model the judge picked, and each model's answer length
    judge_picked_llama = np.where(winner == "A", a_is_llama, ~a_is_llama)
    wc_llama = np.where(a_is_llama, wc_a, wc_b)
    wc_mistral = np.where(a_is_llama, wc_b, wc_a)

    print(f"\nSanity: cos(final, answer_a) mean {sim_a.mean():.4f} | "
          f"cos(final, answer_b) mean {sim_b.mean():.4f}")
    print(f"        position A held llama3 in {a_is_llama.sum()} / {len(rows)} "
          f"({pct(a_is_llama.mean())}) rows  <- coin flip")

    print("\n" + "-" * 72)
    print("1. HEADLINE - identity lean (position already randomised upstream)")
    print("-" * 72)
    report_lean("Combiner final answer vs the two source answers:", lean_llama)

    print("\n" + "-" * 72)
    print("2. POSITION CONTROL - is this a slot effect rather than identity?")
    print("-" * 72)
    n = len(delta_pos)
    wins_pos = int((delta_pos > 0).sum())
    print(f"  closer to POSITION a: {wins_pos} ({pct(wins_pos / n)})   "
          f"mean lean {delta_pos.mean():+.4f}   "
          f"binomial p = {binom_p(wins_pos, n):.3g}")
    report_lean("  within rows where llama3 sat in position a:",
                lean_llama[a_is_llama], indent="  ")
    report_lean("  within rows where llama3 sat in position b:",
                lean_llama[~a_is_llama], indent="  ")
    print("  -> if both subsets lean the same way, the effect follows IDENTITY, not slot.")

    print("\n" + "-" * 72)
    print("3. JUDGE CONTROL - obedience to the judge vs genuine self-preference")
    print("-" * 72)
    follows = int(((lean_llama > 0) == judge_picked_llama).sum())
    print(f"  Judge picked the llama3 answer in {judge_picked_llama.sum()} "
          f"({pct(judge_picked_llama.mean())}) rows")
    print(f"  Final answer agrees with the judge's pick in {follows} "
          f"({pct(follows / n)}) rows  <- combiner fidelity to judge")
    report_lean("  DECISIVE - rows where the judge picked MISTRAL's answer:",
                lean_llama[~judge_picked_llama], indent="  ")
    report_lean("  (contrast) rows where the judge picked LLAMA 3's answer:",
                lean_llama[judge_picked_llama], indent="  ")
    print("  -> llama3-lean surviving in the MISTRAL-picked subset is self-preference,")
    print("     because there the judge was pushing the combiner the other way.")

    print("\n" + "-" * 72)
    print("4. LENGTH CONTROL - is the combiner just keeping more of the longer answer?")
    print("-" * 72)
    wc_diff = wc_llama - wc_mistral
    finite = np.isfinite(wc_diff) & np.isfinite(lean_llama)
    r_len = float(np.corrcoef(wc_diff[finite], lean_llama[finite])[0, 1])
    print(f"  llama3 answers averaged {wc_llama.mean():.0f} words vs "
          f"mistral {wc_mistral.mean():.0f} words (diff {wc_diff.mean():+.0f})")
    print(f"  corr(length advantage, llama3 lean) = {r_len:+.3f}")
    denom = np.maximum(wc_llama, wc_mistral)
    matched = (denom > 0) & (np.abs(wc_diff) / np.where(denom == 0, 1, denom) <= 0.10)
    report_lean("  length-matched subset (word counts within 10%):",
                lean_llama[matched], indent="  ")
    print("  -> lean persisting in the length-matched subset is not a length artifact.")

    print("\n" + "=" * 72)
    print("VERDICT INPUTS")
    print("=" * 72)
    overall = (lean_llama > 0).mean()
    mistral_subset = lean_llama[~judge_picked_llama]
    ms = (mistral_subset > 0).mean() if len(mistral_subset) else float("nan")
    matched_rate = (lean_llama[matched] > 0).mean() if matched.sum() else float("nan")
    print(f"  overall llama3-lean           : {pct(overall)}")
    print(f"  judge-picked-mistral subset   : {pct(ms)}   (the self-preference estimate)")
    print(f"  length-matched subset         : {pct(matched_rate)}")
    print(f"  corr with length advantage    : {r_len:+.3f}")
    print()

    # ---- full position x identity x judge decomposition -------------------
    # The headline identity lean is NOT interpretable on its own: the combiner
    # also favours whatever text sits in slot 1 of its prompt. Position and
    # identity have to be crossed to tell the two apart, and the judge verdict
    # crossed in as well, since the combiner prompt carries judge_raw.
    print("=" * 72)
    print("5. FULL DECOMPOSITION - position x identity x judge")
    print("=" * 72)
    lean_a = delta_pos > 0          # final sits closer to whatever is in slot a
    print(f"{'a holds':<9} {'judge picked':<14} {'n':>5} {'lean->slot a':>13} {'p':>10}")
    print("-" * 56)
    for a_name, a_mask in (("llama3", a_is_llama), ("mistral", ~a_is_llama)):
        for j_name, j_mask in (("llama3", judge_picked_llama),
                               ("mistral", ~judge_picked_llama)):
            m = a_mask & j_mask
            k = int(lean_a[m].sum())
            tot = int(m.sum())
            if tot:
                print(f"{a_name:<9} {j_name:<14} {tot:>5} {pct(k / tot):>13} "
                      f"{binom_p(k, tot):>10.3g}")
    print()
    print("  Marginals, each averaging over the other factor:")
    for a_name, a_mask in (("llama3", a_is_llama), ("mistral", ~a_is_llama)):
        k, tot = int(lean_a[a_mask].sum()), int(a_mask.sum())
        print(f"    slot a holds {a_name:<8} -> lean to slot a {pct(k / tot)}  (n={tot})")
    id_effect = (lean_a[a_is_llama].mean() - lean_a[~a_is_llama].mean())
    print(f"    IDENTITY effect (llama3 advantage, position held fixed): "
          f"{id_effect * 100:+.1f} pp")
    print(f"    POSITION effect (slot-a advantage, averaged over identity): "
          f"{(lean_a.mean() - 0.5) * 100:+.1f} pp")

    # Cache per-row values so follow-up analysis needs no re-encoding.
    out = ROOT / "training" / "combiner_bias_rows.csv"
    import csv
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["question_idx", "model_a", "winner", "sim_a", "sim_b",
                    "delta_pos", "lean_llama", "judge_picked_llama",
                    "word_count_a", "word_count_b"])
        for i, r in enumerate(rows):
            w.writerow([r["question_idx"], r["model_a"], r["winner"],
                        f"{sim_a[i]:.6f}", f"{sim_b[i]:.6f}",
                        f"{delta_pos[i]:.6f}", f"{lean_llama[i]:.6f}",
                        int(judge_picked_llama[i]),
                        r["word_count_a"], r["word_count_b"]])
    print(f"\n  per-row values cached -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
