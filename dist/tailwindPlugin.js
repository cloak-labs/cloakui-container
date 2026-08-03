import plugin from "tailwindcss/plugin";
import { baseContainerVariables } from "./cssVariables";
import { ladderOrder, mergeResponsiveLength, mergeSizeDef, nonDefaultSizeNames, resolveAtBreakpoint, resolveContainerConfig, sizeNames, widthVarName, } from "./resolve";
import { toSizeCss } from "./sizesCss";
function themeExtensions(resolved) {
    const spacing = {
        "cntr-pad": "var(--cntr-padding)",
        gutter: "var(--cntr-gutter)",
    };
    const maxWidth = {
        cntr: "var(--cntr-width)",
    };
    const width = {
        cntr: "var(--cntr-width)",
    };
    for (const name of nonDefaultSizeNames(resolved)) {
        spacing[`gutter-${name}`] = `var(--cntr-gutter-${name})`;
        maxWidth[`cntr-${name}`] = `var(--cntr-width-${name})`;
        width[`cntr-${name}`] = `var(--cntr-width-${name})`;
    }
    // Legacy alias used by agency kit during migration
    if (resolved.sizes.wide) {
        spacing["gutter-wide"] = spacing["gutter-wide"] ?? "var(--cntr-gutter-wide)";
    }
    return { spacing, maxWidth, width };
}
function isResolved(config) {
    const sizes = config.sizes;
    const defaultSize = sizes?.default;
    return (defaultSize != null &&
        typeof defaultSize === "object" &&
        "width" in defaultSize &&
        typeof defaultSize.width?.base === "string" &&
        typeof config.widthMode === "string" &&
        Array.isArray(config.breakpointOrder));
}
function rootDeclsAtBreakpoint(config, bp) {
    const decls = {};
    if (config.padding[bp] != null) {
        decls["--cntr-padding"] = config.padding[bp];
    }
    for (const name of sizeNames(config)) {
        const size = config.sizes[name];
        if (size.width[bp] != null) {
            decls[widthVarName(name)] = size.width[bp];
        }
    }
    return decls;
}
/**
 * Context ladder merge: emit overrides when merged differs from root, and
 * re-assert merged values at later breakpoints so a base-only context override
 * cannot freeze via higher specificity.
 */
