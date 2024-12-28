import { join } from "path";
import { devices } from "@/config";

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

export const FLOW_FILES_PATHS = devices.map((device) =>
  join(".maestro", `${device.name}_visual_regression.yaml`),
);
