import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { breakpointsFromScreens } from "./breakpointsFromScreens";
import { defineContainer } from "./defineContainer";
import { writeContainerCss } from "./writeContainerCss";

describe("defineContainer", () => {
  it("supplies only a default size preset when sizes are omitted", () => {
    const container = defineContainer();
    assert.equal(container.width("default"), "56rem");
    assert.equal(container.width("default", "2xl"), "64rem");
    assert.equal(container.width("full"), "100vw");
    assert.ok(!container.config.sizes.wide);
    assert.ok(!container.cssVariables["--cntr-width-wide"]);
  });

  it("maps sizes to cntr class names", () => {
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "72rem" },
      },
    });
    assert.equal(container.className("default"), "cntr");
    assert.equal(container.className("wide"), "cntr-wide");
    assert.equal(container.className("full"), "cntr-full");
    assert.equal(container.className("none"), "");
    assert.equal(container.className("narrow"), "cntr-narrow");
  });

  it("supports open custom size names", () => {
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        narrow: { base: "42rem" },
        wide: { base: "72rem" },
      },
    });
    assert.equal(container.className("narrow"), "cntr-narrow");
    assert.equal(container.width("narrow"), "42rem");
    const css = container.toCss();
    assert.match(css, /\.cntr-narrow/);
    assert.match(css, /--cntr-width-narrow:\s*42rem/);
    assert.match(css, /--cntr-gutter-narrow:/);
    assert.doesNotMatch(css, /max-w-cntr-pad/);
  });

  it("omits wide tokens when wide is not configured", () => {
    const container = defineContainer();
    const css = container.toCss();
    assert.doesNotMatch(css, /--cntr-width-wide/);
    assert.doesNotMatch(css, /\.cntr-wide/);
    assert.ok(!container.cssVariables["--cntr-width-wide"]);
  });

  it("context base-only override still tracks global xl step", () => {
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: {
          base: "72rem",
          xl: "84rem",
          "2xl": "96rem",
        },
      },
      contexts: {
        "project-page": {
          sizes: { wide: { base: "94rem" } },
        },
      },
    });

    const css = container.toCss();
    // Base context override
    assert.match(css, /\.project-page[\s\S]*--cntr-width-wide:\s*94rem/);
    // Unlock at xl: re-assert merged 84rem on context selector inside media
    assert.match(
      css,
      /@media \(min-width: 1280px\)[\s\S]*\.project-page[\s\S]*--cntr-width-wide:\s*84rem/,
    );
  });

  it("applies size-level padding only on that measure class", () => {
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: {
          width: { base: "72rem" },
          padding: { base: "2rem", sm: "2.5rem" },
        },
      },
    });
    const css = container.toCss();
    assert.match(
      css,
      /\.cntr-wide \{\n(?:[^\n]*\n)*?  --cntr-padding:\s*2rem;/,
    );
    assert.match(
      css,
      /@media \(min-width: 640px\) \{\n\.cntr-wide \{\n  --cntr-padding:\s*2\.5rem;/,
    );
    // Default measure must not set a local padding override or rescope --cntr-width
    assert.match(
      css,
      /\.cntr \{\n  width: 100%;\n  max-width: var\(--cntr-width\);/,
    );
    assert.doesNotMatch(css, /\.cntr \{\n(?:[^\n]*\n)*?  --cntr-width:/);
  });

  it("emits widthMode min rules", () => {
    const css = defineContainer({
      sizes: { default: { base: "56rem" } },
      widthMode: "min",
    }).toCss();
    assert.match(
      css,
      /width:\s*min\(var\(--cntr-width\),\s*calc\(100% - \(var\(--cntr-padding\) \* 2\)\)\)/,
    );
    assert.match(css, /max-width:\s*none/);
  });

  it("defaults scrollbar compensation off (--cntr-vw: 100vw)", () => {
    const vars = defineContainer().cssVariables;
    assert.equal(vars["--cntr-vw"], "100vw");
    assert.equal(vars["--scrollbar-w"], "0px");
  });

  it("enables scrollbar compensation when requested", () => {
    const vars = defineContainer({
      scrollbarCompensation: true,
    }).cssVariables;
    assert.equal(vars["--scrollbar-w"], "17px");
    assert.equal(
      vars["--cntr-vw"],
      "calc(100vw - var(--sidebar-w) - var(--scrollbar-w))",
    );
  });

  it("builds content-box width with viewport semantics", () => {
    const withWide = {
      sizes: {
        default: { base: "56rem" },
        wide: { base: "72rem", xl: "76rem" },
      },
    } as const;

    const off = defineContainer(withWide);
    assert.equal(
      off.contentBoxWidth("wide", "xl"),
      "calc(min(76rem, 100vw) - calc(1.5rem * 2))",
    );
    assert.equal(off.contentBoxWidth("full"), "100vw");

    const on = defineContainer({
      ...withWide,
      scrollbarCompensation: true,
    });
    assert.equal(
      on.contentBoxWidth("wide", "xl"),
      "calc(min(76rem, 100vw) - calc(1.5rem * 2))",
    );
    assert.equal(on.contentBoxWidth("full"), "100vw");
  });

  it("emits derived gutter CSS variables", () => {
    const vars = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "72rem" },
      },
    }).cssVariables;
    assert.equal(vars["--cntr-width"], "56rem");
    assert.equal(vars["--cntr-width-wide"], "72rem");
    assert.equal(vars["--cntr-padding"], "1rem");
    assert.ok(vars["--cntr-gutter"]);
    assert.ok(vars["--cntr-gutter-wide"]);
  });

  it('warns when a configured container width is "100%"', () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.join(" "));
    };

    try {
      defineContainer({
        sizes: {
          default: { base: "56rem" },
          wide: { base: "100vw", xl: "100%" },
        },
        contexts: {
          project: {
            sizes: {
              wide: { width: { base: "100%" } },
            },
          },
        },
      });
    } finally {
      console.warn = originalWarn;
    }

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Use "100vw" instead/);
    assert.match(warnings[0], /sizes\.wide\.xl/);
    assert.match(warnings[0], /contexts\.project\.sizes\.wide\.base/);
  });

  it("uses content-box gutter math for fixed and viewport widths", () => {
    const vars = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "100vw" },
      },
    }).cssVariables;

    assert.equal(
      vars["--cntr-gutter-wide"],
      "max(calc((var(--cntr-vw) - var(--cntr-width-wide) + var(--cntr-padding-total)) / 2), var(--cntr-padding))",
    );
  });

  it("measure classes use size width vars without rescoping --cntr-width", () => {
    const css = defineContainer({
      sizes: {
        default: { base: "56rem", "2xl": "64rem" },
        wide: { base: "72rem" },
      },
    }).toCss();
    assert.match(
      css,
      /\.cntr-wide \{\n  width: 100%;\n  max-width: var\(--cntr-width-wide\);/,
    );
    assert.doesNotMatch(css, /\.cntr-wide \{[^}]*--cntr-width:/);
  });

  it("emits compositional align-start / align-end modifiers", () => {
    const css = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "72rem" },
      },
    }).toCss();
    assert.match(
      css,
      /\.align-start \{\n  margin-inline-start: var\(--cntr-gutter\);\n  margin-inline-end: auto;\n  padding-inline-start: 0;\n  width: auto;/,
    );
    assert.match(
      css,
      /\.align-start-wide \{\n  margin-inline-start: var\(--cntr-gutter-wide\);\n  margin-inline-end: auto;\n  padding-inline-start: 0;\n  width: auto;/,
    );
    assert.match(
      css,
      /\.align-end-wide \{\n  margin-inline-start: auto;\n  margin-inline-end: var\(--cntr-gutter-wide\);\n  padding-inline-end: 0;\n  width: auto;/,
    );
    // Nested inside a measure: zero page-edge inset
    assert.match(
      css,
      /\.cntr-wide \.align-start-wide \{\n  margin-inline-start: 0;/,
    );
    assert.doesNotMatch(css, /\.cntr-start\b/);
    assert.doesNotMatch(css, /--cntr-start-gutter/);
  });

  it("supports custom ladder steps like xmd", () => {
    const container = defineContainer({
      breakpoints: {
        sm: "640px",
        md: "768px",
        xmd: "940px",
        lg: "1024px",
      },
      sizes: {
        default: { base: "56rem" },
        wide: {
          base: "72rem",
          xmd: "80rem",
          lg: "84rem",
        },
      },
    });

    assert.deepEqual(container.config.breakpointOrder, [
      "sm",
      "md",
      "xmd",
      "lg",
      "xl",
      "2xl",
    ]);
    assert.equal(container.width("wide", "xmd"), "80rem");
    assert.equal(container.width("wide", "md"), "72rem"); // inherit base
    assert.equal(container.width("wide", "lg"), "84rem");
    assert.match(
      container.toCss(),
      /@media \(min-width: 940px\)[\s\S]*--cntr-width-wide:\s*80rem/,
    );
  });

  it("breakpointsFromScreens preserves screen key order including custom 3xl", () => {
    const synced = breakpointsFromScreens({
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1925px",
    });
    assert.deepEqual(synced.breakpointOrder, [
      "sm",
      "md",
      "lg",
      "xl",
      "2xl",
      "3xl",
    ]);

    const container = defineContainer({
      ...synced,
      sizes: {
        default: { base: "56rem", "3xl": "70rem" },
      },
    });
    assert.equal(container.config.breakpoints["3xl"], "1925px");
    assert.equal(container.width("default", "3xl"), "70rem");
    assert.ok(container.config.breakpointOrder.includes("3xl"));
  });

  it("throws when a size step has no breakpoint", () => {
    assert.throws(
      () =>
        defineContainer({
          sizes: {
            default: { base: "56rem", tablet: "60rem" },
          },
          breakpoints: {
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
          },
        }),
      /missing breakpoints: tablet/,
    );
  });

  it("emits Tailwind v4 @theme tokens from config sizes", () => {
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "72rem" },
        narrow: { base: "42rem" },
      },
    });

    const theme = container.toThemeCss();
    assert.match(theme, /@theme \{/);
    assert.match(theme, /--spacing-cntr-pad:\s*var\(--cntr-padding\)/);
    assert.match(theme, /--spacing-gutter:\s*var\(--cntr-gutter\)/);
    assert.match(theme, /--spacing-gutter-wide:\s*var\(--cntr-gutter-wide\)/);
    assert.match(
      theme,
      /--spacing-gutter-narrow:\s*var\(--cntr-gutter-narrow\)/,
    );
    assert.match(theme, /--width-cntr:\s*var\(--cntr-width\)/);
    assert.match(theme, /--width-cntr-wide:\s*var\(--cntr-width-wide\)/);
    assert.match(
      theme,
      /--max-width-cntr-narrow:\s*var\(--cntr-width-narrow\)/,
    );

    const combined = container.toCss({ theme: true });
    assert.match(combined, /\.cntr \{/);
    assert.match(combined, /@theme \{/);
    assert.match(combined, /--spacing-gutter-wide:/);

    const measureOnly = container.toCss();
    assert.doesNotMatch(measureOnly, /@theme/);
  });

  it("plugin emits size max-width on .cntr-wide without rescoping --cntr-width", async () => {
    const { createContainerTailwindPlugin } = await import("./tailwindPlugin");
    const container = defineContainer({
      sizes: {
        default: { base: "56rem" },
        wide: { base: "76rem" },
      },
    });
    const plugin = createContainerTailwindPlugin(container.config);
    const components: Record<string, Record<string, string>> = {};
    // Invoke the plugin handler the same way Tailwind does.
    const handler =
      (plugin as { handler?: Function }).handler ??
      (plugin as { (): { handler: Function } })().handler;
    // tailwindcss/plugin returns a function with handler + config
    const pluginFn = plugin as unknown as {
      handler: (api: { addBase: Function; addComponents: Function }) => void;
    };
    pluginFn.handler({
      addBase: () => {},
      addComponents: (
        rules:
          | Record<string, Record<string, string>>
          | Array<Record<string, Record<string, string>>>,
      ) => {
        const list = Array.isArray(rules) ? rules : [rules];
        for (const group of list) {
          Object.assign(components, group);
        }
      },
    });
    assert.equal(
      components[".cntr-wide"]?.["max-width"],
      "var(--cntr-width-wide)",
    );
    assert.equal(components[".cntr-wide"]?.["--cntr-width"], undefined);
    assert.equal(components[".cntr"]?.["max-width"], "var(--cntr-width)");
  });

  it("writeContainerCss writes combined CSS to disk", () => {
    const dir = mkdtempSync(join(tmpdir(), "cloakui-container-"));
    const file = join(dir, "container.generated.css");
    try {
      const container = defineContainer({
        sizes: {
          default: { base: "56rem" },
          wide: { base: "72rem" },
        },
      });
      writeContainerCss(container, file, { theme: true });
      const written = readFileSync(file, "utf8");
      assert.match(written, /--cntr-width-wide:\s*72rem/);
      assert.match(written, /@theme \{/);
      assert.match(written, /--max-width-cntr-wide:/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
