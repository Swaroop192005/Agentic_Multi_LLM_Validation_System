"""
pdf_build/make_pdfs.py
======================
Builds 4 PDFs from the project deliverables via headless Chrome/Edge:
  1. project-report.pdf   (from docs/project-report.html)
  2. defense-prep.pdf     (from docs/defense-prep.html)
  3. presentation.pdf     (from docs/presentation.html, landscape, all slides)
  4. research-log.pdf     (from RESEARCH_LOG.md -> styled HTML)

For each HTML deliverable it writes a *_print.html copy with a print
stylesheet appended (forces color printing, unstickies/hides nav & controls,
and for the deck expands every slide onto its own landscape page), then
renders it with `--headless --print-to-pdf`.

Run:  python pdf_build/make_pdfs.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DOCS = ROOT / "docs"
BUILD = Path(__file__).parent
OUT = DOCS  # final PDFs land in docs/ alongside the HTML

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def chrome() -> str:
    for c in CHROME_CANDIDATES:
        if Path(c).exists():
            return c
    sys.exit("No Chrome/Edge found for PDF rendering.")


# Print CSS shared by the two document pages (report, defense prep).
DOC_PRINT_CSS = """
<style>
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { margin: 14mm 0; }
  nav.top { position: static !important; backdrop-filter: none !important; }
  html { scroll-behavior: auto; }
  section { break-inside: avoid; }
  .phase, .qcard, .card, .tile, .abstract, table, .diagram-card { break-inside: avoid; }
  header.hero { break-after: avoid; }
  h2, h3 { break-after: avoid; }
}
</style>
"""

# Print CSS for the conference poster. FYP_POSTER.html is a fixed 1060px-wide
# layout with no print rules of its own, so the @page must be sized to the
# artwork or the PDF either clips it or leaves a dead band at the foot.
#
# The height is MEASURED rather than hardcoded. A constant here goes stale the
# moment the poster's content changes length - which it did: the rewrite took it
# from 1732px to 1515px, and a stale 1738px page would have printed 223px of
# blank paper. poster_height() renders the page tall, finds the last row that
# differs from the page background, and sizes @page to that.
POSTER_CSS_TEMPLATE = """
<style>
@media print {{
  * {{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}
  @page {{ size: {w}px {h}px; margin: 0; }}
  html, body {{ margin: 0 !important; padding: 0 !important; background: #fff; }}
  .poster, body > div {{ box-shadow: none !important; }}
}}
</style>
"""

POSTER_WIDTH = 1060


def poster_height(src: Path, probe_height: int = 16000) -> int:
    """Render the poster tall and measure where its content actually ends."""
    probe = BUILD / "_poster_probe.png"
    subprocess.run(
        [chrome(), "--headless", "--disable-gpu", "--hide-scrollbars",
         "--virtual-time-budget=8000",
         f"--window-size={POSTER_WIDTH},{probe_height}",
         f"--screenshot={probe.as_posix()}", src.resolve().as_uri()],
        capture_output=True, text=True, timeout=180,
    )
    try:
        from PIL import Image
        import numpy as np
        im = Image.open(probe).convert("RGB")
        a = np.asarray(im)
        diff = (np.abs(a.astype(int) - a[-1].astype(int)).sum(axis=2) > 12).any(axis=1)
        rows = np.nonzero(diff)[0]
        h = int(rows.max()) + 1 if len(rows) else probe_height
    except Exception as e:                       # measurement is best-effort
        print(f"  ! could not measure poster ({e}); falling back to 1740px")
        h = 1740
    finally:
        probe.unlink(missing_ok=True)
    return h

# Print CSS for the slide deck: one landscape page per slide, chrome hidden.
DECK_PRINT_CSS = """
<style>
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: 297mm 167mm; margin: 0; }   /* 16:9-ish landscape */
  html, body { height: auto !important; overflow: visible !important; }
  .deck { height: auto !important; }
  .slide {
    display: flex !important; position: relative !important; inset: auto !important;
    height: 167mm !important; width: 297mm !important;
    break-after: page; animation: none !important;
    justify-content: center;
  }
  .slide:last-child { break-after: auto; }
  .hud, .ctrl, .pbar, .hint { display: none !important; }
}
</style>
"""


def make_print_html(src: Path, extra_css: str, dst: Path) -> None:
    html = src.read_text(encoding="utf-8")
    # Append print CSS just before </body> if present, else at end.
    if "</body>" in html:
        html = html.replace("</body>", extra_css + "\n</body>")
    else:
        html = html + extra_css
    dst.write_text(html, encoding="utf-8")


def render_pdf(html_path: Path, pdf_path: Path, landscape: bool = False) -> None:
    url = html_path.resolve().as_uri()
    args = [
        chrome(), "--headless", "--disable-gpu", "--no-pdf-header-footer",
        "--no-margins", f"--print-to-pdf={pdf_path}", url,
    ]
    if landscape:
        args.insert(-1, "--landscape")
    # give the page a moment to pull fonts
    args.insert(-1, "--virtual-time-budget=8000")
    print(f"  rendering {pdf_path.name} ...", flush=True)
    r = subprocess.run(args, capture_output=True, text=True, timeout=120)
    if not pdf_path.exists():
        print(r.stdout); print(r.stderr)
        sys.exit(f"Failed to render {pdf_path.name}")


def md_to_html(md_path: Path) -> str:
    import markdown
    body = markdown.markdown(
        md_path.read_text(encoding="utf-8"),
        extensions=["tables", "fenced_code", "toc", "sane_lists"],
    )
    return f"""<!doctype html><html><head><meta charset="utf-8">
<title>Research Log</title>
<style>
  * {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  @page {{ margin: 16mm 15mm; }}
  body {{ font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1f26; line-height: 1.55; font-size: 11.5pt; max-width: 800px; margin: 0 auto; }}
  h1 {{ font-size: 24pt; border-bottom: 3px solid #33507D; padding-bottom: 8px; color: #223B60; }}
  h2 {{ font-size: 15pt; color: #223B60; margin-top: 26px; border-bottom: 1px solid #d0d5da; padding-bottom: 4px; break-after: avoid; }}
  h3 {{ font-size: 12.5pt; color: #33507D; break-after: avoid; }}
  code {{ font-family: 'Consolas', monospace; background: #eef0f2; padding: 1px 4px; border-radius: 3px; font-size: 10pt; }}
  pre {{ background: #eef0f2; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 9.5pt; break-inside: avoid; }}
  pre code {{ background: none; padding: 0; }}
  table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; break-inside: avoid; }}
  th, td {{ border: 1px solid #ccd1d6; padding: 6px 10px; text-align: left; }}
  th {{ background: #E4E9F1; color: #223B60; }}
  blockquote {{ border-left: 3px solid #B9812A; background: #F5EAD6; margin: 12px 0; padding: 8px 14px; }}
  p, li {{ break-inside: avoid; }}
  h2, h3, p, table, pre, ul, ol {{ break-inside: avoid-page; }}
</style></head><body>
{body}
</body></html>"""


def main():
    BUILD.mkdir(exist_ok=True)

    # 1 & 2: document pages
    for name in ("project-report", "defense-prep", "viva-script"):
        src = DOCS / f"{name}.html"
        pr = BUILD / f"{name}_print.html"
        make_print_html(src, DOC_PRINT_CSS, pr)
        render_pdf(pr, OUT / f"{name}.pdf", landscape=False)

    # 3: slide deck (landscape)
    deck_src = DOCS / "presentation.html"
    deck_pr = BUILD / "presentation_print.html"
    make_print_html(deck_src, DECK_PRINT_CSS, deck_pr)
    render_pdf(deck_pr, OUT / "presentation.pdf", landscape=True)

    # 3b: research paper (renders as-is; it carries its own two-column @media print CSS,
    # so no generic DOC_PRINT_CSS injection — that would override its @page margins)
    paper = DOCS / "research-paper.html"
    if paper.exists():
        render_pdf(paper, OUT / "research-paper.pdf", landscape=False)

    # 3c: conference poster (lives at the repo root, not in docs/)
    poster = ROOT / "FYP_POSTER.html"
    if poster.exists():
        h = poster_height(poster)
        print(f"  poster content measures {POSTER_WIDTH} x {h} px "
              f"(aspect 1:{h / POSTER_WIDTH:.3f})")
        css = POSTER_CSS_TEMPLATE.format(w=POSTER_WIDTH + 4, h=h + 6)  # a little slack
        poster_pr = BUILD / "FYP_POSTER_print.html"
        make_print_html(poster, css, poster_pr)
        render_pdf(poster_pr, OUT / "fyp-poster.pdf", landscape=False)

    # 4: research log (markdown -> html -> pdf)
    md = ROOT / "RESEARCH_LOG.md"
    log_html = BUILD / "research-log_print.html"
    log_html.write_text(md_to_html(md), encoding="utf-8")
    render_pdf(log_html, OUT / "research-log.pdf", landscape=False)

    print("\nDone. PDFs written to docs/:")
    for f in ("project-report.pdf", "defense-prep.pdf", "viva-script.pdf",
              "presentation.pdf", "research-paper.pdf", "fyp-poster.pdf", "research-log.pdf"):
        p = OUT / f
        size = p.stat().st_size // 1024 if p.exists() else 0
        print(f"  {f}  ({size} KB)")


if __name__ == "__main__":
    main()