function emitContextBase(addBase, config) {
    const order = ladderOrder(config.breakpointOrder);
    for (const [contextName, context] of Object.entries(config.contexts)) {
        const contextSelectors = config.selectors
            .map((sel) => `${sel}.${contextName}`)
            .join(", ");
        const mergedPadding = context.padding
            ? mergeResponsiveLength(config.padding, context.padding)
            : config.padding;
        const mergedSizes = {};
        for (const name of sizeNames(config)) {
            mergedSizes[name] = mergeSizeDef(config.sizes[name], context.sizes?.[name]);
        }
        const baseOverridden = new Set();
        for (const name of sizeNames(config)) {
            if (mergedSizes[name].width.base !== config.sizes[name].width.base) {
                baseOverridden.add(widthVarName(name));
            }
        }
        if (mergedPadding.base !== config.padding.base) {
            baseOverridden.add("--cntr-padding");
        }
        const baseDecls = {};
        if (mergedPadding.base !== config.padding.base) {
            baseDecls["--cntr-padding"] = mergedPadding.base;
        }
        for (const name of sizeNames(config)) {
            const rootBase = config.sizes[name].width.base;
            const ctxBase = mergedSizes[name].width.base;
            if (ctxBase !== rootBase) {
                baseDecls[widthVarName(name)] = ctxBase;
            }
        }
        if (Object.keys(baseDecls).length) {
            addBase({ [contextSelectors]: baseDecls });
        }
        for (const bp of config.breakpointOrder) {
            const decls = {};
            const rootPad = resolveAtBreakpoint(config.padding, bp, order);
            const ctxPad = resolveAtBreakpoint(mergedPadding, bp, order);
            if (ctxPad !== rootPad || baseOverridden.has("--cntr-padding")) {
                decls["--cntr-padding"] = ctxPad;
            }
            for (const name of sizeNames(config)) {
                const wVar = widthVarName(name);
                const rootW = resolveAtBreakpoint(config.sizes[name].width, bp, order);
                const ctxW = resolveAtBreakpoint(mergedSizes[name].width, bp, order);
                if (ctxW !== rootW || baseOverridden.has(wVar)) {
                    decls[wVar] = ctxW;
                }
            }
            if (!Object.keys(decls).length)
                continue;
            const min = config.breakpoints[bp];
            addBase({
                [`@media (min-width: ${min})`]: {
                    [contextSelectors]: decls,
                },
            });
        }
    }
}
function parseSizeCssToComponents(css) {
    const components = {};
    const ruleRe = /([^{]+)\{([^}]*)\}/g;
    let match;
    while ((match = ruleRe.exec(css))) {
        const selector = match[1].trim();
        const body = match[2];
        if (!selector || selector.startsWith("@"))
            continue;
        const decls = {};
        for (const line of body.split(";")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("/*"))
                continue;
            const colon = trimmed.indexOf(":");
            if (colon === -1)
                continue;
            const prop = trimmed.slice(0, colon).trim();
            const value = trimmed.slice(colon + 1).trim();
            if (prop && value)
                decls[prop] = value;
        }
        if (Object.keys(decls).length) {
            components[selector] = decls;
        }
    }
    return components;
}
/**
 * Tailwind plugin: dynamic theme tokens per configured size, optional base CSS
 * (vars, context ladder, measure classes / gutters with widthMode).
 */
export function createContainerTailwindPlugin(configOrOptions = {}, maybeOptions) {
    let resolved;
    let emitBaseCss = true;
    if (configOrOptions &&
        typeof configOrOptions === "object" &&
        ("emitBaseCss" in configOrOptions ||
            ("config" in configOrOptions && !("sizes" in configOrOptions)))) {
        const opts = configOrOptions;
        emitBaseCss = opts.emitBaseCss ?? true;
        const raw = opts.config ?? {};
        resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
    }
    else if (maybeOptions) {
        emitBaseCss = maybeOptions.emitBaseCss ?? true;
        const raw = configOrOptions;
        resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
    }
    else {
        const raw = configOrOptions;
        resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
    }
    const theme = themeExtensions(resolved);
    return plugin(({ addBase, addComponents }) => {
        if (!emitBaseCss)
            return;
        const selectorList = resolved.selectors.join(", ");
        addBase({
            [selectorList]: baseContainerVariables(resolved),
        });
        for (const bp of resolved.breakpointOrder) {
            const decls = rootDeclsAtBreakpoint(resolved, bp);
            if (!Object.keys(decls).length)
                continue;
            const min = resolved.breakpoints[bp];
            addBase({
                [`@media (min-width: ${min})`]: {
                    [selectorList]: decls,
                },
            });
        }
        for (const name of sizeNames(resolved)) {
            const size = resolved.sizes[name];
            if (!size.padding)
                continue;
            const cls = name === "default" ? ".cntr" : `.cntr-${name}`;
            for (const bp of resolved.breakpointOrder) {
                if (size.padding[bp] == null)
                    continue;
                const min = resolved.breakpoints[bp];
                addBase({
                    [`@media (min-width: ${min})`]: {
                        [cls]: { "--cntr-padding": size.padding[bp] },
                    },
                });
            }
        }
        emitContextBase(addBase, resolved);
        const sizeCss = toSizeCss(resolved);
        addComponents(parseSizeCssToComponents(sizeCss));
    }, {
        theme: {
            extend: theme,
        },
    });
}
/** @deprecated Prefer `createContainerTailwindPlugin` */
export const containerTailwindPlugin = createContainerTailwindPlugin;
export default createContainerTailwindPlugin;
