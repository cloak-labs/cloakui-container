import { builtinClassMap } from "./defaults";
import {
  ladderOrder,
  measureClassName,
  orderedBreakpoints,
  resolveAtBreakpoint,
  resolveContainerConfig,
} from "./resolve";
import { toCss, toCssVariables } from "./toCss";
import { createContainerTailwindPlugin } from "./tailwindPlugin";
import type {
  ContainerBreakpoint,
  ContainerSizeName,
  DefineContainerOptions,
  ResolvedContainerConfig,
} from "./types";

export type ContainerInstance = {
  config: ResolvedContainerConfig;
  className: (size?: ContainerSizeName | string | null) => string;
  width: (
    size?: string | null,
    breakpoint?: ContainerBreakpoint,
  ) => string;
  paddingTotal: (breakpoint?: ContainerBreakpoint) => string;
  contentBoxWidth: (
    size?: string | null,
    breakpoint?: ContainerBreakpoint,
  ) => string;
  cssVariables: Record<string, string>;
  toCss: () => string;
  tailwindPlugin: () => ReturnType<typeof createContainerTailwindPlugin>;
};

/**
 * Define a project-level container configuration. The returned instance is the
 * single source of truth for CSS variables, utility theme tokens, and JS width
 * reads (e.g. responsive image `sizes`).
 */
export const defineContainer = (
  options: DefineContainerOptions = {}
): ContainerInstance => {
  const config = resolveContainerConfig(options);
  const order = ladderOrder(config.breakpointOrder);

  const className = (size?: ContainerSizeName | string | null): string => {
    if (size == null || size === "") {
      return builtinClassMap.default;
    }
    if (size in builtinClassMap) {
      return builtinClassMap[size as keyof typeof builtinClassMap];
    }
    // Open sizes (configured or pass-through for WP / project-specific names)
    return measureClassName(size);
  };

  const width = (
    size?: string | null,
    breakpoint: ContainerBreakpoint = "base"
  ): string => {
    if (size === "full") return "100vw";
    const name =
      !size || size === "none" || size === "center" || size === "left" || size === "right"
        ? "default"
        : size;
    const def = config.sizes[name] ?? config.sizes.default;
    return resolveAtBreakpoint(def.width, breakpoint, order);
  };

  const paddingTotal = (
    breakpoint: ContainerBreakpoint = "base"
  ): string => {
    const pad = resolveAtBreakpoint(config.padding, breakpoint, order);
    return `calc(${pad} * 2)`;
  };

  /** Viewport reference matching `--cntr-vw` (compensation off → 100%). */
  const viewportRef = (): string =>
    config.scrollbarCompensation === false ? "100%" : "100vw";

  const contentBoxWidth = (
    size?: string | null,
    breakpoint: ContainerBreakpoint = "base"
  ): string => {
    if (size === "full") {
      return viewportRef();
    }
    const maxWidth = width(size, breakpoint);
    const padTotal = paddingTotal(breakpoint);
    return `calc(min(${maxWidth}, ${viewportRef()}) - ${padTotal})`;
  };

  const instance: ContainerInstance = {
    config,
    className,
    width,
    paddingTotal,
    contentBoxWidth,
    get cssVariables() {
      return toCssVariables(config);
    },
    toCss: () => toCss(config),
    tailwindPlugin: () => createContainerTailwindPlugin(config),
  };

  return instance;
};

export { orderedBreakpoints, resolveAtBreakpoint };
