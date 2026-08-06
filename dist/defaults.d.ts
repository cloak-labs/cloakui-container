import type { ResolvedContainerConfig } from "./types";
/** Package defaults: a single content measure. Add more sizes in your project config. */
export declare const defaultContainerConfig: ResolvedContainerConfig;
/** Semantic size → measure class (custom sizes use `cntr-{name}`). */
export declare const builtinClassMap: {
    readonly default: "cntr";
    readonly center: "cntr";
    readonly full: "cntr-full";
    readonly none: "";
};
/** @deprecated Use builtinClassMap + cntr-{name} for custom sizes */
export declare const containerClassMap: {
    readonly wide: "cntr-wide";
    readonly default: "cntr";
    readonly center: "cntr";
    readonly full: "cntr-full";
    readonly none: "";
};
//# sourceMappingURL=defaults.d.ts.map