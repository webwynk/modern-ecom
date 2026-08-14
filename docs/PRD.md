# PRD — Shopify Custom Theme (Dawn-based)

Governing docs: [design.md](design.md) (all visual tokens) · [rules.md](rules.md) (always-on
process rules — **read together with this file**).

Process note: steps below are executed **one at a time, in order**, and each one requires your
explicit go-ahead before it starts (rule #3). Sections marked "awaiting screenshot" cannot start
until you send that section's design.

## 1. Goal

Custom Shopify storefront theme, forked from Dawn (Online Store 2.0), with:
- Dynamic products & categories (native Shopify objects/collections)
- Reviews & ratings (Judge.me app)
- Estimated delivery date on product pages (metafield-driven)
- DM Sans typography + 3-color palette applied consistently, per design.md

## 2. Stack

| Layer          | Choice                                                   |
|----------------|-----------------------------------------------------------|
| Base theme     | Dawn (latest, Online Store 2.0 / JSON templates)          |
| Tooling        | Shopify CLI (`theme dev`, `theme push`, `theme check`)    |
| Reviews        | Judge.me (app blocks in `templates/product.json`)         |
| Filtering      | Search & Discovery (official Shopify app, free)           |
| Delivery data  | Product metafields (`custom.processing_days`, etc.)       |
| Font           | DM Sans via Shopify native `font_picker`                  |

## 3. Step-by-step plan

Status legend: `[ ] pending` · `[»] needs your go-ahead next` · `[✓] done`

### Phase A — Foundation
- [✓] **Step 0** — Design system + rules + PRD docs (this file, design.md, rules.md, dev skill)
- [✓] **Step 1** — Scaffold Dawn into this repo, connect to dev store via Shopify CLI, confirm
      `theme dev` runs locally
- [✓] **Step 2** — Global design tokens wired: `type_header_font`→`dm_sans_n6`,
      `type_body_font`→`dm_sans_n4` (`settings_schema.json` + `settings_data.json`); h3-specific
      500-weight loaded via `font_modify` in `theme.liquid`; literal px type scale for h1/h2/h3/p
      + `.text-body` in `base.css`; all 5 color schemes remapped to the 3-color palette in
      `settings_data.json`. `shopify theme check` clean (only pre-existing Dawn warnings).
- [✓] **Step 2b** — Global layout tokens: `page_width` → 1240px (step narrowed to 10 so it's a
      valid slider stop), `.page-width` gutter flattened to 20px at all breakpoints (header/
      utility-bar/narrow/`.page-width-desktop` variants left untouched), section-to-section
      vertical rhythm hardcoded to 80px desktop / 50px tablet+mobile with the tier boundary
      moved from 750px to 990px. `shopify theme check` clean.
- [✓] **Step 3** — Verified via Playwright against the live dev preview (1440px viewport):
      DM Sans + palette + h1 size (30px/600) + page max-width (1240px) + `.page-width` gutter
      (20px on content areas) + section gap (80px desktop) all confirmed correct. One deferred
      item: the stock demo hero's own `padding: 5rem` in `section-image-banner.css` overrides
      its left/right to 50px — left as-is since that section gets rebuilt from a screenshot in
      Step 5 anyway. `p` sizing not yet exercised (no literal `<p>` content on stock homepage).

### Phase B — Sections (each awaits a screenshot from you)
- [✓] **Step 4** — Header / navigation: 3-row desktop header + mobile/tablet layout built from screenshots.
      Top bar: 3 trust badges (Shipping 🚚, Support 🎧, Security 🛡️), Currency selector (`$ USD`), Login button (`👤 Login`), 12px padding, `#000000` background.
      Middle row: Logo text `"The Golden Rug"`, center wide search bar with `#997A51` button, phone support block `(+1 888-795-8816)` with *"Sales & Service Support"*, 15px padding.
      Bottom row: Main menu, Wishlist link (`♡ Wishlist`), Cart button (`🛒 Cart` + `#997A51` count badge), 12px padding. Compare widget & logo-side categories button omitted.
      Mobile & Tablet: Compact top bar with logo, direct phone button 📞, hamburger toggle ☰; drawer with Guest greeting header, dual **Navigation** / **Categories** tab switcher, and currency selector.
- [ ] **Step 5** — Homepage hero — *awaiting screenshot*
- [ ] **Step 6** — Category / collection showcase (homepage) — *awaiting screenshot*
- [ ] **Step 7** — Featured / dynamic product grid (homepage) — *awaiting screenshot*
- [ ] **Step 8** — Collection listing page (grid + filters via Search & Discovery) —
      *awaiting screenshot*
- [ ] **Step 9** — Product page main layout (gallery, price, variants, buy box) —
      *awaiting screenshot*
- [ ] **Step 10** — Reviews & ratings: install Judge.me, add star-rating block to product card
      and full review widget + form to product page — *needs go-ahead, no screenshot required
      unless you want custom placement*
- [ ] **Step 11** — Estimated delivery date: create `custom.processing_days` (+ optional
      min/max day metafields) in admin, build `snippets/delivery-estimate.liquid`, place near
      buy button — *needs go-ahead + your desired copy format (e.g. "Arrives Aug 15–18")*
- [ ] **Step 12** — Cart drawer / cart page — *awaiting screenshot*
- [ ] **Step 13** — Footer — *awaiting screenshot*
- [ ] **Step 14** — Secondary pages (About, Contact, 404, etc.) — *awaiting screenshot(s), list
      TBD*

### Phase C — QA & Handoff
- [ ] **Step 15** — Full QA pass: `shopify theme check`, responsive check at the 3 breakpoints,
      contrast/accessibility spot-check, Lighthouse/perf pass
- [ ] **Step 16** — Client data decision: staff access to real store vs. CSV export/import of
      products+collections+metafields into dev store for realistic testing (per earlier
      discussion — needs your call on which client store this is)
- [ ] **Step 17** — Push finished theme to client's store as an **unpublished** preview theme
- [ ] **Step 18** — Client review round, revisions as needed
- [ ] **Step 19** — Client publishes live

## 4. Metafield definitions (to create in Step 11)

| Namespace.key                  | Type   | Purpose                                  |
|---------------------------------|--------|-------------------------------------------|
| `custom.processing_days`        | Number | Days before an order ships                |
| `custom.shipping_days_min`      | Number | Fastest transit estimate (optional)       |
| `custom.shipping_days_max`      | Number | Slowest transit estimate (optional)       |

Exact fields confirmed at Step 11 based on how granular you want the estimate.

## 5. Apps required

| App                | Purpose                          | Cost           |
|--------------------|-----------------------------------|----------------|
| Judge.me            | Reviews & ratings                | Free tier available |
| Search & Discovery  | Collection filtering/sorting     | Free (official Shopify) |

## 6. Out of scope (unless you add it)

- Custom checkout modifications (Shopify Plus only, not assumed here)
- Multi-language / multi-currency setup
- Custom review system outside Judge.me
- Any live-store data changes before Step 16/17

## 7. Open questions

- Which client store is the target for Step 16 (staff access vs. export/import)?
- Delivery estimate copy format/wording — confirmed at Step 11.
- Full list of secondary pages needed for Step 14.

---
**Next action:** Step 1 — say go-ahead when ready and I'll scaffold Dawn and connect it to your
dev store.
