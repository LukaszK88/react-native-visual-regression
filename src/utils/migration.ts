import { devices } from "@/config";
import { VISUAL_REGRESSION_BASELINE_DIR } from "@/paths";
import { existsSync, mkdirSync, readdirSync, renameSync } from "fs";
import { join } from "path";

export const runV2Migration = () => {
  const baselineImages = readdirSync(VISUAL_REGRESSION_BASELINE_DIR);
  devices.forEach((device) => {
    const dir = join(VISUAL_REGRESSION_BASELINE_DIR, device.name);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    baselineImages.forEach((image) => {
      if (image.startsWith(device.name)) {
        renameSync(
          join(VISUAL_REGRESSION_BASELINE_DIR, image),
          join(
            VISUAL_REGRESSION_BASELINE_DIR,
            device.name,
            image.replace(device.name, "").substring(1),
          ),
        );
      }
    });
  });
};
