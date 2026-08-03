import {
  baseContainerVariables,
  cssVariablesObjectToString,
} from "./cssVariables";
import {
  ladderOrder,
  mergeResponsiveLength,
  mergeSizeDef,
  resolveAtBreakpoint,
  sizeNames,
  widthVarName,
} from "./resolve";
import { toSizeCss } from "./sizesCss";
import { toThemeCss } from "./themeTokens";
import type { ResolvedContainerConfig, ResolvedSizeDef } from "./types";

export type ToCssOptions = {
  /**
   * Append a Tailwind v4 `@theme` block for spacing / width / max-width tokens
   * (`px-cntr-pad`, `max-w-cntr`, …).
   */
  theme?: boolean;
};

const formatRule = (selector: string, decls: Record<string, string>): string => {
  if (!Object.keys(decls).length) return "";
  return `${selector} {\n${cssVariablesObjectToString(decls)}\n}\n`;
};

const rootDeclsAtBreakpoint = (
  config: ResolvedContainerConfig,
  bp: string,
): Record<string, string> => {
  const decls: Record<string, string> = {};
  if (config.padding[bp] != null) {
    decls["--cntr-padding"] = config.padding[bp]!;
  }
  for (const name of sizeNames(config)) {
    const size = config.sizes[name];
    if (size.width[bp] != null) {
      decls[widthVarName(name)] = size.width[bp]!;
    }
  }
  return decls;
};

/**
 * Emit CSS custom-property rules, context merges, and size classes.
 *
 * Context maps merge onto the global ladder. When a context only overrides
 * `base`, later breakpoints re-assert the merged (inherited) value on the
 * same specificity tier so global xl/2xl steps are not frozen.
 */
export const toCss = (
  config: ResolvedContainerConfig,
  options: ToCssOptions = {},
): string => {
  const selectorList = config.selectors.join(",\n");
  const chunks: string[] = [];
  const mediaKeys = config.breakpointOrder;
  const order = ladderOrder(config.breakpointOrder);

  chunks.push(
    formatRule(selectorList, baseContainerVariables(config)).trimEnd(),
  );

  for (const bp of mediaKeys) {
    const decls = rootDeclsAtBreakpoint(config, bp);
    if (!Object.keys(decls).length) continue;
    const min = config.breakpoints[bp];
    chunks.push(
      `@media (min-width: ${min}) {\n${formatRule(selectorList, decls).trimEnd()}\n}`,
    );
  }

  // Per-size padding responsive steps on measure classes
  for (const name of sizeNames(config)) {
    const size = config.sizes[name];
    if (!size.padding) continue;
    const cls = name === "default" ? ".cntr" : `.cntr-${name}`;
    for (const bp of mediaKeys) {
      if (size.padding[bp] == null) continue;
      const min = config.breakpoints[bp];
      chunks.push(
        `@media (min-width: ${min}) {\n${formatRule(cls, {
          "--cntr-padding": size.padding[bp]!,
        }).trimEnd()}\n}`,
      );
    }
  }

  for (const [contextName, context] of Object.entries(config.contexts)) {
    const contextSelectors = config.selectors
      .map((sel) => `${sel}.${contextName}`)
      .join(",\n");

    const mergedPadding = context.padding
      ? mergeResponsiveLength(config.padding, context.padding)
      : config.padding;

    const mergedSizes: Record<string, ResolvedSizeDef> = {};
    for (const name of sizeNames(config)) {
      mergedSizes[name] = mergeSizeDef(
        config.sizes[name],
        context.sizes?.[name],
      );
    }

    const baseOverridden = new Set<string>();
    for (const name of sizeNames(config)) {
      if (mergedSizes[name].width.base !== config.sizes[name].width.base) {
        baseOverridden.add(widthVarName(name));
      }
    }
    if (mergedPadding.base !== config.padding.base) {
      baseOverridden.add("--cntr-padding");
    }

    const baseDecls: Record<string, string> = {};
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
      chunks.push(formatRule(contextSelectors, baseDecls).trimEnd());
    }

    for (const bp of mediaKeys) {
      const decls: Record<string, string> = {};
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
      if (!Object.keys(decls).length) continue;
      const min = config.breakpoints[bp];
      chunks.push(
        `@media (min-width: ${min}) {\n${formatRule(contextSelectors, decls).trimEnd()}\n}`,
      );
    }
  }

  chunks.push(toSizeCss(config).trimEnd());

  if (options.theme) {
    chunks.push(toThemeCss(config).trimEnd());
  }

  return chunks.filter(Boolean).join("\n\n") + "\n";
};

export const toCssVariables = (
  config: ResolvedContainerConfig,
): Record<string, string> => baseContainerVariables(config);
