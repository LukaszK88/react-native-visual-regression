import { devices } from "@/config";
import { VISUAL_REGRESSION_BASELINE_DIR } from "@/paths";
import { copyFileSync, lstatSync, readdirSync } from "fs";
import { join } from "path";

export const runV2Migration = () => {
  const baselineImages = readdirSync(VISUAL_REGRESSION_BASELINE_DIR);

  devices.forEach((device) => {
    baselineImages.forEach((image) => {
      const file = lstatSync(join(VISUAL_REGRESSION_BASELINE_DIR, image));

      if (!file.isFile()) {
        return;
      }
      if (image.startsWith(device.name)) {
        copyFileSync(
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
