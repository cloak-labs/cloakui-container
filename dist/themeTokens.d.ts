import type { ResolvedContainerConfig } from "./types";
export type ThemeTokenMaps = {
    spacing: Record<string, string>;
    width: Record<string, string>;
    maxWidth: Record<string, string>;
};
/**
 * Theme token maps shared by the Tailwind v3 plugin (`theme.extend`) and the
 * Tailwind v4 `@theme` CSS emitter.
 */
export declare const themeTokenMaps: (config: ResolvedContainerConfig) => ThemeTokenMaps;
/**
 * Tailwind v4 `@theme` block so utilities like `px-cntr-pad` / `max-w-cntr`
 * resolve from the same config as measure CSS.
 */
export declare const toThemeCss: (config: ResolvedContainerConfig) => string;
//# sourceMappingURL=themeTokens.d.ts.map