# Design System

Single source of truth for every visual value used in this theme. If a value isn't in this
file, it doesn't get used in code — flag it and ask instead of guessing.

## Font

**DM Sans** everywhere (headings, body, buttons, nav, forms — no exceptions, no fallback
custom fonts).

Confirmed available in Shopify's native `font_picker` library as `dm_sans_n1`–`dm_sans_n9`
(and `dm_sans_i1`–`dm_sans_i9` for italics), so it loads through Shopify's own font pipeline
(CDN-hosted, preloaded, `font-display: swap` handled automatically) — no self-hosted `@font-face`
needed and no extra Google Fonts network request.

Dawn already ships two `font_picker` settings — `type_header_font` and `type_body_font` — so we
reuse those rather than adding new ones (verified in `config/settings_schema.json`, not assumed):

- `settings.type_body_font` default → `dm_sans_n4` (400, drives `p` / `.text-body`)
- `settings.type_header_font` default → `dm_sans_n6` (600, drives `h1`/`h2`/`h4`/`h5`/`h6`)
- h3 needs 500, not 600, but Dawn ties every heading level to one shared weight variable — so
  `theme.liquid` additionally loads a `font_modify: 'weight', '500'` variant of the header font
  and exposes it as `--font-heading-weight-h3`, applied only to `h3`/`.h3` in `base.css`.

Implemented in `theme/config/settings_schema.json` (+ `settings_data.json` for the live values),
`theme/layout/theme.liquid` (font loading + CSS variables), and `theme/assets/base.css`
(the actual `h1`/`h2`/`h3`/`p` rules — see the "Custom type scale (DM Sans)" comment block there).

## Type scale (responsive)

Breakpoints match Dawn's existing CSS breakpoints exactly — do not introduce new ones:

| Label   | Range              |
|---------|--------------------|
| Mobile  | `< 750px`          |
| Tablet  | `750px – 989px`    |
| Desktop | `≥ 990px`          |

| Element | Weight | Mobile | Tablet | Desktop |
|---------|--------|-------:|-------:|--------:|
| h1      | 600    | 25px   | 28px   | 30px    |
| h2      | 600    | 20px   | 22px   | 25px    |
| h3      | 500    | 18px   | 20px   | 21px    |
| p       | 400    | 16px   | 17px   | 17px    |

**Implemented** as a literal-px override block in `theme/assets/base.css` (search for the
"Custom type scale (DM Sans)" comment), placed directly after Dawn's own `h1`/`h2`/`h3` rules so
it wins the cascade by source order — no `!important` needed. Applies to both `p` and the
`.text-body` utility class Dawn uses across sections, so body copy is consistent everywhere.

Known, accepted tradeoff: Dawn's merchant-facing "Heading scale" slider (100–150%, in the theme
editor's Typography settings) no longer resizes `h1`/`h2`/`h3` since their sizes are now fixed
px per breakpoint instead of the slider-driven `calc()` formula. It still works on `h0`/`h4`–`h6`
and other heading utility classes, which weren't in scope.

## Layout

| Token | Value | Notes |
|-------|-------|-------|
| Max page width (desktop) | `1240px` | `settings.page_width`, `config/settings_data.json`. Slider step narrowed 100→10 so 1240 is a valid stop. |
| Page gutter (left/right) | `20px` | Flat at all 3 breakpoints. `.page-width` class in `base.css` only — header/utility-bar/narrow/`.page-width-desktop` variants intentionally keep Dawn's original wider gutters (nav chrome, not general page content). |
| Section-to-section spacing (top/bottom) | Desktop `80px` · Tablet+Mobile `50px` | Gap between stacked sections (`--spacing-sections-desktop`/`-mobile` in `theme.liquid`, applied via `.section + .section` in `base.css`). Breakpoint moved from Dawn's default 750px to **990px** so tablet groups with mobile. Hardcoded — same tradeoff as the type scale: the merchant's "Section spacing" slider no longer drives this value. |

## Color

Only three colors, ever:

| Token              | Hex       | Role                                             |
|---------------------|-----------|---------------------------------------------------|
| `--color-highlight` | `#997A51` | Accent — buttons, links, active states, badges, borders |
| `--color-black`     | `#000000` | Primary text, dark backgrounds                   |
| `--color-white`     | `#FFFFFF` | Page background, text on dark/highlight surfaces  |

No gradients, no tints/shades, no arbitrary greys added without approval.

**Contrast check (WCAG AA, verified against Shopify's theme accessibility bar — standard text
≥4.5:1, large text 24px+ ≥3:1, icons/borders ≥3:1):**
- `#997A51` text/icons on `#FFFFFF` background ≈ **4.0:1** — passes as large text (24px+, so
  desktop h1/h2 only) and for icons/borders, **fails AA for everything under 24px** — that
  includes h3 (18-21px) and all body copy. Never set the highlight color as h3 or paragraph text
  on a white background; use it for buttons, large headings, icons, borders, or backgrounds
  instead.
- `#997A51` on `#000000` (or the reverse) ≈ **5.25:1** — passes AA for all text sizes.
- `#000000` on `#FFFFFF` ≈ 21:1 — always safe, this is the default body-copy pairing.

### Shopify color scheme mapping (verified against actual scaffolded Dawn 16.0.0)

Dawn defines one reusable `color_scheme_group` (in `settings_schema.json`) and ships **5**
concrete scheme instances in `settings_data.json` — every section picks one of these 5 by ID via
its built-in "Color scheme" setting, so we remapped all 5 into our 3-color palette instead of
inventing new ones:

| Scheme | Background | Text | Button | Button label | Use for |
|--------|-----------|------|--------|--------------|---------|
| `scheme-1` | `#FFFFFF` | `#000000` | `#997A51` | `#FFFFFF` | Default light sections, highlight CTA |
| `scheme-2` | `#FFFFFF` | `#000000` | `#000000` | `#FFFFFF` | Light sections, neutral (non-accent) CTA |
| `scheme-3` | `#000000` | `#FFFFFF` | `#997A51` | `#FFFFFF` | Dark sections, highlight CTA |
| `scheme-4` | `#000000` | `#FFFFFF` | `#FFFFFF` | `#000000` | Dark sections, neutral CTA |
| `scheme-5` | `#997A51` | `#FFFFFF` | `#FFFFFF` | `#997A51` | Solid accent-color block sections |

Implemented directly in `theme/config/settings_data.json`. Per-section scheme choice is made in
the theme editor when we build that section from its screenshot.

## Source of truth

Any new hex value, font, or pixel size a screenshot seems to require must be reconciled against
this file first — round to the nearest existing token, or stop and ask before adding a new one.
See [rules.md](rules.md) for the enforcement workflow.
