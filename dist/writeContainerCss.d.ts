import { type ToCssOptions } from "./toCss";
import type { ResolvedContainerConfig } from "./types";
type CssSource = ResolvedContainerConfig | {
    toCss: (options?: ToCssOptions) => string;
};
/**
 * Write measure CSS (and optional Tailwind v4 `@theme` tokens) to a file.
 * Node-only — use from a prebuild script, not in the browser.
 *
 * ```ts
 * writeContainerCss(container, "src/container.generated.css", { theme: true });
 * ```
 */
export declare const writeContainerCss: (source: CssSource, filePath: string, options?: ToCssOptions) => void;
export {};
//# sourceMappingURL=writeContainerCss.d.ts.map