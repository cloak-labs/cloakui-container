import type { ResolvedContainerConfig } from "./types";
/** Class for align-start / align-end targeting a size (default → no suffix). */
export declare const alignClassName: (side: "start" | "end", sizeName: string) => string;
/**
 * Emit measure classes, align modifiers, max-width/width helpers, and named
 * gutter utilities for the configured size map.
 *
 * Measure classes do not rescope `--cntr-width` — that token always means the
 * default measure. Named sizes use their own `--cntr-width-{name}` for
 * `max-width`. Align modifiers (`align-start-{name}`) only un-center and flush
 * to a size's gutter; pair them with a measure class (e.g. `cntr align-start-wide`).
 */
export declare const toSizeCss: (config: ResolvedContainerConfig) => string;
//# sourceMappingURL=sizesCss.d.ts.map