import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defineContainer } from "./defineContainer";
describe("defineContainer", () => {
    it("resolves default widths matching legacy agency defaults", () => {
        const container = defineContainer();
        assert.equal(container.width("default"), "56rem");
        assert.equal(container.width("default", "2xl"), "64rem");
        assert.equal(container.width("wide"), "72rem");
        assert.equal(container.width("wide", "xl"), "76rem");
        assert.equal(container.width("wide", "2xl"), "86rem");
        assert.equal(container.width("full"), "100vw");
    });
    it("maps sizes to cntr class names", () => {
        const container = defineContainer();
        assert.equal(container.className("default"), "cntr");
        assert.equal(container.className("wide"), "cntr-wide");
        assert.equal(container.className("full"), "cntr-full");
        assert.equal(container.className("left"), "cntr-start");
        assert.equal(container.className("right"), "cntr-end");
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
        const container = defineContainer({
            sizes: {
                default: { base: "56rem", "2xl": "64rem" },
            },
        });
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
        assert.match(css, /@media \(min-width: 1280px\)[\s\S]*\.project-page[\s\S]*--cntr-width-wide:\s*84rem/);
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
        assert.match(css, /\.cntr-wide \{\n(?:[^\n]*\n)*?  --cntr-padding:\s*2rem;/);
        assert.match(css, /@media \(min-width: 640px\) \{\n\.cntr-wide \{\n  --cntr-padding:\s*2\.5rem;/);
        // Default measure must not set a local padding override
        assert.match(css, /\.cntr \{\n  \/\* rescope[\s\S]*?\n  --cntr-width: var\(--cntr-width\);\n  --cntr-start-gutter:/);
    });
    it("emits widthMode min rules", () => {
        const css = defineContainer({
            sizes: { default: { base: "56rem" } },
            widthMode: "min",
        }).toCss();
        assert.match(css, /width:\s*min\(var\(--cntr-width\),\s*calc\(100% - \(var\(--cntr-padding\) \* 2\)\)\)/);
        assert.match(css, /max-width:\s*none/);
    });
    it("defaults scrollbar compensation off (--cntr-vw: 100%)", () => {
        const vars = defineContainer().cssVariables;
        assert.equal(vars["--cntr-vw"], "100%");
        assert.equal(vars["--scrollbar-w"], "0px");
        assert.equal(vars["--100vw"], "var(--cntr-vw)");
    });
    it("enables scrollbar compensation when requested", () => {
        const vars = defineContainer({
            scrollbarCompensation: true,
        }).cssVariables;
        assert.equal(vars["--scrollbar-w"], "17px");
        assert.match(vars["--cntr-vw"], /100vw/);
    });
    it("builds content-box width with --cntr-vw semantics", () => {
        const off = defineContainer();
        assert.equal(off.contentBoxWidth("wide", "xl"), "calc(min(76rem, 100%) - calc(1.5rem * 2))");
        assert.equal(off.contentBoxWidth("full"), "100%");
        const on = defineContainer({ scrollbarCompensation: true });
        assert.equal(on.contentBoxWidth("wide", "xl"), "calc(min(76rem, 100vw) - calc(1.5rem * 2))");
        assert.equal(on.contentBoxWidth("full"), "100vw");
    });
    it("emits derived gutter CSS variables", () => {
        const vars = defineContainer().cssVariables;
        assert.equal(vars["--cntr-width"], "56rem");
        assert.equal(vars["--cntr-width-wide"], "72rem");
        assert.equal(vars["--cntr-padding"], "1rem");
        assert.ok(vars["--cntr-gutter"]);
        assert.ok(vars["--cntr-gutter-wide"]);
        assert.equal(vars["--cntr-wide-gutter"], "var(--cntr-gutter-wide)");
        assert.ok(vars["--100vw"]);
    });
    it("uses startEndAlignSize for start/end gutters", () => {
        const def = defineContainer({
            sizes: {
                default: { base: "56rem" },
                wide: { base: "72rem" },
            },
        });
        assert.equal(def.cssVariables["--cntr-start-gutter"], "var(--cntr-gutter)");
        const wideAlign = defineContainer({
            sizes: {
                default: { base: "56rem" },
                wide: { base: "72rem" },
            },
            startEndAlignSize: "wide",
        });
        assert.equal(wideAlign.cssVariables["--cntr-start-gutter"], "var(--cntr-gutter-wide)");
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
            "3xl",
        ]);
        assert.equal(container.width("wide", "xmd"), "80rem");
        assert.equal(container.width("wide", "md"), "72rem"); // inherit base
        assert.equal(container.width("wide", "lg"), "84rem");
        assert.match(container.toCss(), /@media \(min-width: 940px\)[\s\S]*--cntr-width-wide:\s*80rem/);
    });
    it("breakpointsFromScreens preserves Tailwind screen order", async () => {
        const { breakpointsFromScreens } = await import("./breakpointsFromScreens");
        const synced = breakpointsFromScreens({
            xs: "475px",
            sm: "640px",
            md: "768px",
            xmd: "940px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
            "3xl": "1925px",
        });
        assert.deepEqual(synced.breakpointOrder, [
            "xs",
            "sm",
            "md",
            "xmd",
            "lg",
            "xl",
            "2xl",
            "3xl",
        ]);
        const container = defineContainer({
            ...synced,
            sizes: {
                default: { base: "56rem", xmd: "60rem" },
            },
        });
        assert.equal(container.config.breakpoints.xmd, "940px");
        assert.equal(container.width("default", "xmd"), "60rem");
        assert.ok(container.config.breakpointOrder.indexOf("xmd") > container.config.breakpointOrder.indexOf("md"));
        assert.ok(container.config.breakpointOrder.indexOf("xmd") < container.config.breakpointOrder.indexOf("lg"));
    });
    it("throws when a size step has no breakpoint", () => {
        assert.throws(() => defineContainer({
            sizes: {
                default: { base: "56rem", xmd: "60rem" },
            },
            // xmd omitted from breakpoints (and not in defaults)
            breakpoints: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1280px",
                "2xl": "1536px",
                "3xl": "1925px",
            },
        }), /missing breakpoints: xmd/);
    });
});
