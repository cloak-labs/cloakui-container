import { gutterVarName, measureClassName, sizeNames, widthVarName, } from "./resolve";
const widthModeRules = (config) => {
    if (config.widthMode === "min") {
        return `  width: min(var(--cntr-width), calc(100% - (var(--cntr-padding) * 2)));
  max-width: none;`;
    }
    return `  width: 100%;
  max-width: var(--cntr-width);`;
};
const nestGutterZero = (measureSelectors, name) => {
    const g = `gutter-${name}`;
    const hosts = [
        ...measureSelectors.map((c) => `.${c}`),
        ".cntr-start",
        ".cntr-end",
    ];
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
.ml-${g} .cntr-start {
  margin-inline-start: 0;
}`;
};
/**
 * Emit measure classes, max-width/width helpers, and named gutter utilities for
 * the configured size map.
 */
export const toSizeCss = (config) => {
    const names = sizeNames(config);
    const chunks = [];
    const widthRules = widthModeRules(config);
    const measureSelectors = names.map(measureClassName);
    for (const name of names) {
        const cls = measureClassName(name);
        const wVar = widthVarName(name);
        const size = config.sizes[name];
        const rescope = [
            `  /* rescope measure for nested gutter / max-w-cntr descendants */`,
            `  --cntr-width: var(${wVar});`,
        ];
        if (size.padding?.base) {
            rescope.push(`  --cntr-padding: ${size.padding.base};`);
        }
        rescope.push(`  --cntr-start-gutter: 0px;`);
        rescope.push(`  --cntr-start-right-margin: 0px;`);
        chunks.push(`.${cls} {
${rescope.join("\n")}
${widthRules}
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
        }
        else {
            chunks.push(`.max-w-cntr-${name} {
  max-width: var(${wVar});
}
.w-cntr-${name} {
  width: var(${wVar});
}`);
        }
    }
    for (const name of names) {
        if (name === "default")
            continue;
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
    const pairs = [];
    for (const outer of measureSelectors) {
        for (const inner of measureSelectors) {
            pairs.push(`.${outer} .${inner}`);
        }
    }
    if (pairs.length) {
        chunks.push(`${pairs.join(",\n")} {
  padding-inline: 0;
  margin-inline: 0;
}`);
    }
    for (const outer of measureSelectors) {
        chunks.push(`.${outer} .cntr-start {
  padding-inline-end: 0;
}
.${outer} .cntr-end {
  padding-inline-start: 0;
}`);
    }
    for (const name of names) {
        if (name === "default")
            continue;
        chunks.push(nestGutterZero(measureSelectors, name));
    }
    return chunks.join("\n\n") + "\n";
};
