import { builtinClassMap } from "./defaults";
import { ladderOrder, measureClassName, orderedBreakpoints, resolveAtBreakpoint, resolveContainerConfig, } from "./resolve";
import { toCss, toCssVariables } from "./toCss";
import { createContainerTailwindPlugin } from "./tailwindPlugin";
/**
 * Define a project-level container configuration. The returned instance is the
 * single source of truth for CSS variables, utility theme tokens, and JS width
 * reads (e.g. responsive image `sizes`).
 */
export const defineContainer = (options = {}) => {
    const config = resolveContainerConfig(options);
    const order = ladderOrder(config.breakpointOrder);
    const className = (size) => {
        if (size == null || size === "") {
            return builtinClassMap.default;
        }
        if (size in builtinClassMap) {
            return builtinClassMap[size];
        }
        // Open sizes (configured or pass-through for WP / project-specific names)
        return measureClassName(size);
    };
    const width = (size, breakpoint = "base") => {
        if (size === "full")
            return "100vw";
        const name = !size || size === "none" || size === "center" || size === "left" || size === "right"
            ? "default"
            : size;
        const def = config.sizes[name] ?? config.sizes.default;
        return resolveAtBreakpoint(def.width, breakpoint, order);
    };
    const paddingTotal = (breakpoint = "base") => {
        const pad = resolveAtBreakpoint(config.padding, breakpoint, order);
        return `calc(${pad} * 2)`;
    };
    /** Viewport reference matching `--cntr-vw` (compensation off → 100%). */
    const viewportRef = () => config.scrollbarCompensation === false ? "100%" : "100vw";
    const contentBoxWidth = (size, breakpoint = "base") => {
        if (size === "full") {
            return viewportRef();
        }
        const maxWidth = width(size, breakpoint);
        const padTotal = paddingTotal(breakpoint);
        return `calc(min(${maxWidth}, ${viewportRef()}) - ${padTotal})`;
    };
    const instance = {
        config,
        className,
        width,
        paddingTotal,
        contentBoxWidth,
        get cssVariables() {
            return toCssVariables(config);
        },
        toCss: () => toCss(config),
        tailwindPlugin: () => createContainerTailwindPlugin(config),
    };
    return instance;
};
export { orderedBreakpoints, resolveAtBreakpoint };
