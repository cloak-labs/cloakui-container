import { defaultBreakpointOrder, ladderOrder, orderedBreakpoints } from "./breakpoints";
import type { ContainerBreakpoint, ContainerSizeDef, DefineContainerOptions, RequiredResponsiveLength, ResolvedContainerConfig, ResolvedSizeDef, ResponsiveLength } from "./types";
export { orderedBreakpoints, defaultBreakpointOrder, ladderOrder };
export declare const mergeResponsiveLength: (defaults: ResponsiveLength, overrides?: ResponsiveLength) => RequiredResponsiveLength;
export declare const isSizeObject: (def: ContainerSizeDef) => def is {
    width: ResponsiveLength;
    padding?: ResponsiveLength;
};
export declare const normalizeSizeDef: (def: ContainerSizeDef, widthFallback?: RequiredResponsiveLength) => ResolvedSizeDef;
export declare const sizeNames: (config: ResolvedContainerConfig) => string[];
export declare const nonDefaultSizeNames: (config: ResolvedContainerConfig) => string[];
export declare const widthVarName: (sizeName: string) => string;
export declare const gutterVarName: (sizeName: string) => string;
export declare const measureClassName: (sizeName: string) => string;
export declare const resolveContainerConfig: (options?: DefineContainerOptions) => ResolvedContainerConfig;
/**
 * Resolve a mobile-first responsive map at a breakpoint by walking backwards
 * until a defined value is found.
 *
 * Pass `order` (including `base`) from `ladderOrder(config.breakpointOrder)`
 * when using custom steps like `xmd`.
 */
export declare const resolveAtBreakpoint: (values: ResponsiveLength, breakpoint?: ContainerBreakpoint, order?: readonly string[]) => string;
/** Merge override map onto base; omitted breakpoints keep base values. */
export declare const mergeSizeDef: (base: ResolvedSizeDef, override?: ContainerSizeDef) => ResolvedSizeDef;
//# sourceMappingURL=resolve.d.ts.map