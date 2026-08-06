import {
  gutterVarName,
  measureClassName,
  sizeNames,
  widthVarName,
} from "./resolve";
import type { ResolvedContainerConfig } from "./types";

const widthModeRules = (
  config: ResolvedContainerConfig,
  wVar: string,
): string => {
  if (config.widthMode === "min") {
    return `  width: min(var(${wVar}), calc(100% - (var(--cntr-padding) * 2)));
  max-width: none;`;
  }
  return `  width: 100%;
  max-width: var(${wVar});`;
};

/** Class for align-start / align-end targeting a size (default → no suffix). */
export const alignClassName = (
  side: "start" | "end",
  sizeName: string,
): string =>
  sizeName === "default" ? `align-${side}` : `align-${side}-${sizeName}`;

const nestGutterZero = (
  measureSelectors: string[],
  name: string,
): string => {
  const g = `gutter-${name}`;
  const hosts = measureSelectors.map((c) => `.${c}`);
  const hostList = hosts.join(",\n");
  return `${hostList.split(",\n").map((h) => `${h} .pl-${g}`).join(",\n")},
.pl-${g} .pl-${g} {
  padding-inline-start: 0;
}
${hostList.split(",\n").map((h) => `${h} .pr-${g}`).join(",\n")},
.pr-${g} .pr-${g} {
  padding-inline-end: 0;
}
${hostList.split(",\n").map((h) => `${h} .ml-${g}`).join(",\n")},
.ml-${g} .ml-${g} {
  margin-inline-start: 0;
}
${hostList.split(",\n").map((h) => `${h} .mr-${g}`).join(",\n")},
.mr-${g} .mr-${g} {
  margin-inline-end: 0;
}
}`;
};

const alignUtilities = (config: ResolvedContainerConfig): string => {
  const names = sizeNames(config);
  const chunks: string[] = [];

  for (const name of names) {
    const gVar = gutterVarName(name);
    const startCls = alignClassName("start", name);
    const endCls = alignClassName("end", name);
    chunks.push(`.${startCls} {
  margin-inline-start: var(${gVar});
  margin-inline-end: auto;
  padding-inline-start: 0;
  width: auto;
}
.${endCls} {
  margin-inline-start: auto;
  margin-inline-end: var(${gVar});
  padding-inline-end: 0;
  width: auto;
}`);
  }

  return chunks.join("\n\n");
};

const alignNestZero = (config: ResolvedContainerConfig): string => {
  const names = sizeNames(config);
  const measureSelectors = names.map((n) => `.${measureClassName(n)}`);
  const startAlign = names.map((n) => `.${alignClassName("start", n)}`);
  const endAlign = names.map((n) => `.${alignClassName("end", n)}`);

  const startRules = measureSelectors
    .flatMap((m) => startAlign.map((a) => `${m} ${a}`))
    .join(",\n");
  const endRules = measureSelectors
    .flatMap((m) => endAlign.map((a) => `${m} ${a}`))
    .join(",\n");

  const chunks: string[] = [];
  if (startRules) {
    chunks.push(`${startRules} {
  margin-inline-start: 0;
}`);
  }
  if (endRules) {
    chunks.push(`${endRules} {
  margin-inline-end: 0;
}`);
  }
  return chunks.join("\n\n");
};

/**
 * Emit measure classes, align modifiers, max-width/width helpers, and named
 * gutter utilities for the configured size map.
 *
 * Measure classes do not rescope `--cntr-width` — that token always means the
 * default measure. Named sizes use their own `--cntr-width-{name}` for
 * `max-width`. Align modifiers (`align-start-{name}`) only un-center and flush
 * to a size's gutter; pair them with a measure class (e.g. `cntr align-start-wide`).
 */
export const toSizeCss = (config: ResolvedContainerConfig): string => {
  const names = sizeNames(config);
  const chunks: string[] = [];
  const measureSelectors = names.map(measureClassName);

  for (const name of names) {
    const cls = measureClassName(name);
    const wVar = widthVarName(name);
    const size = config.sizes[name];
    const locals: string[] = [];
    if (size.padding?.base) {
      locals.push(`  --cntr-padding: ${size.padding.base};`);
    }

    const localBlock = locals.length ? `${locals.join("\n")}\n` : "";
    chunks.push(`.${cls} {
${localBlock}${widthModeRules(config, wVar)}
  margin-inline: auto;
  padding-inline: var(--cntr-padding);
}`);

    if (name === "default") {
      chunks.push(`.max-w-cntr {
  max-width: var(--cntr-width);
}
.w-cntr {
  width: var(--cntr-width);
}`);
    } else {
      chunks.push(`.max-w-cntr-${name} {
  max-width: var(${wVar});
}
.w-cntr-${name} {
  width: var(${wVar});
}`);
    }
  }

  // Align after measure classes so margin/padding/width overrides win in cascade.
  chunks.push(alignUtilities(config));

  for (const name of names) {
    if (name === "default") continue;
    const gVar = gutterVarName(name);
    chunks.push(`.pl-gutter-${name} {
  padding-inline-start: var(${gVar});
}
.pr-gutter-${name} {
  padding-inline-end: var(${gVar});
}
.px-gutter-${name} {
  padding-inline-start: var(${gVar});
  padding-inline-end: var(${gVar});
}
.ml-gutter-${name} {
  margin-inline-start: var(${gVar});
}
.mr-gutter-${name} {
  margin-inline-end: var(${gVar});
}
.mx-gutter-${name} {
  margin-inline-start: var(${gVar});
  margin-inline-end: var(${gVar});
}`);
  }

  const pairs: string[] = [];
  for (const outer of measureSelectors) {
    for (const inner of measureSelectors) {
      pairs.push(`.${outer} .${inner}`);
    }
  }
  // Pad only: nested measures already sit inside an outer pad, so drop the
  // inner pad. Do not zero margin-inline — measures use margin-inline: auto to
  // center, and a narrower nested measure (e.g. cntr-wide max-w-xl inside cntr)
  // should stay centered.
  if (pairs.length) {
    chunks.push(`${pairs.join(",\n")} {
  padding-inline: 0;
}`);
  }

  chunks.push(alignNestZero(config));

  for (const name of names) {
    if (name === "default") continue;
    chunks.push(nestGutterZero(measureSelectors, name));
  }

  return chunks.join("\n\n") + "\n";
};
