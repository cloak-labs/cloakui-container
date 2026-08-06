import { writeFileSync } from "node:fs";
import { toCss, type ToCssOptions } from "./toCss";
import type { ResolvedContainerConfig } from "./types";

type CssSource =
  | ResolvedContainerConfig
  | { toCss: (options?: ToCssOptions) => string };

/**
 * Write measure CSS (and optional Tailwind v4 `@theme` tokens) to a file.
 * Node-only — use from a prebuild script, not in the browser.
 *
 * ```ts
 * import { writeContainerCss } from "@cloakui/container/node";
 * writeContainerCss(container, "src/container.generated.css", { theme: true });
 * ```
 */
export const writeContainerCss = (
  source: CssSource,
  filePath: string,
  options: ToCssOptions = {},
): void => {
  const css =
    "toCss" in source && typeof source.toCss === "function"
      ? source.toCss(options)
      : toCss(source as ResolvedContainerConfig, options);
  writeFileSync(filePath, css);
};
