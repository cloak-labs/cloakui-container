import type { DefineContainerOptions, ResolvedContainerConfig } from "./types";
export type ContainerTailwindPluginOptions = {
    /** Pre-resolved config, or raw options passed through `resolveContainerConfig`. */
    config?: ResolvedContainerConfig | DefineContainerOptions;
    /** When false, only theme tokens are registered (no base CSS). @default true */
    emitBaseCss?: boolean;
};
/**
 * Tailwind plugin: dynamic theme tokens per configured size, optional base CSS
 * (vars, context ladder, measure classes / gutters with widthMode).
 */
export declare function createContainerTailwindPlugin(configOrOptions?: ResolvedContainerConfig | DefineContainerOptions | ContainerTailwindPluginOptions, maybeOptions?: {
    emitBaseCss?: boolean;
}): {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
/** @deprecated Prefer `createContainerTailwindPlugin` */
export declare const containerTailwindPlugin: typeof createContainerTailwindPlugin;
export default createContainerTailwindPlugin;
//# sourceMappingURL=tailwindPlugin.d.ts.map