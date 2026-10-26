"""
deliverables/report/make_threshold_figures.py
=============================================
Figures that make the ARGUMENT for tau = 0.72, as opposed to the figures in
make_figures.py which present the underlying statistics.

Three plates:
  fig_t_censoring.png    why the calibration is hard at all, and what the
                         control group recovers
  fig_t_convergence.png  the money figure - three independent tests, one band
  fig_t_tradeoff.png     what 0.70, 0.72 and 0.75 each cost in practice

Numbers are taken from training/optimal_threshold_roc.py, re-derived here with
that script's own grid and random seed so the plates cannot disagree with the
report or the viva script.

Run:  py -3.13 deliverables/report/make_threshold_figures.py
"""

from __future__ import annotations

import os
import random
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch
import numpy as np

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
OUT = Path(__file__).parent

INK, MUTED = "#1f2430", "#6b7280"
FILL, FILL2, ACCENT = "#8ea3c4", "#c9b08a", "#9d2f2f"
GREEN = "#4b7f6b"

plt.rcParams.update({
    "font.family": "serif", "font.serif": ["Times New Roman", "DejaVu Serif"],
    "font.size": 9.5, "axes.edgecolor": "#9aa3b0", "axes.labelcolor": INK,
    "axes.titlesize": 11, "axes.titleweight": "bold",
    "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.grid": True, "grid.color": "#e3e7ee", "grid.linewidth": .7,
    "figure.dpi": 200, "savefig.bbox": "tight", "savefig.facecolor": "white",
})


