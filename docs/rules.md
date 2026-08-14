# Project Rules — Always Follow

These rules apply to every task in this project, for every session, without exception. If a
request conflicts with a rule below, stop and flag the conflict instead of silently picking one
side.

## 1. Design tokens are law
- Every color, font, weight, and font-size used in Liquid/CSS must come from
  [design.md](design.md). Never hardcode a hex value, px size, or font-family that isn't already
  in that file.
- If a client screenshot implies a new value (a 4th color, an odd font size, a different font),
  don't approximate it silently — flag the discrepancy and ask whether to update design.md or
  match it to the nearest existing token.

## 2. No section gets built without a screenshot
- Each section is designed by the client via screenshot, sent one at a time. Do not invent
  layout, spacing, or content structure for a section that hasn't been shown yet.
- When a screenshot arrives: identify the closest existing Dawn section/snippet to extend before
  building a new one from scratch. Reuse Dawn's schema/block patterns wherever the layout allows.
- Custom padding/spacing requests (a specific section, block, or element needing something
  different from the global page/section spacing in design.md) are in scope — implement them
  directly, don't punt them back. Use literal px values consistent with the 3-breakpoint system
  (design.md), scope the override to that specific section/element (not global.css) unless it's
  clearly a sitewide pattern, and if the same custom value ends up reused across multiple
  sections, promote it into design.md as a real token instead of repeating a magic number.

## 3. Ask before each step — no batching ahead
- Work proceeds one numbered step at a time (see PRD.md). Before starting a step, state what
  you're about to build/change in 1-3 sentences and wait for explicit go-ahead.
- Never silently chain multiple PRD steps together in one turn, even if the next step seems
  obvious.

## 4. Dawn conventions, not custom architecture
- Stay on Online Store 2.0 patterns: JSON templates, `{% schema %}`-driven sections and blocks,
  merchant-editable settings for anything a client might reasonably want to change themselves.
- Section-scoped CSS goes in that section's `{% stylesheet %}` tag (Dawn 2.0 pattern), not
  crammed into a global stylesheet — keeps unrelated pages from downloading unused CSS.
- Shared tokens/utilities (type scale, color variables) live once in `base.css`, per design.md.
- Blocks are for content a merchant genuinely wants to add/remove/reorder independently — don't
  over-fragment (e.g. no separate blocks for things that always appear together). Scope settings
  to the block they affect, not the whole section, so the editor sidebar stays clean.
- Only add app-block support to a section when there's a real reason (e.g. reviews, upsells) —
  don't scatter app-block slots everywhere "just in case."

## 5. Breakpoints
- Mobile `< 750px`, tablet `750–989px`, desktop `≥ 990px` — matches Dawn's existing CSS. Never
  introduce a different breakpoint set.

## 6. Accessibility & contrast (Shopify Theme Store bar — build to it even though we're not submitting)
- Respect the contrast rules in design.md (`#997A51` is not valid as small body text on white).
  Ratios: standard text ≥ 4.5:1, large text (24px+) ≥ 3:1, icons/input borders ≥ 3:1. Never
  convey information (errors, stock status) by color alone.
- Maintain real heading hierarchy (one `h1` per page, no skipped levels for styling reasons).
- All images need real `alt` text; decorative images get `alt=""`. Never leave alt text to
  default to the filename.
- Interactive elements keep visible, consistent focus states — never remove outline without a
  replacement. Tab/Shift+Tab order must follow DOM order; no positive `tabindex`, no `autofocus`.
- Enter/Space activate buttons and menu items; Esc closes modals/dropdowns/drawers.
- Primary touch targets (nav links, buttons, close icons, product option pills) are minimum
  44×44px.
- Forms: every input has a real `<label for>`, required fields use the `required` attribute,
  validation errors are announced to screen readers (`aria-describedby`, `aria-live`).
- Collapsible UI (accordions, mobile nav, filters) uses `aria-expanded` + `aria-controls`;
  navigation is wrapped in `<nav>`; the active nav item gets `aria-current`.
- Include a skip-to-main-content link (Dawn ships one — don't remove it).

## 7. Performance
- Lazy-load below-the-fold images (`loading="lazy"`); the LCP image (hero/first product image)
  should NOT be lazy-loaded and should get `fetchpriority="high"` instead.
- Keep the `dm_sans` font to the 3 weights actually used (n4/n5/n6) — no extra weights added on
  request without checking design.md first.
- Don't add a section's JS/CSS to pages that don't use that section (Online Store 2.0 lets a
  disabled section still ship its assets if wired wrong — verify it doesn't).
- Minimize JavaScript; prefer native HTML/CSS behavior over adding a library. Apps (Judge.me,
  Search & Discovery) are the single biggest real-world cause of Core Web Vitals regressions on
  Shopify — after installing one, verify it isn't injecting scripts on pages it doesn't run on.
- Run `shopify theme check` before considering any step "done."

## 8. Store & theme safety
- Never edit the client's live/published theme directly. Work via `shopify theme dev` locally,
  push as a new **unpublished** theme, and let the client preview before they publish it
  themselves.
- Don't touch product/collection/customer data via the CLI or admin without being asked —
  this project is theme-only unless explicitly scoped otherwise.

## 9. Reviews & delivery estimate features
- Reviews/ratings: Judge.me app blocks only. Don't hand-roll a custom review system.
- Delivery estimate: driven by the `custom.processing_days` (and related) product metafields
  defined in PRD.md — don't hardcode delivery text per product.

## 10. When in doubt
- Prefer asking a short, specific question over guessing and building the wrong thing —
  rebuilding a full section after a wrong guess costs more than one clarifying question.
