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


if __name__ == "__main__":
    main()
