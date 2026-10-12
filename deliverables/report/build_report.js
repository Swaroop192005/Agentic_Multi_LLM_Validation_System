/**
 * deliverables/report/build_report.js
 * -----------------------------------
 * Builds the B.E. project report to the department's mandated format:
 *
 *   Times New Roman 12 throughout, 1.5 line spacing for body text and single
 *   spacing for captions; title page unnumbered; preliminary pages in lower
 *   roman numerals; the main body restarting at arabic 1; Specimens A-D
 *   reproduced as supplied; appendices at 10 pt.
 *
 * Structure follows the template exactly: Title, Certificate of Approval,
 * Approval Sheet, Declaration, Acknowledgements, Abstract, Table of Contents,
 * List of Figures, List of Tables, List of Symbols and Abbreviations, the
 * chapters, Conclusion and Recommendations, Future Scope, References,
 * Appendices.
 *
 * Run:  node deliverables/report/build_report.js
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Footer, PageNumber, NumberFormat, TableOfContents, LevelFormat, convertInchesToTwip,
  ImageRun,
} = require("docx");

const C = require("./content.js");

const FONT = "Times New Roman";
const SZ = 24;          // half-points -> 12 pt
const SZ_SMALL = 20;    // 10 pt, for appendices and captions
const LINE_15 = 360;    // 1.5 line spacing, in twentieths of a point
const CONTENT_DXA = 9020;   // A4 width less 1" margins each side

/* ------------------------------------------------------------- helpers --- */
const run = (text, o = {}) => new TextRun({
  text, font: FONT, size: o.size || SZ, bold: !!o.bold, italics: !!o.italics,
  allCaps: !!o.caps,
});

const body = (text, o = {}) => new Paragraph({
  children: [run(text, o)],
  alignment: o.align || AlignmentType.JUSTIFIED,
  spacing: { line: o.single ? 240 : LINE_15, after: o.after === undefined ? 120 : o.after },
  indent: o.indent,
});

const centred = (text, o = {}) => new Paragraph({
  children: [run(text, o)],
  alignment: AlignmentType.CENTER,
  spacing: { line: 240, after: o.after === undefined ? 120 : o.after },
});

const blank = (n = 1) => Array.from({ length: n }, () =>
  new Paragraph({ children: [run("")], spacing: { after: 0 } }));

const caption = (text) => new Paragraph({
  children: [run(text, { size: SZ_SMALL, italics: true })],
  alignment: AlignmentType.CENTER,
  spacing: { line: 240, before: 60, after: 240 },   // single spacing, per the format
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [run(text, { bold: true, size: 32 })],
  spacing: { before: 240, after: 240 },
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [run(text, { bold: true, size: 26 })],
  spacing: { before: 240, after: 120 },
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function bullets(items, size = SZ) {
  return items.map((t) => new Paragraph({
    children: [run(t, { size })],
    numbering: { reference: "bullets", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_15, after: 80 },
  }));
}

function makeTable(spec) {
  const cols = spec.head.length;
  // Dual widths: the table declares columnWidths AND every cell declares width,
  // both in DXA - percentage widths break in some renderers.
  const colW = Array.from({ length: cols }, (_, i) =>
    i === 0 ? Math.round(CONTENT_DXA * (cols <= 3 ? 0.34 : 0.22))
            : Math.round((CONTENT_DXA - Math.round(CONTENT_DXA * (cols <= 3 ? 0.34 : 0.22))) / (cols - 1)));
  const cell = (text, { bold = false, w }) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: bold ? { type: ShadingType.CLEAR, fill: "E8ECF2" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({
      children: [run(text, { bold, size: SZ_SMALL })],
      spacing: { line: 240, after: 0 },
    })],
  });
  const rows = [
    new TableRow({
      tableHeader: true,
      children: spec.head.map((t, i) => cell(t, { bold: true, w: colW[i] })),
    }),
    ...spec.rows.map((r) => new TableRow({
      children: r.map((t, i) => cell(String(t), { w: colW[i] })),
    })),
  ];
  return [
    new Table({
      columnWidths: colW,
      width: { size: CONTENT_DXA, type: WidthType.DXA },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        left:   { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        right:  { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "AAB3C0" },
        insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: "AAB3C0" },
      },
      rows,
    }),
    caption(spec.caption),
  ];
}

const dotted = (n = 28) => "_".repeat(n);

/* --------------------------------------------------- front matter pages --- */
function titlePage() {
  return [
    ...blank(2),
    centred(C.TITLE, { bold: true, size: 30, caps: true }),
    ...blank(2),
    centred("Submitted in partial fulfillment of the requirements"),
    centred("of the degree of"),
    centred("Bachelor of Technology in Computer Engineering", { bold: true }),
    ...blank(1),
    centred("By"),
    ...C.PLACEHOLDER.students.map((s) => centred(`${s.name} (Roll No. ${s.roll})`)),
    ...blank(1),
    centred("Under the Guidance of"),
    centred(C.PLACEHOLDER.guide, { bold: true }),
    ...(C.PLACEHOLDER.guideDesignation ? [centred(C.PLACEHOLDER.guideDesignation)] : []),
    ...blank(2),
    centred("Department of Computer Engineering", { bold: true }),
    centred("(An Autonomous Institute Affiliated to University of Mumbai)"),
    centred("Vidyalankar Institute of Technology", { bold: true }),
    centred("Wadala (E), Mumbai-400437"),
    ...blank(1),
    centred("University of Mumbai"),
    centred("2026-27", { bold: true }),
  ];
}

