"""
deliverables/report/make_figures.py
===================================
Generates the analysis figures for the project report from the real corpus.

The threshold figures IMPORT the pipeline's own analysis functions from
training/optimal_threshold_roc.py rather than re-deriving the statistics here.
That matters: the real analysis carries an inverse-probability-of-sampling
correction for a control rate that changed mid-run (RESEARCH_LOG Section 34),
and a figure that quietly recomputed the numbers without that correction would
contradict the text it illustrates.

Figures are drawn in a restrained print style - serif type to sit with Times New
Roman body text, muted fills, no chartjunk, and no colour that carries meaning on
its own (every series is also distinguishable in greyscale).

Run:  py -3.13 deliverables/report/make_figures.py
"""

from __future__ import annotations

import csv
import sqlite3
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
OUT = Path(__file__).parent
DB = ROOT / "data" / "judge_training_v2.db"

INK = "#1f2430"
MUTED = "#6b7280"
FILL = "#8ea3c4"
FILL2 = "#c9b08a"
ACCENT = "#9d2f2f"

plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "DejaVu Serif"],
    "font.size": 9.5,
    "axes.edgecolor": "#9aa3b0",
    "axes.labelcolor": INK,
    "axes.titlesize": 10.5,
    "axes.titleweight": "bold",
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "axes.grid": True,
    "grid.color": "#e3e7ee",
    "grid.linewidth": 0.7,
    "figure.dpi": 200,
    "savefig.bbox": "tight",
    "savefig.facecolor": "white",
})


def tidy(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.set_axisbelow(True)


# ------------------------------------------------------------ corpus data ---
def fig_score_distribution():
    con = sqlite3.connect(DB)
    finals = [r[0] for r in con.execute(
        "SELECT weighted_score FROM pipeline_runs "
        "WHERE is_final_attempt=1 AND weighted_score IS NOT NULL")]
    allatt = [r[0] for r in con.execute(
        "SELECT weighted_score FROM pipeline_runs WHERE weighted_score IS NOT NULL")]
    con.close()
    fig, ax = plt.subplots(figsize=(5.6, 3.0))
    bins = np.linspace(0.25, 0.90, 60)
    ax.hist(allatt, bins=bins, color="#d7dde8", label=f"all attempts (n={len(allatt):,})")
    ax.hist(finals, bins=bins, color=FILL, label=f"final answers (n={len(finals):,})")
    ax.axvline(0.72, color=ACCENT, lw=1.6, ls="--")
    ax.text(0.723, ax.get_ylim()[1] * 0.92, r"$\tau = 0.72$", color=ACCENT,
            fontsize=9, va="top")
    ax.set_xlabel("weighted confidence score")
    ax.set_ylabel("count")
    ax.set_title("Distribution of the weighted confidence score")
    ax.legend(frameon=False, fontsize=8.5, loc="upper left")
    tidy(ax)
    fig.savefig(OUT / "fig_score_distribution.png")
    plt.close(fig)
    below = sum(1 for s in finals if s < 0.72)
    print(f"  fig_score_distribution  (finals below tau: {below}/{len(finals)} = {below/len(finals)*100:.1f}%)")


def fig_attempts():
    con = sqlite3.connect(DB)
    rows = dict(con.execute(
        "SELECT attempt_number, COUNT(*) FROM pipeline_runs GROUP BY attempt_number"))
    reasons = dict(con.execute(
        "SELECT COALESCE(regen_reason,'final / not regenerated'), COUNT(*) "
        "FROM pipeline_runs GROUP BY regen_reason"))
    con.close()
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(6.6, 2.8))
    ks = sorted(rows)
    a1.bar([str(k) for k in ks], [rows[k] for k in ks], color=FILL, width=0.6)
    for k in ks:
        a1.text(str(k), rows[k] + 60, f"{rows[k]:,}", ha="center", fontsize=8.5, color=INK)
    a1.set_xlabel("attempt number")
    a1.set_ylabel("records")
    a1.set_title("Attempts per question")
    tidy(a1)
    lbl = list(reasons)
    a2.barh(range(len(lbl)), [reasons[k] for k in lbl],
            color=[FILL2 if "control" in k else FILL for k in lbl], height=0.55)
    a2.set_yticks(range(len(lbl)))
    a2.set_yticklabels([k.replace("_", " ") for k in lbl], fontsize=8.5)
    for i, k in enumerate(lbl):
        a2.text(reasons[k] + 60, i, f"{reasons[k]:,}", va="center", fontsize=8.5, color=INK)
    a2.set_xlabel("records")
    a2.set_title("Why an attempt was regenerated")
    tidy(a2)
    fig.savefig(OUT / "fig_attempts.png")
    plt.close(fig)
    print(f"  fig_attempts            ({rows})")


