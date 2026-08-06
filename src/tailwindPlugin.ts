import plugin from "tailwindcss/plugin";
import { baseContainerVariables } from "./cssVariables";
import {
  ladderOrder,
  mergeResponsiveLength,
  mergeSizeDef,
  resolveAtBreakpoint,
  resolveContainerConfig,
  sizeNames,
  widthVarName,
} from "./resolve";
import { toSizeCss } from "./sizesCss";
import { themeTokenMaps } from "./themeTokens";
import type {
  DefineContainerOptions,
  ResolvedContainerConfig,
  ResolvedSizeDef,
} from "./types";

export type ContainerTailwindPluginOptions = {
  /** Pre-resolved config, or raw options passed through `resolveContainerConfig`. */
  config?: ResolvedContainerConfig | DefineContainerOptions;
  /** When false, only theme tokens are registered (no base CSS). @default true */
  emitBaseCss?: boolean;
};

function themeExtensions(resolved: ResolvedContainerConfig) {
  return themeTokenMaps(resolved);
}

function isResolved(
  config: ResolvedContainerConfig | DefineContainerOptions,
): config is ResolvedContainerConfig {
  const sizes = (config as ResolvedContainerConfig).sizes;
  const defaultSize = sizes?.default;
  return (
    defaultSize != null &&
    typeof defaultSize === "object" &&
    "width" in defaultSize &&
    typeof (defaultSize as ResolvedSizeDef).width?.base === "string" &&
    typeof (config as ResolvedContainerConfig).widthMode === "string" &&
    Array.isArray((config as ResolvedContainerConfig).breakpointOrder)
  );
}

function rootDeclsAtBreakpoint(
  config: ResolvedContainerConfig,
  bp: string,
): Record<string, string> {
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
}

/**
 * Context ladder merge: emit overrides when merged differs from root, and
 * re-assert merged values at later breakpoints so a base-only context override
 * cannot freeze via higher specificity.
 */
function emitContextBase(
  addBase: (...args: any[]) => void,
  config: ResolvedContainerConfig,
) {
  const order = ladderOrder(config.breakpointOrder);

  for (const [contextName, context] of Object.entries(config.contexts)) {
    const contextSelectors = config.selectors
      .map((sel) => `${sel}.${contextName}`)
      .join(", ");

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
      addBase({ [contextSelectors]: baseDecls });
    }

    for (const bp of config.breakpointOrder) {
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
      addBase({
        [`@media (min-width: ${min})`]: {
          [contextSelectors]: decls,
        },
      });
    }
  }
}

function parseSizeCssToComponents(
  css: string,
): Record<string, Record<string, string>> {
  const components: Record<string, Record<string, string>> = {};
  const ruleRe = /([^{]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRe.exec(css))) {
    const selector = match[1].trim();
    // Strip comments first — a leading `/* ... */` on the same ";" chunk as a
    // declaration would otherwise drop that declaration.
    const body = match[2].replace(/\/\*[\s\S]*?\*\//g, "");
    if (!selector || selector.startsWith("@")) continue;
    const decls: Record<string, string> = {};
    for (const line of body.split(";")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon === -1) continue;
      const prop = trimmed.slice(0, colon).trim();
      const value = trimmed.slice(colon + 1).trim();
      if (prop && value) decls[prop] = value;
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
export function createContainerTailwindPlugin(
  configOrOptions:
    | ResolvedContainerConfig
    | DefineContainerOptions
    | ContainerTailwindPluginOptions = {},
  maybeOptions?: { emitBaseCss?: boolean },
) {
  let resolved: ResolvedContainerConfig;
  let emitBaseCss = true;

  if (
    configOrOptions &&
    typeof configOrOptions === "object" &&
    ("emitBaseCss" in configOrOptions ||
      ("config" in configOrOptions && !("sizes" in configOrOptions)))
  ) {
    const opts = configOrOptions as ContainerTailwindPluginOptions;
    emitBaseCss = opts.emitBaseCss ?? true;
    const raw = opts.config ?? {};
    resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
  } else if (maybeOptions) {
    emitBaseCss = maybeOptions.emitBaseCss ?? true;
    const raw = configOrOptions as
      | ResolvedContainerConfig
      | DefineContainerOptions;
    resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
  } else {
    const raw = configOrOptions as
      | ResolvedContainerConfig
      | DefineContainerOptions;
    resolved = isResolved(raw) ? raw : resolveContainerConfig(raw);
  }

  const theme = themeExtensions(resolved);

  return plugin(
    ({ addComponents }) => {
      if (!emitBaseCss) return;

      // Emit in `@layer components` (via addComponents), not `@layer base`.
      // Agency `shared/styles/base.css` is imported *after* `@tailwind base` and
      // still sets legacy `--cntr-width-wide-2xl: 86rem`; globals.css then assigns
      // `--cntr-width-wide: var(--cntr-width-wide-2xl)` at 2xl. Variables in the
      // components layer beat that base-layer default so project defineContainer
      // widths win. Measure classes belong here anyway.
      const selectorList = resolved.selectors.join(", ");
      addComponents({
        [selectorList]: baseContainerVariables(resolved),
      });

      for (const bp of resolved.breakpointOrder) {
        const decls = rootDeclsAtBreakpoint(resolved, bp);
        if (!Object.keys(decls).length) continue;
        const min = resolved.breakpoints[bp];
        addComponents({
          [`@media (min-width: ${min})`]: {
            [selectorList]: decls,
          },
        });
      }

      for (const name of sizeNames(resolved)) {
        const size = resolved.sizes[name];
        if (!size.padding) continue;
        const cls = name === "default" ? ".cntr" : `.cntr-${name}`;
        for (const bp of resolved.breakpointOrder) {
          if (size.padding[bp] == null) continue;
          const min = resolved.breakpoints[bp];
          addComponents({
            [`@media (min-width: ${min})`]: {
              [cls]: { "--cntr-padding": size.padding[bp]! },
            },
          });
        }
      }

      emitContextBase(addComponents, resolved);

      const sizeCss = toSizeCss(resolved);
      addComponents(parseSizeCssToComponents(sizeCss));
    },
    {
      theme: {
        extend: theme,
      },
    },
  );
}

/** @deprecated Prefer `createContainerTailwindPlugin` */
export const containerTailwindPlugin = createContainerTailwindPlugin;

export default createContainerTailwindPlugin;
