/**
 * Map a Tailwind-like `screens` object into container `breakpoints` + order.
 * Framework-agnostic: no Tailwind import — any `{ name: minWidth }` map works.
 */
export type ScreenValue = string | {
    min?: string;
    max?: string;
    raw?: string;
} | Array<string | {
    min?: string;
    max?: string;
    raw?: string;
}>;
export type ScreensMap = Record<string, ScreenValue>;
/**
 * Extract a min-width length from a Tailwind screen value.
 * Returns `null` for max-only / raw queries (not usable in a min-width ladder).
 */
export declare const screenMinWidth: (value: ScreenValue) => string | null;
export type BreakpointsFromScreensResult = {
    breakpoints: Record<string, string>;
    /** Object-key order from `screens` (Tailwind screen order). */
    breakpointOrder: string[];
};
/**
 * Convert `theme.screens` (or any compatible map) into container breakpoint
 * options you can spread into `defineContainer`:
 *
 * ```ts
 * defineContainer({
 *   ...breakpointsFromScreens(defaultScreens),
 *   sizes: { wide: { base: "72rem", xmd: "80rem" } },
 * })
 * ```
 */
export declare const breakpointsFromScreens: (screens: ScreensMap) => BreakpointsFromScreensResult;
//# sourceMappingURL=breakpointsFromScreens.d.ts.map