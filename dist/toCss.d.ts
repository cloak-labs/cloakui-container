import type { ResolvedContainerConfig } from "./types";
/**
 * Emit CSS custom-property rules, context merges, and size classes.
 *
 * Context maps merge onto the global ladder. When a context only overrides
 * `base`, later breakpoints re-assert the merged (inherited) value on the
 * same specificity tier so global xl/2xl steps are not frozen.
 */
export declare const toCss: (config: ResolvedContainerConfig) => string;
export declare const toCssVariables: (config: ResolvedContainerConfig) => Record<string, string>;
//# sourceMappingURL=toCss.d.ts.map