# -------------------------------------------------- threshold calibration ---
def threshold_figures():
    import random
    from training.optimal_threshold_roc import (
        load_rows_with_reason, build_labeled_set, roc_point,
        compute_auc, find_optimal, bootstrap_optimal,
    )
    rows = load_rows_with_reason()
    labeled = build_labeled_set(rows)
    # Use the analysis script's OWN grid and seed. A finer grid finds a
    # different argmax on a near-flat plateau (0.735 rather than 0.70), and an
    # unseeded bootstrap shifts the CI's upper bound between 0.74 and 0.75 -
    # either would put a figure at odds with the numbers in the text it
    # illustrates. Reproducing the published analysis exactly matters more here
    # than a smoother-looking curve.
    grid = [round(0.50 + 0.01 * i, 2) for i in range(37)]   # 0.50 .. 0.86
    random.seed(7)
    pts = [(t, roc_point(labeled, t)) for t in grid]
    pts = [(t, p) for t, p in pts if p]
    auc = compute_auc(labeled, grid)
    best = find_optimal(labeled, grid)

    # --- ROC curve ---
    fpr = [1 - p["specificity"] for _, p in pts]
    tpr = [p["sensitivity"] for _, p in pts]
    order = np.argsort(fpr)
    fig, ax = plt.subplots(figsize=(3.6, 3.4))
    ax.plot([0, 1], [0, 1], color="#c4cad4", lw=1, ls=":")
    ax.plot(np.array(fpr)[order], np.array(tpr)[order], color=INK, lw=1.6)
    if best:
        bp = dict(pts)[best["t"]] if best["t"] in dict(pts) else None
        if bp:
            ax.plot(1 - bp["specificity"], bp["sensitivity"], "o",
                    color=ACCENT, ms=6, zorder=5)
            ax.annotate(f"Youden optimum\nt = {best['t']:.2f}",
                        (1 - bp["specificity"], bp["sensitivity"]),
                        textcoords="offset points", xytext=(8, -22),
                        fontsize=8.5, color=ACCENT)
    ax.set_xlabel("false positive rate (1 − specificity)")
    ax.set_ylabel("true positive rate (sensitivity)")
    ax.set_title(f"ROC of the confidence score\nAUC = {auc:.3f}")
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    tidy(ax)
    fig.savefig(OUT / "fig_roc.png")
    plt.close(fig)

    # --- Youden's J across the grid ---
    ts = [t for t, _ in pts]
    js = [p["sensitivity"] + p["specificity"] - 1 for _, p in pts]
    fig, ax = plt.subplots(figsize=(5.6, 2.8))
    ax.plot(ts, js, color=INK, lw=1.6)
    ax.axvspan(0.70, 0.74, color="#eef1f6", zorder=0)
    ax.set_ylim(min(js) - 0.012, max(js) * 1.30)        # headroom so no label clips
    ax.text(0.72, min(js) - 0.006, "near-flat plateau 0.70 – 0.74", ha="center",
            va="bottom", fontsize=8.5, color=MUTED)
    ax.axvline(0.72, color=ACCENT, lw=1.4, ls="--")
    ax.annotate(r"adopted $\tau=0.72$", xy=(0.72, max(js)),
                xytext=(0.775, max(js) * 1.17), fontsize=8.5, color=ACCENT,
                arrowprops=dict(arrowstyle="-", color=ACCENT, lw=0.9))
    ax.set_xlabel("candidate threshold")
    ax.set_ylabel("Youden's J")
    ax.set_title("Youden's J across candidate thresholds")
    tidy(ax)
    fig.savefig(OUT / "fig_youden.png")
    plt.close(fig)

    # --- bootstrap distribution ---
    boots = bootstrap_optimal(labeled, grid, n_boot=2000)
    fig, ax = plt.subplots(figsize=(5.6, 2.8))
    ax.hist(boots, bins=np.arange(0.60, 0.87, 0.01), color=FILL)
    lo, hi = np.percentile(boots, [2.5, 97.5])
    med = float(np.median(boots))
    ax.axvline(med, color=ACCENT, lw=1.6)
    ax.axvline(lo, color=MUTED, lw=1.1, ls="--")
    ax.axvline(hi, color=MUTED, lw=1.1, ls="--")
    ax.text(med + 0.004, ax.get_ylim()[1] * 0.9, f"median {med:.2f}",
            color=ACCENT, fontsize=8.5)
    ax.set_xlabel("optimal threshold in resample")
    ax.set_ylabel("resamples")
    ax.set_title(f"Bootstrap of the optimal threshold (2,000 resamples)\n"
                 f"95% CI [{lo:.2f}, {hi:.2f}]")
    tidy(ax)
    fig.savefig(OUT / "fig_bootstrap.png")
    plt.close(fig)
    print(f"  fig_roc / fig_youden / fig_bootstrap  "
          f"(AUC {auc:.3f}, optimum {best['t'] if best else '?'}, CI [{lo:.2f}, {hi:.2f}])")
    return auc, best, (lo, med, hi)


