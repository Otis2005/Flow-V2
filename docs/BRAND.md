# TenderFlow Brand Book

The canonical reference for everything visual and verbal about TenderFlow. Use this whenever you're putting the brand somewhere new: pitch decks, press kits, social profiles, partner integrations, ads, business cards.

---

## 1. The name

**TenderFlow** — one word, two capitals (T and F), no space, no hyphen.

- ✅ TenderFlow
- ❌ Tenderflow
- ❌ Tender Flow
- ❌ Tender-Flow
- ❌ TENDERFLOW

The wordmark is **always set with "Flow" in italic** (`Tender*Flow*`). The italic split is the signature device of the brand. Outside of formal logo lockups (in body copy, headlines, contracts) you can write "TenderFlow" in plain weight — but the moment it becomes a graphic, italic "Flow" is mandatory.

**Tagline**: East African tender intelligence. Use sparingly; we are not Apple. The product description does most of the work: "Government, NGO and SME tenders, all in one place."

---

## 2. Colour palette

Three primaries, three accents, one alarm.

### Primary

| Name | Hex | RGB | Use |
|---|---|---|---|
| **Navy** | `#0A2240` | `10, 34, 64` | The defining brand colour. Headers, footers, navy section bands, primary buttons. |
| **Cream** | `#F7F1E5` | `247, 241, 229` | The warm light background. Page bodies, hero sections in light mode. |
| **Gold** | `#B98A3B` | `185, 138, 59` | The premium signal. Italic emphasis in headlines, focus rings, the AGPO badge, gold pills. |

### Accents

| Name | Hex | RGB | Use |
|---|---|---|---|
| Gold-soft | `#E7D49E` | `231, 212, 158` | Gold gradients, italic on dark backgrounds. |
| Teal | `#00A98F` | `0, 169, 143` | Secondary accent. Logo bar #2. Success states. |
| Teal-dark | `#007D6A` | `0, 125, 106` | The NGO source badge. |
| Amber | `#C7841A` | `199, 132, 26` | Tertiary accent. Logo bar #1. SME source badge. |

### Alarm

| Name | Hex | RGB | Use |
|---|---|---|---|
| Coral | `#F45B4F` | `244, 91, 79` | Closing-soon deadlines, validation errors, "needs review" markers. Same colour as `--danger`. |

### Supporting tokens (text and surfaces)

| Name | Hex | Use |
|---|---|---|
| Ink | `#0F1A2E` | Default text on light surfaces. |
| Muted | `#5C6B82` | Captions, metadata, eyebrow text. |
| Paper | `#FFFDF7` | Card and surface fill. |
| Paper-pure | `#FFFFFF` | Form input interiors only. |
| Cream-deep | `#F0E7D2` | Subtle surface elevation. |
| Rule | `#DDD3BC` | Default border. |

### Combinations to use

- **Navy + Gold** — the most premium pairing. Italic gold on navy bands.
- **Cream + Navy** — the default light-mode reading combination.
- **Cream + Gold + Navy** — the homepage hero recipe.
- **Navy + Paper text** — the dark band layout (consultant CTA, footer).

### Combinations to avoid

