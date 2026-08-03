/** Default step keys (excludes `base`) matching Tailwind's default screens. */
export const defaultBreakpointOrder = [
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
];
/**
 * Full ladder including `base` — back-compat export for callers that walked a
 * fixed list. Prefer `config.breakpointOrder` / `ladderOrder(config)`.
 */
export const orderedBreakpoints = [
    "base",
    ...defaultBreakpointOrder,
];
/** Approximate px for ordering only (`rem`/`em` → ×16). */
export const minWidthSortValue = (value) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^(-?[\d.]+)\s*(px|rem|em)?$/i);
    if (!match)
        return Number.POSITIVE_INFINITY;
    const n = Number.parseFloat(match[1]);
    if (Number.isNaN(n))
        return Number.POSITIVE_INFINITY;
    const unit = (match[2] ?? "px").toLowerCase();
    if (unit === "rem" || unit === "em")
        return n * 16;
    return n;
};
export const sortBreakpointKeys = (keys, breakpoints) => [...keys].sort((a, b) => {
    const d = minWidthSortValue(breakpoints[a] ?? "") -
        minWidthSortValue(breakpoints[b] ?? "");
    return d !== 0 ? d : a.localeCompare(b);
});
/**
 * Resolve mobile-first step order (excludes `base`).
 * Explicit `breakpointOrder` wins; otherwise sort merged keys by min-width.
 */
export const resolveBreakpointOrder = (breakpoints, explicitOrder) => {
    const available = Object.keys(breakpoints);
    if (!available.length)
        return [];
    if (explicitOrder?.length) {
        const seen = new Set();
        const ordered = [];
        for (const key of explicitOrder) {
            if (key === "base")
                continue;
            if (!(key in breakpoints) || seen.has(key))
                continue;
            ordered.push(key);
            seen.add(key);
        }
        const missing = available.filter((k) => !seen.has(k));
        return [...ordered, ...sortBreakpointKeys(missing, breakpoints)];
    }
    return sortBreakpointKeys(available, breakpoints);
};
/** `["base", ...breakpointOrder]` for inheritance walks. */
export const ladderOrder = (breakpointOrder) => [
    "base",
    ...breakpointOrder,
];
export const collectStepKeysFromMaps = (...maps) => {
    const keys = new Set();
    for (const map of maps) {
        if (!map)
            continue;
        for (const key of Object.keys(map)) {
            if (key !== "base")
                keys.add(key);
        }
    }
    return [...keys];
};
/**
 * Ensure every step key used in size/padding maps has a min-width entry.
 */
export const assertStepsHaveBreakpoints = (stepKeys, breakpoints) => {
    const missing = stepKeys.filter((key) => breakpoints[key] == null);
    if (missing.length) {
        throw new Error(`Container size/padding steps missing breakpoints: ${missing.join(", ")}. ` +
            `Add them to \`breakpoints\` (or use \`breakpointsFromScreens\`).`);
    }
};
