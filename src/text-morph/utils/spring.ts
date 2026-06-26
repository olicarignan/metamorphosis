// Spring physics now lives in the shared module so both the text and icon
// morph engines can use it. Re-exported here to preserve existing import paths
// (e.g. `src/index.ts` re-exports SpringParams from this location).
export type { SpringParams, SpringResult } from "../../shared/spring";
export { spring, springEasingFn } from "../../shared/spring";