- ❌ Navy text on coral (low contrast on light backgrounds).
- ❌ Gold text on cream (golf course readability).
- ❌ Teal headline on cream (looks corporate-medical).
- ❌ Coral as primary CTA (it's the alarm colour).

---

## 3. Typography

Three families, all from Google Fonts, loaded with `display=swap`.

| Family | Weight available | Use |
|---|---|---|
| **Spectral** | 400, 500, 600, 400i, 500i | All display headlines, eyebrows, italic emphasis, hero text. The voice of the brand. |
| **Public Sans** | 400, 500, 600, 700 | Body copy, paragraphs, button labels, form fields. |
| **JetBrains Mono** | 400, 500 | Reference numbers, dates, metadata, monospaced detail. Never headlines. |

### The italic-em device

The brand's signature typographic move: a serif headline where one or two key words are italicised in gold.

> Government, NGO and SME tenders, *all in one place.*

> We get you the Tenders. *You write the bids.*

> Africa's procurement market is large, fragmented, and almost entirely *invisible*.

Use it once per heading. Never bold + italic together. Never italicise a verb. Best on the most evocative noun or short phrase.

### Sizing scale (web)

| Token | Pixel | Use |
|---|---|---|
| Display | clamp(36, 4.4vw, 60) | Hero headlines |
| Section title | clamp(28, 3vw, 40) | Section H2s |
| Section title small | clamp(26, 2.6vw, 32) | Compact sections |
| Body | 15–17 | Paragraphs |
| Eyebrow | 11 (uppercase, letter-spacing 0.1em) | The "HOW IT WORKS" labels above headlines |
| Mono detail | 11.5–13 | Reference numbers, dates |

---

## 4. The logo

Three forms of the logo, all built on the same wordmark.

### 4.1 Full lockup (primary)

The three coloured bars + the italic wordmark.

```
[amber bar][teal bar][navy bar] Tender Flow
```

Where the bars go short → medium → tall, left to right. The italic on "Flow" is mandatory.

Files: `public/brand/logo.svg` (light), `public/brand/logo-on-dark.svg` (third bar swaps to paper for legibility on dark backgrounds).

### 4.2 Mark only (no wordmark)

Just the three coloured bars. Use only when context already establishes the brand (e.g., favicon at 16×16, app icon at 64×64). Never use the mark alone in a context where the brand isn't already named on the page.

Files: `public/brand/mark.svg`.

### 4.3 Wordmark only (no mark)

The italic wordmark with no bars. Use in tight inline contexts (single-line headers, email signatures, footnotes).

Files: `public/brand/wordmark.svg` (navy), `public/brand/wordmark-paper.svg` (light wordmark for dark backgrounds).

### 4.4 Clear space

Around any lockup, leave a minimum padding equal to the height of one bar in the mark. No copy, image edge, or other element should violate that buffer.

### 4.5 What you must not do

- ❌ Recolour the bars to anything other than the prescribed amber / teal / navy (or paper on dark).
- ❌ Stretch the wordmark non-proportionally.
- ❌ Add a drop shadow.
- ❌ Use the wordmark without italic on "Flow".
- ❌ Set the wordmark in any font other than Spectral.
- ❌ Rotate the bars or the wordmark.
- ❌ Place the logo on a busy photo. Use a brand-approved surface (navy, cream, paper, or a uniformly dark photo background with the on-dark variant).

---

## 5. Voice & tone

How TenderFlow speaks. Direct, useful, calm, never salesy.

### Principles

| Do | Don't |
|---|---|
| "We consolidate live opportunities from ministries, parastatals, NGOs and SMEs across East Africa." | "We're revolutionising the procurement landscape with cutting-edge AI." |
| "Win more tenders. Spend less time hunting them down." | "Unlock unprecedented opportunities with our next-gen platform." |
| "Government, NGO and SME tenders, all in one place." | "All your tender needs, met." |
| "We read the PDFs. You write the bids." | "Leverage AI to streamline your procurement journey." |

### Rules

1. **No em-dashes** (—). Use commas, periods, or colons. Em-dashes read as AI-generated copy and we are not that.
2. **No AI-obvious phrasing.** Don't lead with "AI-powered" or "auto-extracted" or "Claude reads your documents." Describe user outcomes ("requirements appear in seconds"), not the mechanism.
3. **Use "East Africa"**, not "Africa" or "Pan-Africa". The product is regional and saying it owns the continent reads as overreach.
4. **Three sources** (always in this order): Government, NGO, SME. Never "Private".
5. **Italic emphasis is rationed.** One italic phrase per heading maximum. If everything is emphasised, nothing is.
6. **Short sentences.** Prefer 8–14 words. Long sentences are for explanations only.
7. **No exclamation marks** in marketing copy. Confidence doesn't need them.

### Words we use

- Tender, bid, bidder, procurement, opportunity, deadline, requirement, eligibility, ref number, BoQ, lot
- Government (full word, not "Govt" in copy — only the eyebrow stat block uses "Govt")
- "consolidate", "extract", "classify" — the three verbs in How It Works

### Words we don't use

- "Solution", "leverage", "synergy", "stakeholder", "ecosystem" (consultant speak)
- "Unlock", "revolutionise", "disrupt", "next-gen" (startup hype)
- "Easy", "simple" — show it, don't claim it
- "Cutting-edge", "powerful", "robust" (filler adjectives)
- "Pan-African" — too broad for our scope; we're East African

---

## 6. The product description

This is the canonical one-liner for any context that needs more than the name.

> **TenderFlow. East African tender intelligence.** One feed for live Government, NGO and SME tenders across Kenya, Uganda and Tanzania.

### Variants by length

- **5 words**: East African tender intelligence.
- **10 words**: Government, NGO and SME tenders across East Africa, consolidated.
- **25 words**: TenderFlow consolidates live Government, NGO and SME tender opportunities from Kenya, Uganda and Tanzania into one searchable feed. Free for bidders.
- **Press boilerplate (50 words)**: TenderFlow is an East African tender intelligence platform based in Nairobi. It consolidates Government, NGO and SME tender opportunities from Kenya, Uganda and Tanzania into one searchable feed, with AI-extracted bid requirements and a directory of vetted tender consultants. The platform is free for bidders.

---

## 7. Where the brand lives

| Asset | Location |
|---|---|
| Logo source SVGs | `public/brand/` |
| Favicon | `public/favicon.svg`, `public/favicon.ico` |
| Web manifest | `public/site.webmanifest` |
| Open Graph cover | `public/og-cover.svg` (and PNG export if exported) |
| Brand book (this file) | `docs/BRAND.md` |
| Colour tokens | `src/styles/styles.css` (`:root` block) |
| Logo component (web) | `src/components/Logo.jsx` |
| Live site | https://tenderflow.co.ke |
| Trademark application | (see `docs/SETUP-TRADEMARK.md`) |

---

## 8. The contact block

Use this verbatim for press, partner sheets, signature footers, address proofs.

```
TenderFlow
Eden Square Complex, Chiromo Road
Westlands, Block 1, 7th Floor
Nairobi, Kenya

help@tenderflow.co.ke
0724 131 492
https://tenderflow.co.ke
```

---

## 9. Versioning

This document is canonical from **2026-05-15** onward. Any future visual or verbal changes (new accent colour, redrawn mark, dropped product line) should be reflected here in the same commit. Don't let the brand book go stale.

When trademark registration finalises in Kenya (~12-18 months from filing), update section 7 with the registration number and class list.
