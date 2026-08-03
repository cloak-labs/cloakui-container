# `@cloakui/container`

Framework-agnostic container layout primitives. A JS config (`defineContainer`) is the single source of truth for max-widths, padding, CSS variables, and image `sizes` math.

## Install

```bash
pnpm add @cloakui/container
```

## Quick start

```ts
import { defineContainer } from "@cloakui/container";

export const container = defineContainer({
  sizes: {
    default: { base: "56rem", "2xl": "64rem" },
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
    narrow: { base: "42rem" }, // any name → .cntr-narrow
  },
  padding: { base: "1rem", sm: "1.5rem" },
  widthMode: "max", // or "min"
  scrollbarCompensation: false, // opt-in: true | "17px"
  startEndAlignSize: "default", // or "wide" for agency start/end gutters
});

container.className("wide"); // "cntr-wide"
container.width("wide", "xl"); // "84rem"
container.contentBoxWidth("wide", "xl"); // calc(...) for <img sizes>
```

### CSS

```css
@import "@cloakui/container/styles.css";
```

Static pad / full / start-end / print utilities live in `styles.css`. Measure classes (`.cntr`, `.cntr-{name}`), gutters, and CSS variables are emitted by `container.toCss()` or the Tailwind plugin.

Optional container-query viewport (host must set `container-type`):

```css
@import "@cloakui/container/cq.css";
```

### Tailwind v3

```ts
// tailwind.config.ts
plugins: [container.tailwindPlugin()];
```

That registers theme tokens **and** emits the generated CSS (vars, media queries, measure classes). Pass `{ emitBaseCss: false }` if you only want tokens and inject `container.toCss()` yourself.

Theme tokens:

| Token | Scale | CSS var | Utilities |
|-------|-------|---------|-----------|
| `cntr-pad` | spacing | `--cntr-padding` | `px-cntr-pad`, `right-cntr-pad`, … |
| `gutter` | spacing | `--cntr-gutter` | `px-gutter`, `pl-gutter`, … |
| `gutter-{name}` | spacing | `--cntr-gutter-{name}` | `px-gutter-wide`, … |
| `cntr` / `cntr-{name}` | maxWidth / width | `--cntr-width(-{name})` | `max-w-cntr`, `w-cntr`, … |

Use `w-full px-cntr-pad` instead of the removed `max-w-cntr-pad`.

Viewport reference is `--cntr-vw` (`100%` by default; compensated `100vw - sidebar - scrollbar` when enabled). `--100vw` aliases `--cntr-vw` during migration.

## Breakpoints

Keys like `sm`, `xl`, `2xl`, and custom names such as `xmd` in `sizes` / `padding` are **not** Tailwind APIs by themselves. They are labels on a mobile-first ladder. At build time, each key becomes a plain CSS media query using the min-width from `breakpoints`:

```ts
defineContainer({
  sizes: {
    default: {
      base: "56rem", // no media query — applies from 0 up
      xmd: "60rem", // @media (min-width: <breakpoints.xmd>)
      "2xl": "64rem", // @media (min-width: <breakpoints["2xl"]>)
    },
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    xmd: "940px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    "3xl": "1925px",
  },
  // optional — object key order from Tailwind screens; otherwise sorted by min-width
  // breakpointOrder: ["sm", "md", "xmd", "lg", "xl", "2xl", "3xl"],
});
```

So `sizes.default["2xl"]` means “from the `2xl` threshold upward”, not “use Tailwind’s `2xl:` variant.” Keep `breakpoints` in sync with your CSS framework screens.

### Without Tailwind

No Tailwind required. Pass any `breakpoints` map (and optional `breakpointOrder`). Call `container.toCss()` and import it next to `styles.css`. Output is ordinary `:root` variables + `@media (min-width: …)` rules.

### Tailwind ergonomics

Sync screens in one spread (recommended):

```ts
import { breakpointsFromScreens, defineContainer } from "@cloakui/container";
// or: import { breakpointsFromScreens } from "@cloakui/container/tailwind";

defineContainer({
  ...breakpointsFromScreens({
    xs: "475px",
    sm: "640px",
    md: "768px",
    xmd: "940px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    "3xl": "1925px",
  }),
  sizes: {
    wide: { base: "72rem", xmd: "80rem", xl: "84rem" },
  },
});
```

`breakpointsFromScreens` is framework-agnostic (no Tailwind import) — it only needs a `{ name: minWidth }` map shaped like `theme.screens`.

| Goal | How |
|------|-----|
| Change where a step fires | Override that key in `breakpoints` |
| Add `xmd` / `xs` / etc. | Include it in `breakpoints` (or `breakpointsFromScreens`) and use it in `sizes` / `padding` |
| Keep order aligned with Tailwind | Spread `breakpointsFromScreens(theme.screens)` so `breakpointOrder` matches screen key order |
| Omit order | Keys are sorted by ascending min-width (`xmd` at `940px` lands between `md` and `lg`) |

## Classes

| Class | Role |
|-------|------|
| `cntr` / `cntr-{name}` / `cntr-full` | Primary containers (named sizes rescope `--cntr-width`) |
| `cntr-start` / `cntr-end` | Start/end-aligned content width |
| `max-w-cntr` / `max-w-cntr-{name}` | Max-width helpers |
| `px-cntr-pad`, `pl-cntr-pad`, … | Container inner padding |
| `px-gutter`, `px-gutter-{name}`, … | Alignment gutters |

## Tailwind v4

The v3 JS plugin is optional. In v4’s CSS-first setup, treat `defineContainer` as a **CSS generator** and (if you want utilities) wire tokens in `@theme`.

**Works without a plugin:** vars, measure classes, gutters, nest rules, and `@media` ladders via `container.toCss()` + `styles.css`.

**Still needs a hand-off for utilities:** `px-cntr-pad` / `max-w-cntr` / etc. are not invented by importing CSS vars alone. Declare them in `@theme`, *or* load a small project plugin with `@plugin` (v4 can still run v3-style plugins).

```css
/* app.css */
@import "tailwindcss";
@import "@cloakui/container/styles.css";
@import "./container.generated.css"; /* from the build step below */

@theme {
  --spacing-cntr-pad: var(--cntr-padding);
  --spacing-gutter: var(--cntr-gutter);
  --spacing-gutter-wide: var(--cntr-gutter-wide);
  --width-cntr: var(--cntr-width);
  --width-cntr-wide: var(--cntr-width-wide);
  --max-width-cntr: var(--cntr-width);
  --max-width-cntr-wide: var(--cntr-width-wide);
}
```

```ts
// scripts/emit-container-css.ts (or any prebuild step)
import { writeFileSync } from "node:fs";
import { container } from "../src/container";

writeFileSync("src/container.generated.css", container.toCss());
```

Optional plugin path (tokens + emitted CSS in one shot) — export a *configured* instance; the package export is a factory, not your project config:

```ts
// container.tailwind.ts
import { container } from "./container";
export default container.tailwindPlugin();
```

```css
@plugin "./container.tailwind.ts";
```

Keep ladder thresholds in sync with `@theme (--breakpoint-*)` via `breakpointsFromScreens` (or a manual `breakpoints` map). The package does not read Tailwind’s theme at build time on its own.

## License

LGPL-3.0-only
