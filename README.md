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
| Handwriting image `sizes` that can easily go stale after a layout change | `container.contentBoxWidth("wide", "xl")` builds the expression from the same config |
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

### Full / align

- `.cntr-full`: edge to edge (no measure max-width). Padding is opt-in — pair with `px-cntr-pad` / `px-gutter-*` when you want inset content on a full-bleed band.
- `.align-start` / `.align-end` / `.align-start-{name}` / `.align-end-{name}`: positioning modifiers — un-center a measure and flush it to a size's gutter. Pair with a measure class, e.g. `cntr align-start-wide` (default max-width, flush to the wide band's start edge).

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
import { createContainerTailwindPlugin } from "@cloakui/container/tailwind";
plugins: [createContainerTailwindPlugin(container.config)];
```

```ts
// Tailwind v4 (or no Tailwind): write measure CSS + @theme tokens in a prebuild step
import { writeContainerCss } from "@cloakui/container/node";
writeContainerCss(container, "src/container.generated.css", { theme: true });
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

4. Read the same numbers from JS when you need them (image `sizes`, layout math, …):

```ts
container.className("wide"); // "cntr-wide"
container.width("wide", "xl"); // "84rem"
container.contentBoxWidth("wide", "xl");
// → calc(min(84rem, 100vw) - calc(1.5rem * 2))
```

See [Dynamic image `sizes`](#dynamic-image-sizes) when CMS blocks drive the page.

## Dynamic image `sizes`

`contentBoxWidth()` returns a CSS length for the content box of a measure at a breakpoint — the same width the section actually uses on screen (measure minus horizontal padding, clamped to the viewport). You can drop that into an `<img sizes="…">` attribute so the browser picks a sensible `srcset` candidate.

This pattern assumes a **CMS-driven frontend**: the page is assembled from a JSON tree of blocks, each block declares (or inherits) a container size, and nested images can read that parent width to determine its own slot size.

The example below uses [`@cloakui/block-renderer`](https://github.com/cloak-labs/cloakui-block-renderer), our framework-agnostic block renderer: you map block types to components and optional **data routers** that turn CMS block JSON into component props (including `sizes` for images).

```ts
// container.ts
import { defineContainer } from "@cloakui/container";

export const container = defineContainer({
  sizes: {
    default: { base: "56rem", "2xl": "64rem" },
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
  },
  padding: { base: "1rem", sm: "1.5rem" },
});
```

```ts
// blocks/imageDataRouter.ts
import { container } from "../container";

/**
 * CMS image block JSON → <img> props.
 * `block.data.container` is the parent section's measure (e.g. "wide" / "full"),
 * set in the CMS when the editor picks a container width.
 */
export function imageDataRouter(block: {
  attrs?: { align?: string; src?: string; alt?: string };
}) {
  const size = block.data.container ?? "default"; // "wide" | "full" | "default" | …

  // One length per major step; this is a trivial example on purpose (you might want a more elaborate solution here).
  const sizes = [
    `(max-width: 1023px) ${container.contentBoxWidth(size, "base")}`,
    `(max-width: 1279px) ${container.contentBoxWidth(size, "lg")}`,
    container.contentBoxWidth(size, "xl"),
  ].join(", ");

  return {
    src: block.data?.src,
    alt: block.data?.alt ?? "",
    sizes,
  };
}
```

```ts
// blocks/renderer.ts
import { BlockRenderer } from "@cloakui/block-renderer";
import { Image } from "../components/Image";
import { imageDataRouter } from "./imageDataRouter";

export const renderer = new BlockRenderer({
  blocks: {
    "core/image": {
      component: Image,
      dataRouter: imageDataRouter,
    },
    // …other CMS block types
  },
});

// Later, with CMS JSON:
// renderer.render(page.blocks)
```

When the CMS block sits in a `wide` section, `sizes` tracks the wide measure; when the design tokens change in `defineContainer`, image candidates follow without hunting string literals.

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
| `selectors` | `:root`, `#root` | Where CSS variables are attached. |

## Classes and tokens

### Classes

| Class | Role |
|-------|------|
| `cntr` / `cntr-{name}` | Measure (centers, max-width, padding). Named sizes use `--cntr-width-{name}`; `--cntr-width` always stays the default measure. |
| `cntr-full` | Full viewport width (padding opt-in via utilities; no nest pad reset) |
| `align-start` / `align-end` / `align-*-{name}` | Flush a measure to a size's start/end edge (pair with `cntr` / `cntr-{name}`) |
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

`--cntr-vw` is the viewport reference gutters use (`100vw` by default). Do not use `100%` here — percentage resolves against the containing block of the element that applies the gutter (e.g. `padding-left`), which collapses edge gutters inside nested or measure-sized parents.

### Optional: container queries

If a panel establishes a CSS containment context and gutters should track that width instead of the viewport:

```css
@import "@cloakui/container/cq.css";
```

The host needs `container-type`. See comments in `cq.css`.

## Tailwind v3

```ts
// tailwind.config.ts
import { createContainerTailwindPlugin } from "@cloakui/container/tailwind";
import { container } from "./container";

plugins: [createContainerTailwindPlugin(container.config)];
```

That registers tokens and emits base CSS. Tokens only:

```ts
createContainerTailwindPlugin({ config: container.config, emitBaseCss: false });
```

## Tailwind v4

Same config as v3; emit CSS instead of using the JS plugin.

```ts
// scripts/emit-container-css.ts (or any prebuild)
import { writeContainerCss } from "@cloakui/container/node";
import { container } from "../src/container";

writeContainerCss(container, "src/container.generated.css", { theme: true });
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
export default createContainerTailwindPlugin(container.config);
```

```css
@plugin "./container.tailwind.ts";
```

## License

LGPL-3.0-only
