# `@cloakui/container`

One config for how wide content sits on a marketing or content site, and everything that depends on that width stays in sync.

Most content sites end up with the same mess: a hero at `max-w-6xl`, a blog body at `max-w-3xl`, a "wide" gallery that almost matches the hero, mixed `px-4` / `px-6` padding, and `<img sizes="…">` values that were typed once and never updated. Change the content width later and you are grepping half the repo.

This package puts container widths (and the padding beside them) in a small JS config. From that you get:

- CSS classes and variables for every section
- Gutters that track those widths (edge alignment, full-bleed math)
- The same numbers in JavaScript, enabling some complex stuff; eg. responsive image `sizes` can be dynamically generated based on the parent container's width (assuming you're rendering a dynamic tree of UI blocks coming from a CMS as JSON), and auto-correct when the layout changes

Works with or without Tailwind.

## Who it's for

- Marketing sites, brochure sites, blogs, portfolios, and case-study sites
- Design systems where the content column and the wide band should be shared tokens, not one-off utilities
- Sites with lots of CMS-driven sections that need the same widths in CSS and in image `sizes`

It is usually overkill for app chrome (dashboards, settings) where layout is mostly grids and panels, not a reading measure.

## Why bother

| Pain | What this gives you |
|------|---------------------|
| Every section invents its own `max-width` | Named sizes reused as `.cntr`, `.cntr-wide`, and so on |
| Padding differs from block to block | One padding ladder (`--cntr-padding`) shared by measure classes and `px-cntr-pad` |
| Full-bleed / edge-aligned pieces do not line up | Gutters derived from width + padding (`px-gutter`, `px-gutter-wide`) |
| Tweaking sitewide width means a repo-wide hunt | Change `defineContainer({ sizes })` once; CSS and JS both read it |
| Image `sizes` go stale after a redesign | `container.contentBoxWidth("wide", "xl")` builds the expression from the same config |
| Nested containers double-pad | Nest rules collapse inner padding when a measure sits inside another |

## Concepts (read this first)

Skim these once. The rest of the docs assume them.

### Measure

The content column: a centered block with a max width and horizontal padding. That is what most people mean by "the container."

```html
<section class="cntr">…</section>        <!-- default measure -->
<section class="cntr-wide">…</section>   <!-- wider measure -->
```

### Sizes

Named measures in your config. `default` is required (or you get the package default). Every other name is yours: `wide`, `narrow`, `prose`, `gallery`, whatever. Each one becomes `.cntr-{name}` and `--cntr-width-{name}`.

### Padding vs gutter

- **Padding** (`--cntr-padding` / `px-cntr-pad`): space inside the measure so text does not hit the viewport edge on small screens.
- **Gutter** (`--cntr-gutter` / `px-gutter`): space outside a narrower band, used to line things up with the measure's edges (side-aligned media, full-bleed breakouts). It is computed from viewport, measure width, and padding. You do not maintain it by hand.

### Ladder (responsive steps)

Widths and padding can change as the viewport grows:

```ts
default: { base: "56rem", "2xl": "64rem" }
```

- `base` applies from 0px up
- `2xl` applies from the `2xl` breakpoint threshold up (see below)

Omitted steps inherit the previous value (mobile-first).

### Breakpoints

Keys like `sm`, `xl`, or `2xl` in a size map are labels, not Tailwind APIs. Each label maps to a min-width in your `breakpoints` config and becomes a normal CSS `@media (min-width: …)`.

**For Tailwind users**: if Tailwind's `2xl` screen is `1536px`, your container `breakpoints["2xl"]` should be `1536px` too. Otherwise `2xl:` utilities and container media queries disagree. Use `breakpointsFromScreens(theme.screens)` to keep them aligned, including any custom screens/breakpoints you add.

### Full / start / end

- `.cntr-full`: edge to edge (no measure max-width)
- `.cntr-start` / `.cntr-end`: align to one side; the gutter comes from the `startEndAlignSize` option (usually `default`)

### One config, three outputs

```text
defineContainer({ … })
        ├─► CSS   (variables, .cntr-*, gutters, media queries)
        ├─► JS    (.width(), .contentBoxWidth(), .className())
        └─► TW    (optional plugin → spacing / max-width tokens)
```

## Install

```bash
pnpm add @cloakui/container
```

## Quick start

1. Define the site's containers (one module, import everywhere):

```ts
// container.ts
import { defineContainer } from "@cloakui/container";

export const container = defineContainer({
  sizes: {
    // Reading column; grows a bit on very large screens
    default: { base: "56rem", "2xl": "64rem" },
    // Wide band for heroes / media (any extra name is fine)
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
  },
  padding: {
    base: "1rem", // phones
    sm: "1.5rem", // from the sm breakpoint up
  },
});
```

2. Load the CSS

Static helpers (pad utilities, full/start/end, print polish):

```css
@import "@cloakui/container/styles.css";
```

Generated measure CSS (variables, `.cntr` / `.cntr-wide`, gutters, breakpoints). Pick one path:

```ts
// Tailwind v3: the plugin emits it for you
plugins: [container.tailwindPlugin()];
```

```ts
// Tailwind v4 (or no Tailwind): write measure CSS + @theme tokens in a prebuild step
container.writeCss("src/container.generated.css", { theme: true });
```

```css
@import "./container.generated.css";
```

3. Use it in markup

```html
<section class="cntr">
  <h1>Article title</h1>
  <p>…</p>
</section>

<section class="cntr-wide">
  <!-- wider band -->
</section>

<div class="cntr-full px-cntr-pad">
  <!-- full bleed, same horizontal padding token -->
</div>
```

4. Use the same numbers in JS (for example image `sizes`):

