import { gutterVarName, nonDefaultSizeNames, sizeNames, widthVarName, } from "./resolve";
/** Gutter formula for a width var + shared padding vars. */
export const gutterCalc = (widthVar) => `max(calc((var(--cntr-vw) - var(${widthVar}) + var(--cntr-padding-total)) / 2), var(--cntr-padding))`;
export const baseContainerVariables = (config) => {
    const compensation = config.scrollbarCompensation;
    const vars = {
        "--sidebar-w": config.sidebarWidth,
        "--scrollbar-w": compensation === false ? "0px" : compensation,
        "--cntr-vw": compensation === false
            ? "100%"
            : "calc(100vw - var(--sidebar-w) - var(--scrollbar-w))",
        // Back-compat alias used by agency CSS during migration
        "--100vw": "var(--cntr-vw)",
        "--cntr-padding": config.padding.base,
        "--cntr-padding-total": "calc(var(--cntr-padding) * 2)",
    };
    for (const name of sizeNames(config)) {
        const size = config.sizes[name];
        const wVar = widthVarName(name);
        const gVar = gutterVarName(name);
        vars[wVar] = size.width.base;
        vars[gVar] = gutterCalc(wVar);
        // Ladder intermediates for agency globals.css compatibility
        for (const [bp, value] of Object.entries(size.width)) {
            if (bp === "base" || value == null)
                continue;
            if (name === "default") {
                vars[`--cntr-width-${bp}`] = value;
            }
            else {
                vars[`${wVar}-${bp}`] = value;
            }
        }
    }
    // Legacy alias: --cntr-wide-gutter → --cntr-gutter-wide
    if (config.sizes.wide) {
        vars["--cntr-wide-gutter"] = "var(--cntr-gutter-wide)";
        vars["--cntr-width-wide"] = vars["--cntr-width-wide"] ?? config.sizes.wide.width.base;
    }
    for (const [bp, value] of Object.entries(config.padding)) {
        if (bp === "base" || value == null)
            continue;
        vars[`--cntr-padding-${bp}`] = value;
    }
    const startGutter = gutterVarName(config.startEndAlignSize);
    vars["--cntr-start-gutter"] = `var(${startGutter})`;
    vars["--cntr-end-gutter"] = `var(${startGutter})`;
    // Back-compat
    vars["--cntr-start-right-margin"] = "var(--cntr-start-gutter)";
    return vars;
};
export const cssVariablesObjectToString = (vars) => Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
export { nonDefaultSizeNames };
