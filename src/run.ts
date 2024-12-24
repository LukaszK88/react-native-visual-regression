import fs from "fs";

import {
  generateMaestroFlows,
  spawnAll,
} from "@/maestro/maestro";
import { processImages } from "@/images/images";
import { addLine, generateMarkdownReport } from "./report";
import {
  formatStoryFileToKindWithNames,
} from "@/storybook/stories";
import {
  approveChangesForScreenshots,
  buildScreenshotName,
} from "@/utils/utils";
import { logGreen } from "@/console";
import { verifyMaestroInstall } from "@/maestro/installation";
import { devices } from "@/config";
import { isApproveChanges, fileFilter, storyFilter } from "@/args";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "@/paths";
import { initStore } from "@/store";


const runVisualRegression = async () => {
  initStore();

  verifyMaestroInstall();
  generateMarkdownReport();

  generateMaestroFlows();

  await spawnAll();
  await processImages();
};

const handleApproveChanges = () => {
  if (fileFilter) {
    const kindWithNames = formatStoryFileToKindWithNames(fileFilter);

    const screenshotNames: string[] = [];
    const kind = Object.keys(kindWithNames)[0];
    devices.forEach((device) => {
      kindWithNames[kind].forEach((name) => {
        screenshotNames.push(buildScreenshotName(device.name, kind, name));
      });
    });

    approveChangesForScreenshots(screenshotNames);
    return;
  }

  if (storyFilter) {
    const screenshotNames = devices.map((d) => `${d.name}-${storyFilter}.png`);
    approveChangesForScreenshots(screenshotNames);
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

  addLine(`#### Run time - ${Math.floor(duration / 1000)}s`);
};
