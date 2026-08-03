import {
  gutterVarName,
  nonDefaultSizeNames,
  sizeNames,
  widthVarName,
} from "./resolve";
import type { ResolvedContainerConfig } from "./types";

/** Gutter formula for a width var + shared padding vars. */
export const gutterCalc = (widthVar: string): string =>
  `max(calc((var(--cntr-vw) - var(${widthVar}) + var(--cntr-padding-total)) / 2), var(--cntr-padding))`;

export const baseContainerVariables = (
  config: ResolvedContainerConfig
): Record<string, string> => {
  const compensation = config.scrollbarCompensation;
  const vars: Record<string, string> = {
    "--sidebar-w": config.sidebarWidth,
    "--scrollbar-w": compensation === false ? "0px" : compensation,
    "--cntr-vw":
      compensation === false
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
      if (bp === "base" || value == null) continue;
      if (name === "default") {
        vars[`--cntr-width-${bp}`] = value;
      } else {
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
    if (bp === "base" || value == null) continue;
    vars[`--cntr-padding-${bp}`] = value;
  }

  const startGutter = gutterVarName(config.startEndAlignSize);
  vars["--cntr-start-gutter"] = `var(${startGutter})`;
  vars["--cntr-end-gutter"] = `var(${startGutter})`;
  // Back-compat
  vars["--cntr-start-right-margin"] = "var(--cntr-start-gutter)";

  return vars;
};

export const cssVariablesObjectToString = (
  vars: Record<string, string>
): string =>
  Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

export { nonDefaultSizeNames };
