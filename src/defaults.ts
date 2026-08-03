import type { ResolvedContainerConfig } from "./types";

/** Defaults matching a typical content + wide layout (WP-friendly preset). */
export const defaultContainerConfig: ResolvedContainerConfig = {
  sizes: {
    default: {
      width: {
        base: "56rem", // max-w-4xl
        "2xl": "64rem", // max-w-5xl
      },
    },
    wide: {
      width: {
        base: "72rem", // max-w-6xl
        xl: "76rem",
        "2xl": "86rem",
      },
    },
  },
  padding: {
    base: "1rem",
    sm: "1.5rem",
    lg: "1.5rem",
    "2xl": "1.5rem",
  },
  widthMode: "max",
  scrollbarCompensation: false,
  sidebarWidth: "0px",
  startEndAlignSize: "default",
  contexts: {},
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    "3xl": "1925px",
  },
  breakpointOrder: ["sm", "md", "lg", "xl", "2xl", "3xl"],
  selectors: [":root", "#root"],
};

/** Align / semantic size → class (custom sizes use `cntr-{name}`). */
export const builtinClassMap = {
  default: "cntr",
  center: "cntr",
  left: "cntr-start",
  right: "cntr-end",
  full: "cntr-full",
  none: "",
} as const;

/** @deprecated Use builtinClassMap + cntr-{name} for custom sizes */
export const containerClassMap = {
  ...builtinClassMap,
  wide: "cntr-wide",
} as const;