function certificatePage() {
  return [
    ...blank(1),
    centred("CERTIFICATE OF APPROVAL", { bold: true, size: 28 }),
    ...blank(1),
    centred("This is to certify that the project entitled"),
    centred(`“${C.TITLE_SENTENCE}”`, { bold: true }),
    centred("is a bonafide work of"),
    ...blank(1),
    ...C.PLACEHOLDER.students.map((s) => centred(`${s.name} (Roll No. ${s.roll})`)),
    ...blank(1),
    body("submitted to the University of Mumbai in partial fulfillment of the requirement for the award of the degree of Undergraduate in “Computer Engineering”.", { align: AlignmentType.CENTER }),
    ...blank(3),
    centred(dotted(34)),
    centred("Guide", { bold: true }),
    centred(`(${C.PLACEHOLDER.guide})`),
    ...blank(2),
    centred(dotted(34)),
    centred("Head of Department", { bold: true }),
    centred(`(${C.PLACEHOLDER.hod})`),
    ...blank(2),
    centred(dotted(34)),
    centred("Principal", { bold: true }),
    centred(`(${C.PLACEHOLDER.principal})`),
  ];
}

function approvalPage() {
  return [
    ...blank(1),
    centred("Project Report Approval for", { bold: true, size: 28 }),
    centred("B.Tech in Computer Engineering", { bold: true, size: 28 }),
    ...blank(1),
    body(`This project report entitled “${C.TITLE_SENTENCE}” by`, { align: AlignmentType.CENTER }),
    ...C.PLACEHOLDER.students.map((s) => centred(`${s.name} (${s.roll})`)),
    centred("is approved for the degree of Bachelor of Technology in Computer Engineering."),
    ...blank(3),
    centred("Examiners", { bold: true }),
    ...blank(1),
    centred(`1. ${dotted(40)}`),
    ...blank(1),
    centred(`2. ${dotted(40)}`),
    ...blank(3),
    body("Date:  ______________________"),
    body("Place: ______________________"),
  ];
}

function declarationPage() {
  const colW = [900, 3400, 1900, 2820];
  const cell = (t, bold) => new TableCell({
    width: { size: colW[0], type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 90, right: 90 },
    children: [new Paragraph({ children: [run(t, { bold })], spacing: { line: 240, after: 0 } })],
  });
  const rowOf = (vals, bold = false) => new TableRow({
    children: vals.map((t, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      shading: bold ? { type: ShadingType.CLEAR, fill: "E8ECF2" } : undefined,
      margins: { top: 80, bottom: 80, left: 90, right: 90 },
      children: [new Paragraph({ children: [run(t, { bold })], spacing: { line: 240, after: 0 } })],
    })),
  });
  return [
    ...blank(1),
    centred("Declaration", { bold: true, size: 28 }),
    ...blank(1),
    body("I declare that this written submission represents my ideas in my own words and where others' ideas or words have been included, I have adequately cited and referenced the original sources. I also declare that I have adhered to all principles of academic honesty and integrity and have not misrepresented or fabricated or falsified any idea/data/fact/source in my submission. I understand that any violation of the above will be cause for disciplinary action by the Institute and can also evoke penal action from the sources which have thus not been properly cited or from whom proper permission has not been taken when needed."),
    ...blank(1),
    new Table({
      columnWidths: colW,
      width: { size: CONTENT_DXA, type: WidthType.DXA },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        left:   { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        right:  { style: BorderStyle.SINGLE, size: 4, color: "7A8699" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "AAB3C0" },
        insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: "AAB3C0" },
      },
      rows: [
        rowOf(["Sr. No.", "Name of Student", "Roll No.", "Signature"], true),
        ...C.PLACEHOLDER.students.map((s, i) => rowOf([`${i + 1}.`, s.name, s.roll, ""])),
      ],
    }),
    ...blank(2),
    body("Date:  ______________________"),
  ];
}

function listLines(title, lines) {
  return [
    h1(title),
    ...lines.map((t) => new Paragraph({
      children: [run(t)],
      spacing: { line: 240, after: 80 },
    })),
  ];
}

/* Embed a figure at its true aspect ratio, scaled to the requested width.
 * ImageRun requires an explicit `type`. */
