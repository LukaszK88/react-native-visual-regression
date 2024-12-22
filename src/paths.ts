import { join } from "path";

export const VISUAL_REGRESSION_DIR = "visual-regression";
export const VISUAL_REGRESSION_DIFF_DIR = join(VISUAL_REGRESSION_DIR, "diff");
export const VISUAL_REGRESSION_CURRENT_DIR = join(
  VISUAL_REGRESSION_DIR,
  "current",
);
export const VISUAL_REGRESSION_BASELINE_DIR = join(
  VISUAL_REGRESSION_DIR,
  "baseline",
);