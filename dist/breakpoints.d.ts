import type { ResponsiveLength } from "./types";
/** Default step keys (excludes `base`) matching Tailwind's default screens. */
export declare const defaultBreakpointOrder: readonly ["sm", "md", "lg", "xl", "2xl"];
/**
 * Full ladder including `base` — back-compat export for callers that walked a
 * fixed list. Prefer `config.breakpointOrder` / `ladderOrder(config)`.
 */
export declare const orderedBreakpoints: readonly string[];
/** Approximate px for ordering only (`rem`/`em` → ×16). */
export declare const minWidthSortValue: (value: string) => number;
export declare const sortBreakpointKeys: (keys: string[], breakpoints: Record<string, string>) => string[];
/**
 * Resolve mobile-first step order (excludes `base`).
 * Explicit `breakpointOrder` wins; otherwise sort merged keys by min-width.
 */
export declare const resolveBreakpointOrder: (breakpoints: Record<string, string>, explicitOrder?: string[]) => string[];
/** `["base", ...breakpointOrder]` for inheritance walks. */
export declare const ladderOrder: (breakpointOrder: readonly string[]) => string[];
export declare const collectStepKeysFromMaps: (...maps: Array<ResponsiveLength | undefined>) => string[];
/**
 * Ensure every step key used in size/padding maps has a min-width entry.
 */
export declare const assertStepsHaveBreakpoints: (stepKeys: string[], breakpoints: Record<string, string>) => void;
//# sourceMappingURL=breakpoints.d.ts.map