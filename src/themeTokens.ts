import { nonDefaultSizeNames } from "./resolve";
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
export const themeTokenMaps = (
  config: ResolvedContainerConfig,
): ThemeTokenMaps => {
  const spacing: Record<string, string> = {
    "cntr-pad": "var(--cntr-padding)",
    gutter: "var(--cntr-gutter)",
  };
  const maxWidth: Record<string, string> = {
    cntr: "var(--cntr-width)",
  };
  const width: Record<string, string> = {
    cntr: "var(--cntr-width)",
  };

  for (const name of nonDefaultSizeNames(config)) {
    spacing[`gutter-${name}`] = `var(--cntr-gutter-${name})`;
    maxWidth[`cntr-${name}`] = `var(--cntr-width-${name})`;
    width[`cntr-${name}`] = `var(--cntr-width-${name})`;
  }

  return { spacing, maxWidth, width };
};

/**
 * Tailwind v4 `@theme` block so utilities like `px-cntr-pad` / `max-w-cntr`
 * resolve from the same config as measure CSS.
 */
export const toThemeCss = (config: ResolvedContainerConfig): string => {
  const { spacing, width, maxWidth } = themeTokenMaps(config);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(width)) {
    lines.push(`  --width-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(maxWidth)) {
    lines.push(`  --max-width-${key}: ${value};`);
  }

  return `@theme {\n${lines.join("\n")}\n}\n`;
};
