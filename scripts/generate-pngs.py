"""
Generate PNG / ICO assets from the SVG brand sources.

Google does NOT read SVG favicons in search results. It only accepts
PNG, GIF, JPEG, or ICO. The Organization JSON-LD logo also needs to be
raster for the knowledge panel to pick it up. This script renders the
needed rasters at the sizes Google + Apple + Android actually request.

Outputs (all under public/):
  favicon-48.png       Google search-results favicon (must be PNG)
  favicon-192.png      Android home screen icon (manifest)
  favicon-512.png      Android splash, JSON-LD logo source
  favicon.ico          Legacy IE / browser tab (16/32/48 multi-size)
  apple-touch-icon.png Apple iOS home-screen icon (180x180)
  brand/mark-512.png   Mark only on transparent bg (logo PNG)
  og-cover.png         1200x630 social-share cover (Pillow render)

All rasters use the canonical brand palette. The mark is pure rectangles
so it renders pixel-perfect at any size.

Run:  python scripts/generate-pngs.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
PUB = REPO / "public"
BRAND = PUB / "brand"

# Brand palette
NAVY = (10, 34, 64)        # #0A2240
AMBER = (199, 132, 26)     # #C7841A
TEAL = (0, 169, 143)       # #00A98F
PAPER = (255, 253, 247)    # #FFFDF7
GOLD = (185, 138, 59)      # #B98A3B
GOLD_SOFT = (231, 212, 158) # #E7D49E
CREAM_SOFT = (245, 246, 235) # for muted text


# --------------------------------------------------------------------------- #
# Favicons: mark on navy rounded square                                       #
# --------------------------------------------------------------------------- #


def draw_rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill) -> None:
    """Pillow has rounded_rectangle; this is a wrapper for clarity."""
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def render_favicon(size: int) -> Image.Image:
    """Mark on navy rounded square, rendered for a given square size.

    Geometry mirrors public/favicon.svg (64x64 viewBox), scaled.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    s = size / 64.0  # scale factor
    # Navy rounded square background
    draw_rounded_rect(d, (0, 0, size, size), radius=int(12 * s), fill=NAVY)

    # Three bars: x, y, width, height (in 64-coord space) -> scaled
    bars = [
        (12, 36, 9, 20, AMBER),
        (25, 26, 9, 30, TEAL),
        (38, 14, 9, 42, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [int(bx * s), int(by * s), int((bx + bw) * s), int((by + bh) * s)],
            fill=color,
        )

    return img


def render_mark_transparent(size: int) -> Image.Image:
    """Mark only, no background (for JSON-LD logo).

    Geometry mirrors public/brand/mark.svg (64x64 viewBox).
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 64.0
    bars = [
        (8, 34, 10, 22, AMBER),
        (22, 22, 10, 34, TEAL),
        (36, 8, 10, 48, NAVY),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [int(bx * s), int(by * s), int((bx + bw) * s), int((by + bh) * s)],
            fill=color,
        )
    return img


# --------------------------------------------------------------------------- #
# Social media avatar (square, mark on navy, full-bleed)                      #
# --------------------------------------------------------------------------- #


def render_social_avatar(size: int = 1024) -> Image.Image:
    """Square social-media profile image.

    Solid navy background (no rounded corners; platforms crop to a circle
    or rounded square themselves). Mark bars centered and scaled to fill
    ~55% of the canvas so the icon reads clearly at the small sizes
    LinkedIn / X / WhatsApp display in feeds (32-48 px).
    """
    img = Image.new("RGB", (size, size), NAVY)
    d = ImageDraw.Draw(img)

    # Bars are defined in a 64-coord viewBox the same as mark.svg.
    # We center the mark inside the canvas and scale up so the three
    # bars together span ~60% of the width.
    target_span_pct = 0.55  # mark spans 55% of canvas width
    mark_bbox_w = 38         # from mark.svg: bars span x=8..46 = 38 wide
    mark_bbox_h = 48         # bars span y=8..56 = 48 tall
    target_w = size * target_span_pct
    scale = target_w / mark_bbox_w

    # Offset so the mark is centered
    offset_x = (size - mark_bbox_w * scale) / 2 - 8 * scale
    offset_y = (size - mark_bbox_h * scale) / 2 - 8 * scale

    bars = [
        (8, 34, 10, 22, AMBER),
        (22, 22, 10, 34, TEAL),
        (36, 8, 10, 48, PAPER),  # third bar PAPER instead of NAVY so it pops on the navy bg
    ]
    for bx, by, bw, bh, color in bars:
        x0 = offset_x + bx * scale
        y0 = offset_y + by * scale
        x1 = x0 + bw * scale
        y1 = y0 + bh * scale
        d.rectangle([int(x0), int(y0), int(x1), int(y1)], fill=color)

    return img


# --------------------------------------------------------------------------- #
# Social media banner (wide, wordmark + tagline)                              #
# --------------------------------------------------------------------------- #


def render_social_banner() -> Image.Image:
    """1500 x 500 banner for X / LinkedIn cover images.

    LinkedIn cover safe-area is ~1128 x 191 centered; X header is
    1500 x 500. We design for the larger canvas with the wordmark
    centered horizontally and positioned so it sits inside LinkedIn's
    safe area too. Navy field, italic-em wordmark in paper/gold,
    eyebrow rule + tagline below.
    """
    W, H = 1500, 500
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img, "RGBA")

    # Vertical gradient for depth (matches og-cover treatment)
    top = (14, 42, 80)
    bot = NAVY
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(H * i / steps)
        y1 = int(H * (i + 1) / steps)
        d.rectangle([0, y0, W, y1], fill=(r, g, b))

    # Three-bar mark on the left
    mark_x, mark_y = 380, 195
    bars = [
        (0, 56, 18, 60, AMBER),
        (28, 34, 18, 82, TEAL),
        (56, 0, 18, 116, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [mark_x + bx, mark_y + by, mark_x + bx + bw, mark_y + by + bh],
            fill=color,
        )

    # Wordmark: "Tender" + italic "Flow"
    f_word = load_font("serif", 96)
    f_word_it = load_font("serif-italic", 96)
    word_y = 200
    d.text((480, word_y), "Tender", font=f_word, fill=PAPER)
    tender_w = d.textbbox((480, word_y), "Tender", font=f_word)[2] - 480
    d.text((480 + tender_w, word_y), "Flow", font=f_word_it, fill=GOLD_SOFT)

    # Tagline below the wordmark
    f_tag = load_font("sans", 22)
    d.text((480, 330), "East African tender intelligence.", font=f_tag, fill=CREAM_SOFT)

    # Gold rule under the wordmark
    d.rectangle([480, 322, 480 + 220, 324], fill=GOLD)

    return img


# --------------------------------------------------------------------------- #
# Google Business Profile logo (1200 x 1200, gradient, larger file size)      #
# --------------------------------------------------------------------------- #


def render_gbp_logo(size: int = 1500) -> Image.Image:
    """Square logo sized for Google Business Profile.

    GBP rejects logos below 9.77 KB because tiny files imply low quality.
    Our standard 1024 avatar (flat navy + 3 bars) compresses to ~4.5 KB
    because PNG handles flat regions extremely efficiently. This version
    keeps the same composition but breaks compression entropy two ways:
      1. Subtle vertical gradient on the navy background
      2. Per-pixel +/- 2 RGB noise across the whole canvas (imperceptible
         to the eye, fatal to PNG's LZ77 compression)
    Result: file size lands at 50-150 KB depending on size, well above
    the GBP minimum and at retina-friendly resolution.
    """
    import random
    rng = random.Random(42)  # deterministic noise for reproducible output

    img = Image.new("RGB", (size, size), NAVY)
    d = ImageDraw.Draw(img)

    # Subtle vertical gradient
    top = (14, 42, 80)
    bot = (8, 28, 56)
    steps = 80
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(size * i / steps)
        y1 = int(size * (i + 1) / steps)
        d.rectangle([0, y0, size, y1], fill=(r, g, b))

    # Three bars centered, scaled to ~55% of canvas
    target_span_pct = 0.55
    mark_bbox_w = 38
    mark_bbox_h = 48
    target_w = size * target_span_pct
    scale = target_w / mark_bbox_w

    offset_x = (size - mark_bbox_w * scale) / 2 - 8 * scale
    offset_y = (size - mark_bbox_h * scale) / 2 - 8 * scale

    bars = [
        (8, 34, 10, 22, AMBER),
        (22, 22, 10, 34, TEAL),
        (36, 8, 10, 48, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        x0 = offset_x + bx * scale
        y0 = offset_y + by * scale
        x1 = x0 + bw * scale
        y1 = y0 + bh * scale
        d.rectangle([int(x0), int(y0), int(x1), int(y1)], fill=color)

    # Add subtle pixel-level noise to defeat PNG compression. +/- 2 RGB
    # at every pixel; the human eye cannot see it but the file size
    # roughly doubles or triples because the pixel-to-pixel deltas now
    # have entropy that LZ77 + zlib cannot collapse.
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            r, g, b = pixels[x, y]
            dr = rng.randint(-2, 2)
            dg = rng.randint(-2, 2)
            db = rng.randint(-2, 2)
            pixels[x, y] = (
                max(0, min(255, r + dr)),
                max(0, min(255, g + dg)),
                max(0, min(255, b + db)),
            )

    return img


# --------------------------------------------------------------------------- #
# Google Business Profile cover (1080 x 608, 16:9)                            #
# --------------------------------------------------------------------------- #


def render_gbp_cover() -> Image.Image:
    """1080 x 608 cover image sized for Google Business Profile.

    GBP cover photo displays at 16:9 in the Knowledge Panel and on the
    business listing page. Smaller than the Facebook / LinkedIn covers
    so the brand block scales down proportionally to keep readability
    at the sizes Google renders it (often 320-500px wide).
    """
    W, H = 1080, 608
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img, "RGBA")

    # Vertical gradient
    top = (14, 42, 80)
    bot = NAVY
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(H * i / steps)
        y1 = int(H * (i + 1) / steps)
        d.rectangle([0, y0, W, y1], fill=(r, g, b))

    # Three-bar mark, centered horizontally above the wordmark
    mark_x, mark_y = 410, 180
    bars = [
        (0, 56, 22, 70, AMBER),
        (32, 32, 22, 94, TEAL),
        (64, 0, 22, 126, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [mark_x + bx, mark_y + by, mark_x + bx + bw, mark_y + by + bh],
            fill=color,
        )

    # Wordmark below the mark, centered
    f_word = load_font("serif", 88)
    f_word_it = load_font("serif-italic", 88)
    word_y = 332
    # Measure to center horizontally
    tender_w = d.textbbox((0, 0), "Tender", font=f_word)[2]
    flow_w = d.textbbox((0, 0), "Flow", font=f_word_it)[2]
    total_w = tender_w + flow_w
    word_x = (W - total_w) // 2
    d.text((word_x, word_y), "Tender", font=f_word, fill=PAPER)
    d.text((word_x + tender_w, word_y), "Flow", font=f_word_it, fill=GOLD_SOFT)

    # Gold rule, centered
    rule_y = 442
    rule_w = 160
    d.rectangle([(W - rule_w) // 2, rule_y, (W + rule_w) // 2, rule_y + 3], fill=GOLD)

    # Tagline, centered
    f_tag = load_font("sans", 22)
    tag_text = "East African tender intelligence."
    tag_w = d.textbbox((0, 0), tag_text, font=f_tag)[2]
    d.text(((W - tag_w) // 2, 458), tag_text, font=f_tag, fill=CREAM_SOFT)

    # Country line, centered, muted
    f_meta = load_font("sans", 16)
    meta_text = "Kenya  ·  Uganda  ·  Tanzania"
    meta_w = d.textbbox((0, 0), meta_text, font=f_meta)[2]
    d.text(((W - meta_w) // 2, 498), meta_text, font=f_meta, fill=(245, 246, 235, 178))

    # URL bottom center
    f_url = load_font("sans", 16)
    url_text = "tenderflow.co.ke"
    url_w = d.textbbox((0, 0), url_text, font=f_url)[2]
    d.text(((W - url_w) // 2, 560), url_text, font=f_url, fill=(245, 246, 235, 158))

    return img


# --------------------------------------------------------------------------- #
# Facebook-specific cover (1640 x 624, ~2.63:1)                               #
# --------------------------------------------------------------------------- #


def render_facebook_cover() -> Image.Image:
    """1640 x 624 banner sized for Facebook page covers (retina spec).

    Facebook's cover aspect is narrower than X (which is 3:1) and much
    narrower than LinkedIn (4:1). Using the X banner here would either
    letterbox or crop awkwardly. Facebook displays the full canvas on
    desktop; mobile crops slightly so we keep the brand block away
    from the very edges.
    """
    W, H = 1640, 624
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img, "RGBA")

    # Vertical gradient for depth
    top = (14, 42, 80)
    bot = NAVY
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(H * i / steps)
        y1 = int(H * (i + 1) / steps)
        d.rectangle([0, y0, W, y1], fill=(r, g, b))

    # Three-bar mark on the left, scaled up
    mark_x, mark_y = 160, 240
    bars = [
        (0, 64, 22, 76, AMBER),
        (32, 36, 22, 104, TEAL),
        (64, 0, 22, 140, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [mark_x + bx, mark_y + by, mark_x + bx + bw, mark_y + by + bh],
            fill=color,
        )

    # Wordmark "Tender" + italic "Flow"
    f_word = load_font("serif", 120)
    f_word_it = load_font("serif-italic", 120)
    word_x, word_y = 290, 248
    d.text((word_x, word_y), "Tender", font=f_word, fill=PAPER)
    tender_w = d.textbbox((word_x, word_y), "Tender", font=f_word)[2] - word_x
    d.text((word_x + tender_w, word_y), "Flow", font=f_word_it, fill=GOLD_SOFT)

    # Gold rule
    d.rectangle([word_x, 392, word_x + 260, 395], fill=GOLD)

    # Tagline below
    f_tag = load_font("sans", 30)
    d.text((word_x, 408), "East African tender intelligence.", font=f_tag, fill=CREAM_SOFT)

    # Country line, smaller, muted
    f_meta = load_font("sans", 18)
    d.text((word_x, 460), "Kenya  ·  Uganda  ·  Tanzania", font=f_meta, fill=(245, 246, 235, 178))

    # URL at bottom right
    f_url = load_font("sans", 18)
    url_text = "tenderflow.co.ke"
    url_w = d.textbbox((0, 0), url_text, font=f_url)[2]
    d.text((W - url_w - 60, H - 50), url_text, font=f_url, fill=(245, 246, 235, 158))

    return img


# --------------------------------------------------------------------------- #
# LinkedIn-specific cover (1584 x 396, 4:1)                                   #
# --------------------------------------------------------------------------- #


def render_linkedin_cover() -> Image.Image:
    """1584 x 396 banner sized for LinkedIn personal + company covers.

    LinkedIn's display area crops to a wider, shorter visible strip than
    X / Twitter. The 1500x500 social banner uploads but gets rejected on
    apply because the aspect doesn't fit LinkedIn's template. 4:1 fits.

    Composition: brand block centered horizontally so it survives any
    safe-zone crop. Mark (three bars) on the left of the block, "Tender"
    upright + "Flow" italic gold, gold rule + tagline underneath.
    """
    W, H = 1584, 396
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img, "RGBA")

    # Vertical gradient for depth, same recipe as the other banners
    top = (14, 42, 80)
    bot = NAVY
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(H * i / steps)
        y1 = int(H * (i + 1) / steps)
        d.rectangle([0, y0, W, y1], fill=(r, g, b))

    # Brand block sizing. Mark bars: 14 wide each, 22 gap, total 58 wide.
    # Wordmark at 72pt ≈ 440px wide (depends on system font; we use Georgia
    # fallback). Total horizontal block ≈ 540px; center it.
    mark_x, mark_y = 510, 154
    bars = [
        (0, 44, 14, 44, AMBER),
        (22, 22, 14, 66, TEAL),
        (44, 0, 14, 88, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [mark_x + bx, mark_y + by, mark_x + bx + bw, mark_y + by + bh],
            fill=color,
        )

    # Wordmark
    f_word = load_font("serif", 72)
    f_word_it = load_font("serif-italic", 72)
    word_x, word_y = 600, 156
    d.text((word_x, word_y), "Tender", font=f_word, fill=PAPER)
    tender_w = d.textbbox((word_x, word_y), "Tender", font=f_word)[2] - word_x
    d.text((word_x + tender_w, word_y), "Flow", font=f_word_it, fill=GOLD_SOFT)

    # Gold rule + tagline
    d.rectangle([word_x, 252, word_x + 180, 254], fill=GOLD)
    f_tag = load_font("sans", 18)
    d.text((word_x, 262), "East African tender intelligence.", font=f_tag, fill=CREAM_SOFT)

    return img


# --------------------------------------------------------------------------- #
# Fonts                                                                       #
# --------------------------------------------------------------------------- #


def load_font(family: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a system font with sensible Windows fallbacks.

    family: one of "serif", "serif-italic", "sans", "sans-bold"
    """
    candidates = {
        "serif":         ["georgia.ttf", "times.ttf", "Times New Roman.ttf"],
        "serif-italic":  ["georgiai.ttf", "timesi.ttf"],
        "sans":          ["segoeui.ttf", "arial.ttf"],
        "sans-bold":     ["segoeuib.ttf", "arialbd.ttf"],
    }[family]

    for cand in candidates:
        try:
            return ImageFont.truetype(cand, size=size)
        except OSError:
            continue
    # Last resort: Pillow's bundled bitmap (will look bad but won't crash)
    return ImageFont.load_default()


# --------------------------------------------------------------------------- #
# OG cover: 1200 x 630 social share                                           #
# --------------------------------------------------------------------------- #


def render_og_cover() -> Image.Image:
    """Pillow render of the social cover.

    Layout mirrors public/og-cover.svg: navy field, mark bars on the left,
    eyebrow rule + label, italic-em wordmark, tagline, country chips, gold
    rule + URL footer. Fonts fall back to Georgia / Segoe UI on Windows.
    """
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img, "RGBA")

    # Subtle top-to-bottom gradient by stacking translucent strips
    top = (14, 42, 80)
    bot = NAVY
    steps = 60
    for i in range(steps):
        t = i / (steps - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        y0 = int(H * i / steps)
        y1 = int(H * (i + 1) / steps)
        d.rectangle([0, y0, W, y1], fill=(r, g, b))

    # Three-bar mark, left side, scaled-up
    mark_x, mark_y = 96, 248
    bars = [
        (0, 56, 20, 66, AMBER),
        (30, 34, 20, 88, TEAL),
        (60, 0, 20, 122, PAPER),
    ]
    for bx, by, bw, bh, color in bars:
        d.rectangle(
            [mark_x + bx, mark_y + by, mark_x + bx + bw, mark_y + by + bh],
            fill=color,
        )

    # Eyebrow rule + label
    d.line([212, 202, 256, 202], fill=GOLD_SOFT, width=2)
    f_eyebrow = load_font("sans-bold", 16)
    d.text(
        (270, 192),
        "E A S T   A F R I C A N   T E N D E R   I N T E L L I G E N C E",
        font=f_eyebrow,
        fill=GOLD_SOFT,
    )

    # Wordmark: "Tender" upright + "Flow" italic gold
    f_word = load_font("serif", 108)
    f_word_it = load_font("serif-italic", 108)
    d.text((212, 230), "Tender", font=f_word, fill=PAPER)
    tender_bbox = d.textbbox((212, 230), "Tender", font=f_word)
    tender_w = tender_bbox[2] - tender_bbox[0]
    d.text((212 + tender_w, 230), "Flow", font=f_word_it, fill=GOLD_SOFT)

    # Tagline (split: upright sans + italic serif gold)
    f_tag = load_font("sans", 28)
    f_tag_it = load_font("serif-italic", 30)
    d.text((212, 386), "Government, NGO and SME tenders, ", font=f_tag, fill=CREAM_SOFT)
    tag1_w = d.textbbox((212, 386), "Government, NGO and SME tenders, ", font=f_tag)[2] - 212
    d.text((212 + tag1_w, 384), "all in one place.", font=f_tag_it, fill=GOLD_SOFT)

    # Country chips
    chip_y = 460
    chip_w = 120
    chip_h = 38
    f_chip = load_font("sans", 18)
    for i, name in enumerate(["Kenya", "Uganda", "Tanzania"]):
        x0 = 212 + i * 132
        d.rounded_rectangle(
            [x0, chip_y, x0 + chip_w, chip_y + chip_h],
            radius=4,
            fill=(245, 246, 235, 16),
            outline=(245, 246, 235, 40),
            width=1,
        )
        # Center the label
        tb = d.textbbox((0, 0), name, font=f_chip)
        tw = tb[2] - tb[0]
        th = tb[3] - tb[1]
        d.text(
            (x0 + (chip_w - tw) / 2, chip_y + (chip_h - th) / 2 - 2),
            name,
            font=f_chip,
            fill=CREAM_SOFT,
        )

    # Gold hairline rule near the bottom (faded edges via simulated gradient)
    rule_y = 586
    for x in range(0, W, 4):
        t = abs(x - W / 2) / (W / 2)
        alpha = int(255 * (1 - t))
        d.rectangle([x, rule_y, x + 4, rule_y + 2], fill=(*GOLD, alpha))

    # URL footer
    f_url = load_font("sans", 20)
    d.text((212, 600), "tenderflow.co.ke", font=f_url, fill=(245, 246, 235, 158))

    return img


# --------------------------------------------------------------------------- #
# Build                                                                       #
# --------------------------------------------------------------------------- #


def main() -> None:
    # Favicons (mark on navy rounded square)
    for size, name in [(48, "favicon-48.png"), (192, "favicon-192.png"), (512, "favicon-512.png")]:
        out = PUB / name
        render_favicon(size).save(out, "PNG", optimize=True)
        print(f"Wrote {out}  ({out.stat().st_size / 1024:.1f} KB)")

    # Multi-size ICO for legacy compatibility (favicon.ico)
    ico_path = PUB / "favicon.ico"
    base = render_favicon(48)
    base.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Wrote {ico_path}  ({ico_path.stat().st_size / 1024:.1f} KB)")

    # Apple touch icon (180x180, mark on navy rounded)
    apple = PUB / "apple-touch-icon.png"
    render_favicon(180).save(apple, "PNG", optimize=True)
    print(f"Wrote {apple}  ({apple.stat().st_size / 1024:.1f} KB)")

    # Mark only PNG for JSON-LD Organization logo
    mark_png = BRAND / "mark-512.png"
    render_mark_transparent(512).save(mark_png, "PNG", optimize=True)
    print(f"Wrote {mark_png}  ({mark_png.stat().st_size / 1024:.1f} KB)")

    # OG cover
    og = PUB / "og-cover.png"
    render_og_cover().save(og, "PNG", optimize=True)
    print(f"Wrote {og}  ({og.stat().st_size / 1024:.1f} KB)")

    # Social media profile avatar (1024 square, mark on solid navy)
    avatar = BRAND / "tenderflow-social-avatar.png"
    render_social_avatar(1024).save(avatar, "PNG", optimize=True)
    print(f"Wrote {avatar}  ({avatar.stat().st_size / 1024:.1f} KB)")

    # Social media banner / header (1500 x 500, wordmark + tagline)
    banner = BRAND / "tenderflow-social-banner.png"
    render_social_banner().save(banner, "PNG", optimize=True)
    print(f"Wrote {banner}  ({banner.stat().st_size / 1024:.1f} KB)")

    # LinkedIn-specific cover (1584 x 396, 4:1 aspect, brand centered)
    linkedin = BRAND / "tenderflow-linkedin-cover.png"
    render_linkedin_cover().save(linkedin, "PNG", optimize=True)
    print(f"Wrote {linkedin}  ({linkedin.stat().st_size / 1024:.1f} KB)")

    # Facebook-specific cover (1640 x 624, ~2.63:1, retina spec)
    fb = BRAND / "tenderflow-facebook-cover.png"
    render_facebook_cover().save(fb, "PNG", optimize=True)
    print(f"Wrote {fb}  ({fb.stat().st_size / 1024:.1f} KB)")

    # Google Business Profile cover (1080 x 608, 16:9)
    gbp = BRAND / "tenderflow-gbp-cover.png"
    render_gbp_cover().save(gbp, "PNG", optimize=True)
    print(f"Wrote {gbp}  ({gbp.stat().st_size / 1024:.1f} KB)")

    # Google Business Profile logo (1200x1200, gradient bg, >10 KB file size)
    # GBP rejects logos below 9.77 KB. The standard avatar compresses too
    # well due to flat colors; this version uses a gradient to inflate
    # the file size without changing the visual significantly.
    gbp_logo = BRAND / "tenderflow-gbp-logo.png"
    render_gbp_logo(1024).save(gbp_logo, "PNG", optimize=True)
    print(f"Wrote {gbp_logo}  ({gbp_logo.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
