"""
Fill the institutional "V Ideas" PPTX template with this project's content.

The template is the department's required one-slide summary format, so the slide
is EDITED IN PLACE rather than rebuilt: background, freeforms, fonts, colours and
field order all stay exactly as supplied. Only the content changes.

Two things need care:

1. TEXT. Each field is a text box whose paragraphs mix a bold label run with
   normal body runs. Replacing `.text` wholesale would collapse the run styling,
   so every paragraph is rebuilt from (text, bold) segments using an rPr cloned
   from a real run of matching weight in that same box - font, size and colour
   are therefore inherited from the template rather than guessed.

2. PICTURES. The template carries six portrait phone screenshots (aspect ~0.50)
   in a row. This project's evidence is two landscape UI captures (aspect 1.28)
   and one portrait architecture diagram (aspect 0.77). Forcing those into
   portrait slots would visibly squash them, so three slots are kept and
   re-sized to each image's true aspect. The row's vertical band (y and height)
   is left untouched, so no NEW overlap with the Applications box below can be
   introduced - only widths and x positions move, and the row stays centred
   inside the original span.

lxml is used throughout: round-tripping OOXML through ElementTree rewrites
namespace prefixes and corrupts the package.
"""

from __future__ import annotations

import shutil
from copy import deepcopy
from pathlib import Path

from lxml import etree

HERE = Path(__file__).parent
UNPACKED = HERE / "unpacked"
SLIDE = UNPACKED / "ppt" / "slides" / "slide1.xml"
RELS = UNPACKED / "ppt" / "slides" / "_rels" / "slide1.xml.rels"
MEDIA = UNPACKED / "ppt" / "media"
SHOTS = HERE.parent / "screenshots"

P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
EMU = 914400