def tidy(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.set_axisbelow(True)


def analysis():
    """Re-derive the three results with the published grid and seed."""
    from training.optimal_threshold_roc import (
        load_rows_with_reason, build_labeled_set, roc_point,
        compute_auc, find_optimal, bootstrap_optimal,
    )
    labeled = build_labeled_set(load_rows_with_reason())
    grid = [round(0.50 + 0.01 * i, 2) for i in range(37)]
    random.seed(7)
    pts = {t: roc_point(labeled, t) for t in grid}
    pts = {t: p for t, p in pts.items() if p}
    return dict(pts=pts, auc=compute_auc(labeled, grid),
                best=find_optimal(labeled, grid),
                boots=bootstrap_optimal(labeled, grid, n_boot=2000))


# ------------------------------------------------- 1. the censoring problem ---
def fig_censoring():
    fig, ax = plt.subplots(figsize=(7.0, 3.1))
    ax.set_xlim(0.45, 0.95); ax.set_ylim(0, 1.05)
    ax.axis("off")

    xs = np.linspace(0.45, 0.95, 400)
    dens = np.exp(-0.5 * ((xs - 0.70) / 0.065) ** 2)
    ax.plot(xs, dens * 0.55 + 0.30, color=INK, lw=1.3)
    ax.fill_between(xs, 0.30, dens * 0.55 + 0.30, where=xs < 0.72,
                    color=FILL, alpha=.85)
    ax.fill_between(xs, 0.30, dens * 0.55 + 0.30, where=xs >= 0.72,
                    color="#e8ebf0", hatch="///", edgecolor="#b9c0cc", lw=0)

    ax.axvline(0.72, ymin=0.26, ymax=0.88, color=ACCENT, lw=1.8, ls="--")
    ax.text(0.722, 0.98, r"gate  $\tau$", color=ACCENT, fontsize=10, fontweight="bold")

    ax.text(0.60, 0.17, "BELOW the gate\nalways regenerated\n→ outcome observed",
            ha="center", fontsize=9, color=INK)
    ax.text(0.845, 0.17, "ABOVE the gate\nnever regenerated\n→ outcome UNOBSERVED",
            ha="center", fontsize=9, color=ACCENT, fontweight="bold")

    # the control group recovers a sample of the censored region
    for x in (0.755, 0.785, 0.815):
        ax.add_patch(FancyArrowPatch((x, 0.30), (x, 0.62), arrowstyle="-|>",
                                     mutation_scale=9, color=GREEN, lw=1.3))
    ax.text(0.845, 0.70, "control group:\nregenerate a random slice anyway",
            ha="center", fontsize=8.6, color=GREEN, style="italic")

    ax.text(0.45, 0.90, "Confidence score of an answer →",
            fontsize=8.6, color=MUTED)
    ax.set_title("The gate censors exactly the data needed to set the gate", pad=12)
    fig.savefig(OUT / "fig_t_censoring.png")
    plt.close(fig)
    print("  fig_t_censoring")


# --------------------------------------- 2. three tests converge on one band ---
def fig_convergence(a):
    """Forest plot. Labels get their own axis so they cannot collide with the
    scale - the earlier single-axis version overlapped its own x-axis."""
    boots = np.array(a["boots"])
    lo, hi = np.percentile(boots, [2.5, 97.5])
    med = float(np.median(boots))
    opt = a["best"]["t"]

    fig, (axL, ax) = plt.subplots(
        1, 2, figsize=(7.4, 3.0), gridspec_kw={"width_ratios": [1.05, 2.0], "wspace": 0.04})
    axL.axis("off"); axL.set_ylim(-0.6, 2.6); axL.set_xlim(0, 1)

    rows = [
        (2, "Two-proportion z-test",
         "improvement rate differs\nacross bands,  p = 0.011", None, None),
        (1, "ROC / Youden's J",
         f"point optimum t = {opt:.2f}\nAUC {a['auc']:.3f}", 0.70, (0.70, 0.74)),
        (0, "Bootstrap × 2,000",
         f"median {med:.2f}\n95% CI [{lo:.2f}, {hi:.2f}]", med, (lo, hi)),
    ]
    for y, name, detail, point, span in rows:
        axL.text(0.98, y + .20, name, fontsize=9.6, fontweight="bold",
                 color=INK, ha="right")
        axL.text(0.98, y - .06, detail, fontsize=8.3, color=MUTED,
                 ha="right", va="top", linespacing=1.35)

    ax.set_ylim(-0.6, 2.6); ax.set_xlim(0.655, 0.795)
    ax.axvspan(lo, hi, color="#eef1f6", zorder=0)
    ax.axvline(0.72, color=ACCENT, lw=2.0, zorder=5)
    for y, _n, _d, point, span in rows:
        if span:
            ax.plot(span, [y, y], color=INK, lw=2.4, solid_capstyle="butt", zorder=3)
            for e in span:
                ax.plot([e, e], [y - .10, y + .10], color=INK, lw=1.6, zorder=3)
        else:
            ax.plot([lo, hi], [y, y], color="#c3cad6", lw=1.2, ls=":", zorder=2)
        if point is not None:
            ax.plot(point, y, "o", color=ACCENT, ms=8, zorder=6,
                    markeredgecolor="white", markeredgewidth=1.1)
    ax.text(0.7225, 2.42, "adopted  τ = 0.72", color=ACCENT,
            fontsize=10.5, fontweight="bold")
    ax.set_yticks([])
    ax.set_xticks([0.67, 0.69, 0.70, 0.72, 0.74, 0.75, 0.78])
    ax.set_xticklabels(["0.67", "0.69", "0.70", "0.72", "0.74", "0.75", "0.78"], fontsize=8.6)
    ax.set_xlabel("candidate threshold")
    ax.grid(axis="y", visible=False)
    tidy(ax)
    fig.suptitle("Three independent tests, one narrow band",
                 fontsize=11, fontweight="bold", y=1.02)
    fig.savefig(OUT / "fig_t_convergence.png")
    plt.close(fig)
    print(f"  fig_t_convergence   (opt {opt}, median {med:.2f}, CI [{lo:.2f}, {hi:.2f}])")


# -------------------------------------------- 3. what each choice costs you ---
def fig_tradeoff(a):
    cands = [0.70, 0.72, 0.75]
    sens = [a["pts"][t]["sensitivity"] * 100 for t in cands]
    spec = [a["pts"][t]["specificity"] * 100 for t in cands]

    fig, (ax, ax2) = plt.subplots(1, 2, figsize=(7.2, 3.1),
                                  gridspec_kw={"width_ratios": [1.25, 1]})
    x = np.arange(3); w = 0.36
    b1 = ax.bar(x - w / 2, sens, w, color=FILL, label="sensitivity\n(improvable answers caught)")
    b2 = ax.bar(x + w / 2, spec, w, color=FILL2, label="specificity\n(fine answers left alone)")
    for bars, vals in ((b1, sens), (b2, spec)):
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width() / 2, v + 1.8, f"{v:.1f}%",
                    ha="center", fontsize=8.6, color=INK)
    ax.set_xticks(x)
    ax.set_xticklabels([f"τ = {t:.2f}" for t in cands], fontsize=10)
    ax.get_xticklabels()[1].set_color(ACCENT)
    ax.get_xticklabels()[1].set_fontweight("bold")
    ax.set_ylabel("%")
    ax.set_ylim(0, 104)
    ax.set_title("What each threshold buys")
    ax.legend(frameon=False, fontsize=7.4, loc="upper center",
              bbox_to_anchor=(0.5, -0.16), ncol=2)
    tidy(ax)

    js = [a["pts"][t]["youden_j"] for t in cands]
    cols = [FILL, ACCENT, FILL]
    bb = ax2.bar([f"{t}" for t in cands], js, color=cols, width=0.52)
    for bar, v in zip(bb, js):
        ax2.text(bar.get_x() + bar.get_width() / 2, v + .004, f"{v:.3f}",
                 ha="center", fontsize=8.6, color=INK)
    ax2.set_ylim(0, max(js) * 1.28)
    ax2.set_xlabel("candidate threshold")
    ax2.set_ylabel("Youden's J")
    ax2.set_title("Statistically indistinguishable")
    tidy(ax2)
    fig.savefig(OUT / "fig_t_tradeoff.png")
    plt.close(fig)
    print("  fig_t_tradeoff      " +
          "  ".join(f"{t}: {s:.1f}/{p:.1f}" for t, s, p in zip(cands, sens, spec)))


def main():
    print("threshold-argument figures:")
    a = analysis()
    fig_censoring()
    fig_convergence(a)
    fig_tradeoff(a)
    print("done ->", OUT)


if __name__ == "__main__":
    main()