```ts
container.className("wide"); // "cntr-wide"
container.width("wide", "xl"); // "84rem"
container.contentBoxWidth("wide", "xl");
// → calc(min(84rem, 100%) - calc(1.5rem * 2))
```

## Config reference

### Sizes

`default` is the only required size. Every other key is custom: name it whatever you want. Each custom name becomes `.cntr-{name}` and `--cntr-width-{name}`. Most sites only require the built-in "default" (think blog post content) and "full", plus an additional custom size for wider content (think landing page sections).

```ts
sizes: {
  default: { base: "56rem", "2xl": "64rem" }, // required
  wide: { base: "72rem", xl: "84rem" },       // optional, name is yours
  narrow: { base: "42rem" },                  // → .cntr-narrow
  prose: { base: "40rem" },                   // → .cntr-prose
}
```

If you omit `sizes` entirely, the package supplies only a `default` preset. Any other size (`wide`, `narrow`, …) is always user-provided. If you pass `sizes` without `default`, you still get the package `default` width for that key.

Optional per-size padding (only that measure gets a different pad):

```ts
wide: {
  width: { base: "72rem" },
  padding: { base: "2rem" },
}
```

### Breakpoints

Package defaults match Tailwind's default screens: `sm`, `md`, `lg`, `xl`, and `2xl`. Add any other steps yourself (for example a custom `3xl`).

Sync from your Tailwind screens in one spread:

```ts
import { breakpointsFromScreens, defineContainer } from "@cloakui/container";

export const container = defineContainer({
  ...breakpointsFromScreens(theme.screens),
  sizes: {
    default: { base: "56rem", "2xl": "64rem" },
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
  },
});
```

Or set thresholds by hand:

```ts
breakpoints: {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  "3xl": "1920px", // your custom screen, not a Tailwind default
},
```

If you omit `breakpointOrder`, steps are sorted by ascending min-width. Prefer `breakpointsFromScreens` when you care about matching Tailwind's screen key order.

| Goal | How |
|------|-----|
| Change where a step fires | Set that key in `breakpoints` |
| Add a custom step (for example `3xl`) | Put it in `breakpoints`, then use it in `sizes` / `padding` |
| Match Tailwind screen order | Spread `breakpointsFromScreens(theme.screens)` |

### Contexts

Page-level overrides that merge onto the global ladder. The context name is a CSS class on your root selector (note the leading `.` in markup):

```ts
contexts: {
  "project-page": {
    sizes: { wide: { base: "94rem" } },
  },
}
```

```html
<div id="root" class="project-page">…</div>
```

That matches `#root.project-page` (and any other selector you listed in `selectors`). Later breakpoints still follow the global ladder unless you override those steps too.

### Other knobs

| Option | Default | Meaning |
|--------|---------|---------|
| `widthMode` | `"max"` | `"max"`: `width: 100%; max-width: var(--cntr-width)`. `"min"`: width is `min(measure, 100% - pad)`. |
| `scrollbarCompensation` | off | When on, `--cntr-vw` subtracts scrollbar width and optional `sidebarWidth`. |
| `startEndAlignSize` | `"default"` | Which size's gutter feeds `.cntr-start` / `.cntr-end`. Use `"wide"` if start/end should line up with the wide band. |
| `selectors` | `:root`, `#root` | Where CSS variables are attached. |

## Classes and tokens

### Classes

| Class | Role |
|-------|------|
| `cntr` / `cntr-{name}` | Measure (centers, max-width, padding). Named sizes rescope `--cntr-width` for nested gutters. |
| `cntr-full` | Full viewport width |
| `cntr-start` / `cntr-end` | Start/end aligned band |
| `max-w-cntr` / `max-w-cntr-{name}` | Max-width only |
| `px-cntr-pad`, `pl-cntr-pad`, … | Inner padding token |
| `px-gutter`, `px-gutter-{name}`, … | Edge gutters |

Prefer `w-full px-cntr-pad` when you want full width with the shared pad token.

### Tailwind theme tokens (v3 plugin)

| Token | Scale | Utilities |
|-------|-------|-----------|
| `cntr-pad` | spacing | `px-cntr-pad`, `right-cntr-pad`, … |
| `gutter` / `gutter-{name}` | spacing | `px-gutter`, `px-gutter-wide`, … |
| `cntr` / `cntr-{name}` | width / maxWidth | `w-cntr`, `max-w-cntr-wide`, … |

`--cntr-vw` is the viewport reference gutters use (`100%` by default).

### Optional: container queries

If a panel establishes a CSS containment context and gutters should track that width instead of the viewport:

```css
@import "@cloakui/container/cq.css";
```

The host needs `container-type`. See comments in `cq.css`.

## Tailwind v3

```ts
// tailwind.config.ts
plugins: [container.tailwindPlugin()];
```

That registers tokens and emits base CSS. Tokens only:

```ts
container.tailwindPlugin({ emitBaseCss: false });
```

## Tailwind v4

Same config as v3; emit CSS instead of using the JS plugin.

```ts
// scripts/emit-container-css.ts (or any prebuild)
import { container } from "../src/container";

container.writeCss("src/container.generated.css", { theme: true });
```

```css
@import "tailwindcss";
@import "@cloakui/container/styles.css";
@import "./container.generated.css";
```

`{ theme: true }` appends a Tailwind v4 `@theme` block for `px-cntr-pad`, `max-w-cntr`, `px-gutter-{name}`, and every other size token from your config. No hand-written `@theme` maps.

Other helpers:

- `container.toCss({ theme: true })`: same string without writing a file
- `container.toThemeCss()`: `@theme` block only

Escape hatch if you still want the v3-style plugin under v4:

```ts
// container.tailwind.ts
import { container } from "./container";
export default container.tailwindPlugin();
```

```css
@plugin "./container.tailwind.ts";
```

## License

LGPL-3.0-only