# ------------------------------------------------------------ combiner bias ---
def fig_combiner_bias():
    path = ROOT / "training" / "combiner_bias_rows.csv"
    if not path.exists():
        print("  ! combiner_bias_rows.csv missing, skipping bias figure")
        return
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    a_is_llama = np.array([r["model_a"] == "llama3" for r in rows])
    delta = np.array([float(r["delta_pos"]) for r in rows])
    judge_llama = np.array([r["judge_picked_llama"] == "1" for r in rows])
    lean_slot_a = delta > 0

    # Grouped bars: slot-1 model on the axis, judge verdict in the legend.
    # Four free-text labels under four bars collide into unreadable mush at this
    # figure width, so the second factor moves into a legend instead.
    cells, counts = {}, {}
    for an, am in (("llama3", a_is_llama), ("mistral", ~a_is_llama)):
        for jn, jm in (("llama3", judge_llama), ("mistral", ~judge_llama)):
            m = am & jm
            cells[(an, jn)] = lean_slot_a[m].mean() * 100
            counts[(an, jn)] = int(m.sum())

    fig, (a1, a2) = plt.subplots(1, 2, figsize=(7.0, 3.1),
                                 gridspec_kw={"width_ratios": [1.45, 1]})
    x = np.arange(2); w = 0.34
    slots = ["llama3", "mistral"]
    for k, (jn, col) in enumerate((("llama3", FILL), ("mistral", FILL2))):
        vals = [cells[(s, jn)] for s in slots]
        bars = a1.bar(x + (k - 0.5) * w, vals, width=w, color=col,
                      label=f"judge picked {jn}")
        for b, v, s in zip(bars, vals, slots):
            a1.text(b.get_x() + b.get_width() / 2, v + 1.6, f"{v:.1f}%",
                    ha="center", fontsize=8.2, color=INK)
            a1.text(b.get_x() + b.get_width() / 2, 3, f"n={counts[(s, jn)]:,}",
                    ha="center", fontsize=6.8, color="white")
    a1.axhline(50, color=ACCENT, lw=1.2, ls="--")
    a1.text(1.48, 51.5, "no preference", color=ACCENT, fontsize=7.8, ha="right")
    a1.set_xticks(x)
    a1.set_xticklabels([f"slot 1 = {s}" for s in slots], fontsize=9)
    a1.set_ylabel("final answer leans to slot 1 (%)")
    a1.set_ylim(0, 104)
    a1.set_title("Position × identity × judge verdict")
    a1.legend(frameon=False, fontsize=7.8, loc="upper center", ncol=2,
              bbox_to_anchor=(0.5, -0.14))
    tidy(a1)

    id_eff = (lean_slot_a[a_is_llama].mean() - lean_slot_a[~a_is_llama].mean()) * 100
    pos_eff = (lean_slot_a.mean() - 0.5) * 100
    b2 = a2.bar(["identity\n(own answer)", "position\n(slot 1)"], [id_eff, pos_eff],
                color=[ACCENT, FILL], width=0.5)
    for b, v in zip(b2, [id_eff, pos_eff]):
        a2.text(b.get_x() + b.get_width() / 2, v + 0.6, f"+{v:.1f} pp",
                ha="center", fontsize=9, color=INK)
    a2.axhline(0, color="#9aa3b0", lw=0.9)
    a2.set_ylabel("effect size (percentage points)")
    a2.set_ylim(0, max(id_eff, pos_eff) * 1.3)
    a2.set_title("Decomposed effects")
    tidy(a2)
    fig.savefig(OUT / "fig_combiner_bias.png")
    plt.close(fig)
    print(f"  fig_combiner_bias       (identity +{id_eff:.1f} pp, position +{pos_eff:.1f} pp)")


def main():
    print("generating report figures from the live corpus:")
    fig_score_distribution()
    fig_attempts()
    threshold_figures()
    fig_combiner_bias()
    print("done ->", OUT)


if __name__ == "__main__":
    main()
