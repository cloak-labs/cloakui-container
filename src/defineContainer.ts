import { builtinClassMap } from "./defaults";
import {
  ladderOrder,
  measureClassName,
  orderedBreakpoints,
  resolveAtBreakpoint,
  resolveContainerConfig,
} from "./resolve";
import { toCss, toCssVariables, type ToCssOptions } from "./toCss";
import { toThemeCss } from "./themeTokens";
import { createContainerTailwindPlugin } from "./tailwindPlugin";
import { writeContainerCss } from "./writeContainerCss";
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
  /** Measure CSS. Pass `{ theme: true }` to also emit a Tailwind v4 `@theme` block. */
  toCss: (options?: ToCssOptions) => string;
  /** Tailwind v4 `@theme` tokens only (`px-cntr-pad`, `max-w-cntr`, …). */
  toThemeCss: () => string;
  /**
   * Write `toCss()` output to a file (Node prebuild). Same options as `toCss`.
   */
  writeCss: (filePath: string, options?: ToCssOptions) => void;
  tailwindPlugin: () => ReturnType<typeof createContainerTailwindPlugin>;
};

/**
 * Define a project-level container configuration. The returned instance is the
 * single source of truth for CSS variables, utility theme tokens, and JS width
 * reads (e.g. responsive image `sizes`).
 */
export const defineContainer = (
  options: DefineContainerOptions = {},
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
    return measureClassName(size);
  };

  const width = (
    size?: string | null,
    breakpoint: ContainerBreakpoint = "base",
  ): string => {
    if (size === "full") return "100vw";
    const name =
      !size ||
      size === "none" ||
      size === "center" ||
      size === "left" ||
      size === "right"
        ? "default"
        : size;
    const def = config.sizes[name] ?? config.sizes.default;
    return resolveAtBreakpoint(def.width, breakpoint, order);
  };

  const paddingTotal = (
    breakpoint: ContainerBreakpoint = "base",
  ): string => {
    const pad = resolveAtBreakpoint(config.padding, breakpoint, order);
    return `calc(${pad} * 2)`;
  };

  const viewportRef = (): string =>
    config.scrollbarCompensation === false ? "100%" : "100vw";

  const contentBoxWidth = (
    size?: string | null,
    breakpoint: ContainerBreakpoint = "base",
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
    toCss: (cssOptions) => toCss(config, cssOptions),
    toThemeCss: () => toThemeCss(config),
    writeCss: (filePath, cssOptions) =>
      writeContainerCss(instance, filePath, cssOptions),
    tailwindPlugin: () => createContainerTailwindPlugin(config),
  };

  return instance;
};

export { orderedBreakpoints, resolveAtBreakpoint };
