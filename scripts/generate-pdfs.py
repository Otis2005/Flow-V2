"""
Generate professional PDFs from TenderFlow markdown documents.

Renders:
  - docs/BRAND.md            -> docs/pdf/TenderFlow_Brand_Book.pdf
  - docs/SETUP-TRADEMARK.md  -> docs/pdf/TenderFlow_Trademark_Filing_Pack.pdf

Layout:
  - Cover page: doc title, "(C) 2026 TenderFlow", tenderflow.co.ke
  - Running header: "TenderFlow  |  <doc title>"
  - Running footer: page number, centered
  - Headings in navy #0A2240 serif (Times-Roman, our Spectral fallback)
  - Body in sans (Helvetica, our Public Sans fallback)
  - Gold (#B98A3B) hairline rules between major sections

Run:  python scripts/generate-pdfs.py
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

# Brand palette (must match docs/BRAND.md and src/styles/styles.css)
NAVY = colors.HexColor("#0A2240")
CREAM = colors.HexColor("#F7F1E5")
GOLD = colors.HexColor("#B98A3B")
INK = colors.HexColor("#0F1A2E")
MUTED = colors.HexColor("#5C6B82")
RULE = colors.HexColor("#DDD3BC")
CREAM_DEEP = colors.HexColor("#F0E7D2")

REPO = Path(__file__).resolve().parents[1]
OUT_DIR = REPO / "docs" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------------------------------- #
# Styles                                                                      #
# --------------------------------------------------------------------------- #


def build_styles() -> dict:
    """ParagraphStyle definitions for the whole document."""
    base = getSampleStyleSheet()
    s: dict[str, ParagraphStyle] = {}

    s["Title"] = ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName="Times-Italic",
        fontSize=36,
        leading=42,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    s["Subtitle"] = ParagraphStyle(
        "Subtitle",
        parent=base["Normal"],
        fontName="Times-Roman",
        fontSize=14,
        leading=18,
        textColor=GOLD,
        alignment=TA_CENTER,
        spaceAfter=24,
    )
    s["CoverMeta"] = ParagraphStyle(
        "CoverMeta",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
    )

    s["H1"] = ParagraphStyle(
        "H1",
        parent=base["Heading1"],
        fontName="Times-Bold",
        fontSize=22,
        leading=28,
        textColor=NAVY,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True,
    )
    s["H2"] = ParagraphStyle(
        "H2",
        parent=base["Heading2"],
        fontName="Times-Bold",
        fontSize=16,
        leading=20,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )
    s["H3"] = ParagraphStyle(
        "H3",
        parent=base["Heading3"],
        fontName="Times-Bold",
        fontSize=13,
        leading=16,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )
    s["H4"] = ParagraphStyle(
        "H4",
        parent=base["Heading4"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=GOLD,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True,
    )

    s["Body"] = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=INK,
        spaceAfter=8,
        alignment=TA_LEFT,
    )
    s["Bullet"] = ParagraphStyle(
        "Bullet",
        parent=s["Body"],
        leftIndent=14,
        bulletIndent=2,
        spaceAfter=3,
    )
    s["Quote"] = ParagraphStyle(
        "Quote",
        parent=s["Body"],
        fontName="Times-Italic",
        fontSize=11.5,
        leading=16,
        textColor=NAVY,
        leftIndent=18,
        rightIndent=18,
        spaceBefore=6,
        spaceAfter=10,
        borderColor=GOLD,
        borderPadding=(8, 0, 8, 10),
    )
    s["Code"] = ParagraphStyle(
        "Code",
        parent=base["Code"],
        fontName="Courier",
        fontSize=9.5,
        leading=12,
        textColor=INK,
        leftIndent=10,
        rightIndent=10,
        spaceBefore=4,
        spaceAfter=10,
        backColor=CREAM,
        borderColor=RULE,
        borderWidth=0.5,
        borderPadding=6,
    )
    s["TableHead"] = ParagraphStyle(
        "TableHead",
        parent=s["Body"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.white,
        spaceAfter=0,
    )
    s["TableCell"] = ParagraphStyle(
        "TableCell",
        parent=s["Body"],
        fontSize=9.5,
        leading=12,
        spaceAfter=0,
    )
    return s


# --------------------------------------------------------------------------- #
# Inline markdown                                                             #
# --------------------------------------------------------------------------- #


def md_inline(text: str) -> str:
    """Convert inline markdown to reportlab mini-HTML.

    Order matters: code first (so * inside code is literal), then bold, italic,
    links. Escape XML reserved chars except inside code spans.
    """
    # Preserve code spans, swap them in last
    code_spans: list[str] = []

    def _stash_code(m: re.Match) -> str:
        idx = len(code_spans)
        code_spans.append(m.group(1))
        return f"\x00CODE{idx}\x00"

    text = re.sub(r"`([^`]+)`", _stash_code, text)

    # Escape XML special chars in the rest
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Links: [label](url) -> <link href="url"><font color="...">label</font></link>
    text = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda m: f'<link href="{m.group(2)}" color="#B98A3B">{m.group(1)}</link>',
        text,
    )

    # Bold **text**
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    # Italic *text*
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)

    # Restore code spans
    def _unstash(m: re.Match) -> str:
        idx = int(m.group(1))
        body = code_spans[idx].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return f'<font face="Courier" color="#0A2240">{body}</font>'

    text = re.sub(r"\x00CODE(\d+)\x00", _unstash, text)
    return text


# --------------------------------------------------------------------------- #
# Markdown parsing                                                            #
# --------------------------------------------------------------------------- #


HEADING_RE = re.compile(r"^(#{1,4})\s+(.*?)\s*$")
BULLET_RE = re.compile(r"^[\-\*]\s+(.*)$")
NUMBERED_RE = re.compile(r"^(\d+)\.\s+(.*)$")
QUOTE_RE = re.compile(r"^>\s?(.*)$")
HR_RE = re.compile(r"^\-{3,}\s*$")
TABLE_SEP_RE = re.compile(r"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$")


def parse_table(lines: list[str], i: int) -> tuple[list[list[str]], int]:
    """Parse a github-flavored markdown table starting at line i.

    Returns (rows, new_index). The first row is the header.
    """
    rows: list[list[str]] = []
    # Header line
    header_cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
    rows.append(header_cells)
    i += 2  # skip separator
    while i < len(lines) and "|" in lines[i] and lines[i].strip():
        cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
        rows.append(cells)
        i += 1
    return rows, i


def build_table(rows: list[list[str]], styles: dict) -> Table:
    """Convert parsed rows into a styled reportlab Table."""
    head_style = styles["TableHead"]
    cell_style = styles["TableCell"]

    data = []
    # Header
    data.append([Paragraph(md_inline(c), head_style) for c in rows[0]])
    # Body
    for r in rows[1:]:
        data.append([Paragraph(md_inline(c), cell_style) for c in r])

    ncols = len(rows[0])
    # Reasonable widths: spread evenly within the frame width (16.5cm usable)
    usable = 16.5 * cm
    col_widths = [usable / ncols] * ncols

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, GOLD),
                ("BOX", (0, 0), (-1, -1), 0.25, RULE),
                ("INNERGRID", (0, 1), (-1, -1), 0.25, RULE),
            ]
        )
    )
    return tbl


def gold_rule(width_cm: float = 16.5) -> Table:
    """Horizontal gold hairline rule used between major sections."""
    t = Table([[""]], colWidths=[width_cm * cm], rowHeights=[2])
    t.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, 0), 1.2, GOLD),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return t


def md_to_flowables(md_text: str, styles: dict) -> list:
    """Parse markdown text into a list of reportlab flowables."""
    lines = md_text.splitlines()
    out: list = []
    i = 0
    in_code = False
    code_buf: list[str] = []

    # Hold an active list so consecutive bullets/numbers merge into one
    pending_list: list[ListItem] | None = None
    pending_list_kind: str | None = None  # "bullet" or "number"

    def flush_list():
        nonlocal pending_list, pending_list_kind
        if pending_list:
            if pending_list_kind == "bullet":
                out.append(
                    ListFlowable(
                        pending_list,
                        bulletType="bullet",
                        start="circle",
                        leftIndent=18,
                        bulletColor=GOLD,
                        bulletFontSize=8,
                    )
                )
            else:
                out.append(
                    ListFlowable(
                        pending_list,
                        bulletType="1",
                        leftIndent=22,
                        bulletColor=NAVY,
                        bulletFontName="Helvetica-Bold",
                    )
                )
            out.append(Spacer(1, 4))
            pending_list = None
            pending_list_kind = None

    while i < len(lines):
        line = lines[i]

        # Fenced code block
        if line.strip().startswith("```"):
            if in_code:
                flush_list()
                out.append(Preformatted("\n".join(code_buf), styles["Code"]))
                code_buf = []
                in_code = False
            else:
                flush_list()
                in_code = True
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # Horizontal rule
        if HR_RE.match(line):
            flush_list()
            out.append(Spacer(1, 4))
            out.append(gold_rule())
            out.append(Spacer(1, 10))
            i += 1
            continue

        # Headings
        m = HEADING_RE.match(line)
        if m:
            flush_list()
            level = len(m.group(1))
            text = md_inline(m.group(2))
            style = styles[f"H{level}"]
            out.append(Paragraph(text, style))
            i += 1
            continue

        # Tables
        if "|" in line and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1]):
            flush_list()
            rows, i = parse_table(lines, i)
            out.append(Spacer(1, 4))
            out.append(build_table(rows, styles))
            out.append(Spacer(1, 10))
            continue

        # Block quote
        qm = QUOTE_RE.match(line)
        if qm:
            flush_list()
            # gather consecutive quote lines
            buf = [qm.group(1)]
            i += 1
            while i < len(lines) and QUOTE_RE.match(lines[i]):
                buf.append(QUOTE_RE.match(lines[i]).group(1))
                i += 1
            out.append(Paragraph(md_inline(" ".join(buf)), styles["Quote"]))
            continue

        # Bullet list
        bm = BULLET_RE.match(line)
        if bm:
            if pending_list_kind not in (None, "bullet"):
                flush_list()
            pending_list_kind = "bullet"
            pending_list = pending_list or []
            pending_list.append(ListItem(Paragraph(md_inline(bm.group(1)), styles["Bullet"]), leftIndent=18))
            i += 1
            continue

        # Numbered list
        nm = NUMBERED_RE.match(line)
        if nm:
            if pending_list_kind not in (None, "number"):
                flush_list()
            pending_list_kind = "number"
            pending_list = pending_list or []
            pending_list.append(ListItem(Paragraph(md_inline(nm.group(2)), styles["Bullet"]), leftIndent=22))
            i += 1
            continue

        # Blank line -> paragraph break / list terminator
        if not line.strip():
            flush_list()
            i += 1
            continue

        # Default: paragraph. Consume continuation lines.
        flush_list()
        buf = [line]
        i += 1
        while (
            i < len(lines)
            and lines[i].strip()
            and not HEADING_RE.match(lines[i])
            and not BULLET_RE.match(lines[i])
            and not NUMBERED_RE.match(lines[i])
            and not QUOTE_RE.match(lines[i])
            and not HR_RE.match(lines[i])
            and not lines[i].strip().startswith("```")
            and not ("|" in lines[i] and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1]))
        ):
            buf.append(lines[i])
            i += 1
        out.append(Paragraph(md_inline(" ".join(buf)), styles["Body"]))

    flush_list()
    return out


# --------------------------------------------------------------------------- #
# Page chrome (cover + running header/footer)                                 #
# --------------------------------------------------------------------------- #


def cover_page(canvas, doc, title: str, subtitle: str) -> None:
    """Render the cover page background and centered title block."""
    width, height = A4
    # Cream background panel
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    # Navy band at top
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 4.2 * cm, width, 4.2 * cm, fill=1, stroke=0)
    # Gold accent stripe under the navy band
    canvas.setFillColor(GOLD)
    canvas.rect(0, height - 4.4 * cm, width, 0.18 * cm, fill=1, stroke=0)

    # Top brand line inside navy band
    canvas.setFillColor(colors.white)
    canvas.setFont("Times-Italic", 28)
    canvas.drawString(2.2 * cm, height - 2.8 * cm, "Tender")
    # measure "Tender" width for italic offset
    tender_w = canvas.stringWidth("Tender", "Times-Italic", 28)
    canvas.setFillColor(GOLD)
    canvas.setFont("Times-Italic", 28)
    canvas.drawString(2.2 * cm + tender_w, height - 2.8 * cm, "Flow")

    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(width - 2.2 * cm, height - 2.8 * cm, "tenderflow.co.ke")

    # Title block, centered, deeper down the page
    canvas.setFillColor(NAVY)
    canvas.setFont("Times-Bold", 30)
    canvas.drawCentredString(width / 2, height / 2 + 1.4 * cm, title)

    canvas.setFillColor(GOLD)
    canvas.setFont("Times-Italic", 14)
    canvas.drawCentredString(width / 2, height / 2 + 0.4 * cm, subtitle)

    # Hairline rule
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.6)
    canvas.line(width / 2 - 3 * cm, height / 2 - 0.4 * cm, width / 2 + 3 * cm, height / 2 - 0.4 * cm)

    # Footer block
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 10)
    canvas.drawCentredString(width / 2, 3 * cm, "(C) 2026 TenderFlow")
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawCentredString(width / 2, 2.4 * cm, "tenderflow.co.ke")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica-Oblique", 9)
    canvas.drawCentredString(width / 2, 1.7 * cm, "East African tender intelligence.")

    canvas.restoreState()


def running_chrome(canvas, doc, title: str) -> None:
    """Header + footer for every non-cover page."""
    width, height = A4
    canvas.saveState()

    # Header rule + text
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(2 * cm, height - 1.6 * cm, width - 2 * cm, height - 1.6 * cm)

    canvas.setFillColor(NAVY)
    canvas.setFont("Times-Italic", 11)
    canvas.drawString(2 * cm, height - 1.3 * cm, "Tender")
    tw = canvas.stringWidth("Tender", "Times-Italic", 11)
    canvas.setFillColor(GOLD)
    canvas.drawString(2 * cm + tw, height - 1.3 * cm, "Flow")

    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(width - 2 * cm, height - 1.3 * cm, title)

    # Footer page number
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 9)
    canvas.drawCentredString(width / 2, 1.2 * cm, f"{doc.page - 1}")  # subtract cover

    # Footer URL
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica-Oblique", 8)
    canvas.drawString(2 * cm, 1.2 * cm, "tenderflow.co.ke")
    canvas.drawRightString(width - 2 * cm, 1.2 * cm, "(C) 2026 TenderFlow")

    canvas.restoreState()


# --------------------------------------------------------------------------- #
# Build                                                                       #
# --------------------------------------------------------------------------- #


def build_pdf(md_path: Path, out_path: Path, title: str, subtitle: str) -> None:
    md_text = md_path.read_text(encoding="utf-8")

    # Strip the leading H1 if it matches the title; the cover already shows it.
    lines = md_text.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
        # also trim a blank line after the title
        if lines and not lines[0].strip():
            lines = lines[1:]
    md_text = "\n".join(lines)

    styles = build_styles()

    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=2.2 * cm,
        rightMargin=2.2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title=title,
        author="TenderFlow",
        subject=subtitle,
    )

    # Frames
    cover_frame = Frame(0, 0, A4[0], A4[1], id="cover", showBoundary=0)
    body_frame = Frame(
        2.2 * cm,
        2 * cm,
        A4[0] - 4.4 * cm,
        A4[1] - 4 * cm,
        id="body",
        showBoundary=0,
    )

    doc.addPageTemplates(
        [
            PageTemplate(
                id="Cover",
                frames=[cover_frame],
                onPage=lambda c, d: cover_page(c, d, title, subtitle),
            ),
            PageTemplate(
                id="Body",
                frames=[body_frame],
                onPage=lambda c, d: running_chrome(c, d, title),
            ),
        ]
    )

    story: list = []
    # Cover is rendered by the template; we just need to force a page break
    # into the body template.
    story.append(Spacer(1, 1))  # ensures the cover frame fires
    story.append(PageBreak())
    # Now we are on the second page template (Body). reportlab will pick the
    # next template in the list automatically once the first frame fills.
    # We use NextPageTemplate-style trick via explicit page break.
    from reportlab.platypus import NextPageTemplate

    # Wrap the body content with a template switch right after the cover.
    body_flow = md_to_flowables(md_text, styles)
    # Insert template switch at the start
    story = [
        NextPageTemplate("Body"),
        PageBreak(),
        *body_flow,
    ]

    doc.build(story)
    print(f"Wrote {out_path}  ({out_path.stat().st_size / 1024:.1f} KB)")


def main() -> None:
    build_pdf(
        REPO / "docs" / "BRAND.md",
        OUT_DIR / "TenderFlow_Brand_Book.pdf",
        title="Brand Book",
        subtitle="Canonical visual and verbal reference",
    )
    build_pdf(
        REPO / "docs" / "SETUP-TRADEMARK.md",
        OUT_DIR / "TenderFlow_Trademark_Filing_Pack.pdf",
        title="Trademark Filing Pack",
        subtitle="Kenya KIPI registration guide",
    )


if __name__ == "__main__":
    main()
