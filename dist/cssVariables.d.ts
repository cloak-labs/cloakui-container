import { nonDefaultSizeNames } from "./resolve";
import type { ResolvedContainerConfig } from "./types";
/** Gutter formula for a width var + shared padding vars. */
export declare const gutterCalc: (widthVar: string) => string;
export declare const baseContainerVariables: (config: ResolvedContainerConfig) => Record<string, string>;
export declare const cssVariablesObjectToString: (vars: Record<string, string>) => string;
export { nonDefaultSizeNames };
//# sourceMappingURL=cssVariables.d.ts.map