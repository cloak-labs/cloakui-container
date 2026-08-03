import { assertStepsHaveBreakpoints, collectStepKeysFromMaps, defaultBreakpointOrder, ladderOrder, orderedBreakpoints, resolveBreakpointOrder, } from "./breakpoints";
import { defaultContainerConfig } from "./defaults";
export { orderedBreakpoints, defaultBreakpointOrder, ladderOrder };
export const mergeResponsiveLength = (defaults, overrides) => {
    const merged = { ...defaults, ...overrides };
    if (!merged.base) {
        throw new Error("Container responsive length requires a `base` value.");
    }
    return merged;
};
export const isSizeObject = (def) => typeof def === "object" && def !== null && "width" in def;
export const normalizeSizeDef = (def, widthFallback) => {
    if (isSizeObject(def)) {
        return {
            width: mergeResponsiveLength(widthFallback ?? { base: "56rem" }, def.width),
            padding: def.padding,
        };
    }
    return {
        width: mergeResponsiveLength(widthFallback ?? { base: "56rem" }, def),
    };
};
export const sizeNames = (config) => Object.keys(config.sizes);
export const nonDefaultSizeNames = (config) => sizeNames(config).filter((name) => name !== "default");
export const widthVarName = (sizeName) => sizeName === "default" ? "--cntr-width" : `--cntr-width-${sizeName}`;
export const gutterVarName = (sizeName) => sizeName === "default" ? "--cntr-gutter" : `--cntr-gutter-${sizeName}`;
export const measureClassName = (sizeName) => sizeName === "default" ? "cntr" : `cntr-${sizeName}`;
const collectConfigStepKeys = (sizes, padding, contexts) => {
    const maps = [padding];
    for (const size of Object.values(sizes)) {
        maps.push(size.width);
        if (size.padding)
            maps.push(size.padding);
    }
    for (const context of Object.values(contexts ?? {})) {
        if (context.padding)
            maps.push(context.padding);
        for (const def of Object.values(context.sizes ?? {})) {
            if (isSizeObject(def)) {
                maps.push(def.width);
                if (def.padding)
                    maps.push(def.padding);
            }
            else {
                maps.push(def);
            }
        }
    }
    return collectStepKeysFromMaps(...maps);
};
export const resolveContainerConfig = (options = {}) => {
    const padding = mergeResponsiveLength(defaultContainerConfig.padding, options.padding);
    const inputSizes = options.sizes;
    const sizes = {};
    if (!inputSizes || Object.keys(inputSizes).length === 0) {
        for (const [name, def] of Object.entries(defaultContainerConfig.sizes)) {
            sizes[name] = def;
        }
    }
    else {
        sizes.default = normalizeSizeDef(inputSizes.default ?? defaultContainerConfig.sizes.default.width, defaultContainerConfig.sizes.default.width);
        for (const [name, def] of Object.entries(inputSizes)) {
            if (name === "default")
                continue;
            sizes[name] = normalizeSizeDef(def, defaultContainerConfig.sizes[name]?.width);
        }
    }
    let scrollbarCompensation = false;
    if (options.scrollbarCompensation === true) {
        scrollbarCompensation = "17px";
    }
    else if (typeof options.scrollbarCompensation === "string") {
        scrollbarCompensation = options.scrollbarCompensation;
    }
    const startEndAlignSize = options.startEndAlignSize ?? defaultContainerConfig.startEndAlignSize;
    if (!sizes[startEndAlignSize]) {
        throw new Error(`startEndAlignSize "${startEndAlignSize}" is not a configured size.`);
    }
    const breakpoints = {
        ...defaultContainerConfig.breakpoints,
        ...options.breakpoints,
    };
    const stepKeys = collectConfigStepKeys(sizes, padding, options.contexts);
    assertStepsHaveBreakpoints(stepKeys, breakpoints);
    // Explicit order (e.g. from breakpointsFromScreens) wins; otherwise sort by min-width
    // so custom keys like `xmd` slot between `md` and `lg` automatically.
    const breakpointOrder = resolveBreakpointOrder(breakpoints, options.breakpointOrder);
    return {
        sizes,
        padding,
        widthMode: options.widthMode ?? "max",
        scrollbarCompensation,
        sidebarWidth: options.sidebarWidth ?? defaultContainerConfig.sidebarWidth,
        startEndAlignSize,
        contexts: options.contexts ?? {},
        breakpoints,
        breakpointOrder,
        selectors: options.selectors?.length
            ? options.selectors
            : defaultContainerConfig.selectors,
    };
};
/**
 * Resolve a mobile-first responsive map at a breakpoint by walking backwards
 * until a defined value is found.
 *
 * Pass `order` (including `base`) from `ladderOrder(config.breakpointOrder)`
 * when using custom steps like `xmd`.
 */
export const resolveAtBreakpoint = (values, breakpoint = "base", order = orderedBreakpoints) => {
    const start = order.indexOf(breakpoint);
    if (start === -1) {
        const direct = values[breakpoint];
        if (direct != null)
            return direct;
        if (values.base == null) {
            throw new Error(`Unknown breakpoint "${breakpoint}" and responsive length is missing base.`);
        }
        return values.base;
    }
    for (let i = start; i >= 0; i--) {
        const key = order[i];
        const value = values[key];
        if (value != null)
            return value;
    }
    if (values.base == null) {
        throw new Error("Responsive length is missing a base value.");
    }
    return values.base;
};
/** Merge override map onto base; omitted breakpoints keep base values. */
export const mergeSizeDef = (base, override) => {
    if (!override)
        return base;
    const normalized = normalizeSizeDef(override, base.width);
    return {
        width: mergeResponsiveLength(base.width, normalized.width),
        padding: normalized.padding || base.padding
            ? { ...base.padding, ...normalized.padding }
            : undefined,
    };
};
