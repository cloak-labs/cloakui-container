/**
 * Breakpoint step keys used in responsive width/padding maps (mobile-first).
 * Built-in names are suggested for DX; any string is allowed (e.g. `xs`, `xmd`).
 */
export type ContainerBreakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | (string & {});
export type ResponsiveLength = Partial<Record<string, string>> & {
    base?: string;
};
export type RequiredResponsiveLength = ResponsiveLength & {
    base: string;
};
/**
 * A named size: responsive width shorthand, or width + optional padding override.
 */
export type ContainerSizeDef = ResponsiveLength | {
    width: ResponsiveLength;
    padding?: ResponsiveLength;
};
export type ResolvedSizeDef = {
    width: RequiredResponsiveLength;
    padding?: ResponsiveLength;
};
export type ContainerContextConfig = {
    sizes?: Record<string, ContainerSizeDef>;
    padding?: ResponsiveLength;
};
/** Min-width map for named steps (never includes `base`). */
export type ContainerBreakpoints = Record<string, string>;
export type WidthMode = "max" | "min";
export type DefineContainerOptions = {
    /**
     * Named max-widths. `default` is required (via defaults if omitted).
     * Other keys (e.g. `wide`, `narrow`) become `.cntr-{name}` / `--cntr-width-{name}`.
     */
    sizes?: Record<string, ContainerSizeDef>;
    /** Global horizontal padding inside measure classes. */
    padding?: ResponsiveLength;
    /**
     * How measure classes constrain width.
     * - `max` (default): `width: 100%; max-width: var(--cntr-width)`
     * - `min`: `width: min(var(--cntr-width), 100% - 2*pad); max-width: none`
     */
    widthMode?: WidthMode;
    /**
     * Opt-in scrollbar compensation for viewport units.
     * `false` (default) → `--cntr-vw: 100%`
     * `true` → use `"17px"`; or pass an explicit length string.
     */
    scrollbarCompensation?: boolean | string;
    /** Sidebar width used when scrollbar compensation is on. */
    sidebarWidth?: string;
    /**
     * Size name whose gutter aligns `cntr-start` / `cntr-end`.
     * @default "default"
     */
    startEndAlignSize?: string;
    /**
     * Named context overrides (e.g. `project-page`). Maps merge onto global
     * ladders so omitting a breakpoint inherits the global step.
     */
    contexts?: Record<string, ContainerContextConfig>;
    /**
     * Min-width thresholds for step keys used in `sizes` / `padding`.
     * Merged onto package defaults. Use `breakpointsFromScreens()` to sync
     * Tailwind `theme.screens` (including custom keys like `xmd`).
     */
    breakpoints?: ContainerBreakpoints;
    /**
     * Mobile-first order of step keys (excludes `base`).
     * When omitted, keys are ordered by ascending min-width.
     * Prefer the order from `breakpointsFromScreens()` when using Tailwind.
     */
    breakpointOrder?: string[];
    /**
     * Selectors that receive container CSS variables.
     * @default [":root", "#root"]
     */
    selectors?: string[];
};
export type ResolvedContainerConfig = {
    sizes: Record<string, ResolvedSizeDef> & {
        default: ResolvedSizeDef;
    };
    padding: RequiredResponsiveLength;
    widthMode: WidthMode;
    scrollbarCompensation: string | false;
    sidebarWidth: string;
    startEndAlignSize: string;
    contexts: Record<string, ContainerContextConfig>;
    /** Min-width per step key (no `base`). */
    breakpoints: ContainerBreakpoints;
    /** Ascending step keys used when emitting media queries (no `base`). */
    breakpointOrder: string[];
    selectors: string[];
};
/** Built-in size names used by CMS align mapping helpers. */
export type ContainerSizeName = "default" | "wide" | "full" | "left" | "right" | "center" | "none" | (string & {});
//# sourceMappingURL=types.d.ts.map