function figureBlock(fig) {
  const file = path.join(__dirname, fig.file);
  if (!fs.existsSync(file)) {
    console.warn(`  ! figure missing, skipped: ${fig.file}`);
    return [];
  }
  const dim = pngSize(fs.readFileSync(file));
  const w = fig.widthIn * 96;
  const h = Math.round(w * dim.h / dim.w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60 },
      children: [new ImageRun({
        type: "png",
        data: fs.readFileSync(file),
        transformation: { width: Math.round(w), height: h },
      })],
    }),
    caption(`Figure ${fig.n}: ${fig.caption}`),
  ];
}

/** Read width/height straight out of the PNG IHDR chunk. */
function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function abbreviationsPage() {
  return [
    h1("List of Symbols and Abbreviations"),
    ...makeTable({
      caption: "",
      head: ["Symbol / Abbreviation", "Expansion"],
      rows: C.ABBREVIATIONS,
    }).slice(0, 1),
  ];
}

/* ------------------------------------------------------------- chapters --- */
function chapterBlocks() {
  const out = [];
  C.CHAPTERS.forEach((ch, ci) => {
    if (ci > 0) out.push(pageBreak());
    out.push(h1(`Chapter ${ci + 1}    ${ch.title}`));
    ch.sections.forEach((sec, si) => {
      out.push(h2(`${ci + 1}.${si + 1}    ${sec.heading}`));
      (sec.paras || []).forEach((p) => out.push(body(p)));
      if (sec.bullets) out.push(...bullets(sec.bullets));
      if (sec.table) out.push(...makeTable(sec.table));
      (sec.paras2 || []).forEach((p) => out.push(body(p)));
      // place any figure anchored to this chapter and section
      C.FIGURES.filter((f) => f.chapter === ci + 1 && f.after === sec.heading)
        .forEach((f) => out.push(...figureBlock(f)));
    });
  });
  return out;
}

function backMatter() {
  const out = [pageBreak(), h1("References")];
  C.REFERENCES.forEach((r, i) => out.push(new Paragraph({
    children: [run(`[${i + 1}]    ${r}`)],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 240, after: 100 },
  })));
  out.push(pageBreak(), h1("Appendices"));
  C.APPENDICES.forEach((a) => {
    out.push(h2(a.title));
    // the format requires appendices at 10 pt
    a.paras.forEach((p) => out.push(body(p, { size: SZ_SMALL })));
  });
  return out;
}

/* ------------------------------------------------------------------ doc --- */
const numbering = {
  config: [{
    reference: "bullets",
    levels: [{
      level: 0, format: LevelFormat.BULLET, text: "•",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(0.35), hanging: convertInchesToTwip(0.2) } } },
    }],
  }],
};

const pageSetup = {
  margin: {
    top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
    left: convertInchesToTwip(1.25), right: convertInchesToTwip(1),
  },
};

const footer = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ_SMALL })],
  })],
});

const doc = new Document({
  creator: "Department of Computer Engineering, Vidyalankar Institute of Technology",
  title: C.TITLE_SENTENCE,
  description: "B.E. Project Report, Semester VIII, 2026-27",
  numbering,
  styles: {
    default: {
      document: { run: { font: FONT, size: SZ } },
      heading1: { run: { font: FONT, size: 32, bold: true, color: "000000" } },
      heading2: { run: { font: FONT, size: 26, bold: true, color: "000000" } },
    },
  },
  sections: [
    // 1 - title page: no page number at all, per the format
    { properties: { page: pageSetup }, children: titlePage() },

    // 2 - preliminary pages: lower roman, continuing from the unnumbered title page
    {
      properties: {
        page: { ...pageSetup, pageNumbers: { start: 2, formatType: NumberFormat.LOWER_ROMAN } },
      },
      footers: { default: footer() },
      children: [
        ...certificatePage(), pageBreak(),
        ...approvalPage(), pageBreak(),
        ...declarationPage(), pageBreak(),
        h1("Acknowledgements"),
        ...C.ACKNOWLEDGEMENT.map((p) => body(p)),
        pageBreak(),
        h1("Abstract"),
        ...C.ABSTRACT.map((p) => body(p)),
        pageBreak(),
        h1("Table of Contents"),
        new TableOfContents("Right-click and choose “Update Field” to populate this table.", {
          hyperlink: true, headingStyleRange: "1-2",
        }),
        pageBreak(),
        ...listLines("List of Figures", C.FIGURES.map((f) => `Figure ${f.n}    ${f.caption}`)),
        pageBreak(),
        ...listLines("List of Tables", C.TABLES.map(([n, t]) => `Table ${n}    ${t}`)),
        pageBreak(),
        ...abbreviationsPage(),
      ],
    },

    // 3 - main body: arabic, restarting at 1
    {
      properties: {
        page: { ...pageSetup, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      footers: { default: footer() },
      children: [...chapterBlocks(), ...backMatter()],
    },
  ],
});

const OUT = path.join(__dirname, "..", "BE_Project_Report_Agentic_Multi_LLM.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`wrote ${path.resolve(OUT)}  (${kb} KB)`);
  console.log(`chapters: ${C.CHAPTERS.length}  references: ${C.REFERENCES.length}  appendices: ${C.APPENDICES.length}`);
});