def q(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


# ---------------------------------------------------------------- content ---
BRIEF = (
    "The system answers a question with two different local LLMs (LLaMA 3 and Mistral) "
    "and then validates the result instead of trusting it. An independent Verifier "
    "(phi3) and Judge (qwen3.5:9b) score both answers blind on an eight-factor, "
    "80-point rubric, and semantic similarity, cross-model agreement and external "
    "Wikipedia/Wikidata checks are blended into a single 0-1 confidence score. Any "
    "answer below a data-calibrated threshold of 0.72 is regenerated automatically, "
    "and a sixth agent (Gemma 2 9B) merges the best attempt. No model both writes an "
    "answer and evaluates or merges it. Everything runs offline on local hardware with "
    "no paid APIs, validated on a self-generated 5,000-question dataset."
)

TITLE = ("Agentic Multi-LLM Validation System: Label-Free Quality Assurance for "
         "Locally Hosted Large Language Models")
DOMAIN = ("Artificial Intelligence, Natural Language Processing, Multi-Agent Systems, "
          "Applied Machine Learning")

TB6 = {
    0: [("Project Title :", True), (" " + TITLE, False)],
    1: [("Domain (Area of Project) : ", True), (DOMAIN, False)],
}
TB7 = {
    0: [("Brief idea of Project ", True), (": " + BRIEF, False)],
}
TB8 = {
    2: [("Applications :", True)],
    3: [("Offline, privacy-preserving question answering for institutions that cannot "
         "send data to third-party APIs.", False)],
    4: [("Automated quality assurance and regression testing for LLM deployments - "
         "every answer ships with a calibrated confidence score.", False)],
    5: [("A label-free benchmark harness for comparing local models without any "
         "human-annotated ground truth.", False)],
    7: [("Awards/Participation if Any for TPP / Competitions / Paper Publication / "
         "Any Other Pls. Specify: --", True)],
    8: [("Scholarly paper prepared in IEEE format: “Label-Free Validation of an "
         "Agentic Multi-LLM Question-Answering System”.", False)],
    9: [("[TO BE FILLED: competitions / Tantravihar / Avishkar participation, if any]", False)],
    10: [("", False)],
}
TB14 = {
    0: [("Name of Project Guide :", True),
        (" [GUIDE NAME] ([guide.email]@vit.edu.in)", False)],
    2: [("Name of Students :", True), (" ", True),
        ("[STUDENT 1] ([email]@vit.edu.in)", False)],
    3: [(" " * 40 + "[STUDENT 2] ([email]@vit.edu.in)", False)],
    4: [(" " * 40 + "[STUDENT 3] ([email]@vit.edu.in)", False)],
    5: [(" " * 40 + "[STUDENT 4] ([email]@vit.edu.in)", False)],
}

# slot -> (source image, published media name, width in inches)
# heights all stay at the template's 0.82in; widths follow each image's own aspect
PICTURES = [
    ("Picture 9",  SHOTS / "shot1_app.jpg",      "image3.jpeg", 1.05),
    ("Picture 10", SHOTS / "shot2_viewer.jpg",   "image4.jpeg", 1.05),
    ("Picture 11", SHOTS / "shot3_pipeline.jpg", "image5.jpeg", 0.632),
]
DROP_PICTURES = ["Picture 12", "Picture 13", "Picture 14"]
DROP_MEDIA = ["image6.jpeg", "image7.jpeg", "image8.jpeg"]


# ------------------------------------------------------------------ edits ---
def shape_by_name(root, name: str):
    for sp in root.iter(q(P, "sp"), q(P, "pic")):
        nv = sp.find(f".//{q(P, 'cNvPr')}")
        if nv is not None and nv.get("name") == name:
            return sp
    return None


def rpr_templates(sp):
    """A bold and a non-bold rPr taken from real runs in this very box, so the
    rebuilt runs inherit the template's font, size and colour."""
    bold = plain = None
    for run in sp.iter(q(A, "r")):
        rPr = run.find(q(A, "rPr"))
        if rPr is None:
            continue
        if rPr.get("b") == "1" and bold is None:
            bold = rPr
        if rPr.get("b") != "1" and plain is None:
            plain = rPr
    return bold, plain


def set_paragraph(p, segments, bold_t, plain_t):
    for run in p.findall(q(A, "r")):
        p.remove(run)
    anchor = p.find(q(A, "pPr"))
    idx = list(p).index(anchor) + 1 if anchor is not None else 0
    for text, bold in segments:
        run = etree.SubElement(p, q(A, "r"))
        tmpl = (bold_t if bold else plain_t) or plain_t or bold_t
        if tmpl is not None:
            rPr = deepcopy(tmpl)
            rPr.set("b", "1") if bold else rPr.attrib.pop("b", None)
            run.append(rPr)
        t = etree.SubElement(run, q(A, "t"))
        t.text = text
        if text != text.strip():
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        p.remove(run)
        p.insert(idx, run)
        idx += 1


def fill_textbox(root, name, spec):
    sp = shape_by_name(root, name)
    assert sp is not None, f"missing {name}"
    bold_t, plain_t = rpr_templates(sp)
    paras = list(sp.iter(q(A, "p")))
    for i, segments in spec.items():
        assert i < len(paras), f"{name}: paragraph {i} out of range ({len(paras)})"
        set_paragraph(paras[i], segments, bold_t, plain_t)
    print(f"  filled {name}: {len(spec)} paragraphs")


def main() -> None:
    tree = etree.parse(str(SLIDE))
    root = tree.getroot()

    print("TEXT")
    for name, spec in (("TextBox 6", TB6), ("TextBox 7", TB7),
                       ("TextBox 8", TB8), ("TextBox 14", TB14)):
        fill_textbox(root, name, spec)

    print("PICTURES")
    for name in DROP_PICTURES:
        pic = shape_by_name(root, name)
        if pic is not None:
            pic.getparent().remove(pic)
            print(f"  removed {name}")

    from PIL import Image
    gap = 0.12
    widths = [w for *_, w in PICTURES]
    total = sum(widths) + gap * (len(widths) - 1)
    x = 1.04 + (3.23 - total) / 2          # re-centre inside the original span
    y, h = 3.655, 0.82                     # UNCHANGED vertical band

    for (name, src, media_name, w) in PICTURES:
        pic = shape_by_name(root, name)
        assert pic is not None, f"missing {name}"
        shutil.copyfile(src, MEDIA / media_name)
        im = Image.open(src)
        xfrm = pic.find(f".//{q(P, 'spPr')}/{q(A, 'xfrm')}")
        off, ext = xfrm.find(q(A, "off")), xfrm.find(q(A, "ext"))
        off.set("x", str(int(x * EMU)))
        off.set("y", str(int(y * EMU)))
        ext.set("cx", str(int(w * EMU)))
        ext.set("cy", str(int(h * EMU)))
        # drop any crop the template applied to the old screenshot
        for blipFill in pic.iter(q(A, "blipFill")):
            for sr in blipFill.findall(q(A, "srcRect")):
                blipFill.remove(sr)
        print(f"  {name:<11} <- {src.name:<20} {w:.3f}x{h} in  "
              f"(img {im.size[0]}x{im.size[1]}, aspect {im.size[0]/im.size[1]:.2f})")
        x += w + gap

    tree.write(str(SLIDE), xml_declaration=True, encoding="UTF-8", standalone=True)

    # prune the now-unreferenced media and their relationship entries
    rels = etree.parse(str(RELS))
    rroot = rels.getroot()
    for rel in list(rroot):
        tgt = rel.get("Target", "")
        if any(m in tgt for m in DROP_MEDIA):
            rroot.remove(rel)
            print(f"  dropped rel -> {tgt}")
    rels.write(str(RELS), xml_declaration=True, encoding="UTF-8", standalone=True)
    for m in DROP_MEDIA:
        f = MEDIA / m
        if f.exists():
            f.unlink()
            print(f"  deleted media/{m}")


if __name__ == "__main__":
    main()
