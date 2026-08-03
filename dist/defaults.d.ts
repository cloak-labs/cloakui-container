import type { ResolvedContainerConfig } from "./types";
/** Defaults matching a typical content + wide layout (WP-friendly preset). */
export declare const defaultContainerConfig: ResolvedContainerConfig;
/** Align / semantic size → class (custom sizes use `cntr-{name}`). */
export declare const builtinClassMap: {
    readonly default: "cntr";
    readonly center: "cntr";
    readonly left: "cntr-start";
    readonly right: "cntr-end";
    readonly full: "cntr-full";
    readonly none: "";
};
/** @deprecated Use builtinClassMap + cntr-{name} for custom sizes */
export declare const containerClassMap: {
    readonly wide: "cntr-wide";
    readonly default: "cntr";
    readonly center: "cntr";
    readonly left: "cntr-start";
    readonly right: "cntr-end";
    readonly full: "cntr-full";
    readonly none: "";
};
//# sourceMappingURL=defaults.d.ts.map