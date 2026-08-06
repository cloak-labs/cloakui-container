import { orderedBreakpoints, resolveAtBreakpoint } from "./resolve";
import { type ToCssOptions } from "./toCss";
import type { ContainerBreakpoint, ContainerSizeName, DefineContainerOptions, ResolvedContainerConfig } from "./types";
export type ContainerInstance = {
    config: ResolvedContainerConfig;
    className: (size?: ContainerSizeName | string | null) => string;
    width: (size?: string | null, breakpoint?: ContainerBreakpoint) => string;
    paddingTotal: (breakpoint?: ContainerBreakpoint) => string;
    contentBoxWidth: (size?: string | null, breakpoint?: ContainerBreakpoint) => string;
    cssVariables: Record<string, string>;
    /** Measure CSS. Pass `{ theme: true }` to also emit a Tailwind v4 `@theme` block. */
    toCss: (options?: ToCssOptions) => string;
    /** Tailwind v4 `@theme` tokens only (`px-cntr-pad`, `max-w-cntr`, …). */
    toThemeCss: () => string;
};
/**
 * Define a project-level container configuration. The returned instance is the
 * single source of truth for CSS variables, utility theme tokens, and JS width
 * reads (e.g. responsive image `sizes`).
 *
 * Browser-safe: no Node or Tailwind imports. For build tooling use
 * `@cloakui/container/tailwind` (`createContainerTailwindPlugin`) and
 * `@cloakui/container/node` (`writeContainerCss`).
 */
export declare const defineContainer: (options?: DefineContainerOptions) => ContainerInstance;
export { orderedBreakpoints, resolveAtBreakpoint };
//# sourceMappingURL=defineContainer.d.ts.map