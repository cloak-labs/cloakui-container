/** Package defaults: a single content measure. Add more sizes in your project config. */
export const defaultContainerConfig = {
    sizes: {
        default: {
            width: {
                base: "56rem", // max-w-4xl
                "2xl": "64rem", // max-w-5xl
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
    },
    breakpointOrder: ["sm", "md", "lg", "xl", "2xl"],
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
};
/** @deprecated Use builtinClassMap + cntr-{name} for custom sizes */
export const containerClassMap = {
    ...builtinClassMap,
    wide: "cntr-wide",
};
