import fs from "fs";

import { formatStoryFileToKindWithNames } from "@/storybook/stories";
import { approveChangesForScreenshots } from "@/utils/utils";
import { logGreen } from "@/console";
import { isApproveChanges, fileFilter, storyFilter, migrateToV2 } from "@/args";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "@/paths";
import { initStore } from "@/store";

import { captureScreenshots } from "@/driver";
import { processImages } from "@/images/images";
import { runV2Migration } from "./utils/migration";
import { warmUpDevices } from "./devices/devices";
import { addRuntime } from "./reports/report";
import { join } from "path";

const runVisualRegression = async () => {
  if (migrateToV2) {
    runV2Migration();
    return;
  }

  await warmUpDevices();

  initStore();

  await captureScreenshots();

  await processImages();
};

const handleApproveChanges = () => {
  if (fileFilter) {
    const kindWithNames = formatStoryFileToKindWithNames(fileFilter);

    const kind = Object.keys(kindWithNames)[0];

    const screenshots = kindWithNames[kind].map((name) =>
      join(...kind.split("/"), `${name}.png`),
    );

    approveChangesForScreenshots(screenshots);
    return;
  }

  if (storyFilter) {
    const nestedPath = join(...storyFilter.split("/")) + ".png";
    approveChangesForScreenshots([nestedPath]);
    return;
  }

  fs.cpSync(VISUAL_REGRESSION_CURRENT_DIR, VISUAL_REGRESSION_BASELINE_DIR, {
    recursive: true,
  });
  logGreen("Changes approved");
};

export const main = async () => {
  if (isApproveChanges) {
    handleApproveChanges();
    return;
  }
  const start = performance.now();
  await runVisualRegression();
  const end = performance.now();

  const duration = end - start;

  console.info("Run took:", Math.floor(duration / 1000), "s");

  addRuntime(`Run time - ${Math.floor(duration / 1000)}s`);
};
