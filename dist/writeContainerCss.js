import { writeFileSync } from "node:fs";
import { toCss } from "./toCss";
/**
 * Write measure CSS (and optional Tailwind v4 `@theme` tokens) to a file.
 * Node-only — use from a prebuild script, not in the browser.
 *
 * ```ts
 * writeContainerCss(container, "src/container.generated.css", { theme: true });
 * ```
 */
export const writeContainerCss = (source, filePath, options = {}) => {
    const css = "toCss" in source && typeof source.toCss === "function"
        ? source.toCss(options)
        : toCss(source, options);
    writeFileSync(filePath, css);
};
