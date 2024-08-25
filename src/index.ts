import fs from "fs";
import path, { join } from "path";
// @ts-expect-error expected
import arg from "arg";
import {
  generateMaestroFlow,
  runMaestroFlow,
  verifyMaestroInstall,
} from "./maestro";
import { orchestrateImages } from "./images";
import { addLine } from "./report";
import { formatStoryFileToKindWithNames, getVRStories } from "./stories";
import {
  approveChangesForScreenshots,
  buildScreenshotName,
  getDeviceIdByName,
} from "./utils";

// TODO: device filter for approval or run.

const args = arg({
  // Types
  "--approve": Boolean,
  "--file": String,
  "--story": String, // kind-name
  // Aliases
  "-a": "--approve",
  "-f": "--file",
  "-s": "--story",
});

function getRootConfigPath() {
  const rootDir = process.cwd();
  return path.join(rootDir, "rn-vr.config.js");
}

const configPath = getRootConfigPath();

export type Device = {
  platform: "android" | "ios";
  name: string;
};

// eslint-disable-next-line  @typescript-eslint/no-require-imports
const config = require(configPath) as {
  devices: Device[];
  appId: string;
  storiesDirectories: string[];
};

const isApproveChanges = args["--approve"];
export const fileFilter = args["--file"];
export const storyFilter = args["--story"];
export const appId = config.appId;
export const devices = config.devices;

export const STORIES_DIR_PATH = config.storiesDirectories;

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

const runVisualRegression = async () => {
  const kindWithNames = getVRStories();
  verifyMaestroInstall();
  for (const device of devices) {
    const deviceId = await getDeviceIdByName(device);

    const { imageNames } = generateMaestroFlow(kindWithNames, device.name);

    await runMaestroFlow(deviceId);

    await orchestrateImages(imageNames);
  }
};

const main = async () => {
  if (isApproveChanges) {
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
      const screenshotNames = devices.map(
        (d) => `${d.name}-${storyFilter}.png`,
      );
      approveChangesForScreenshots(screenshotNames);
      return;
    }

    fs.cpSync(VISUAL_REGRESSION_CURRENT_DIR, VISUAL_REGRESSION_BASELINE_DIR, {
      recursive: true,
    });
    console.log("Changes approved");
    return;
  }
  const start = performance.now();
  await runVisualRegression();
  const end = performance.now();

  const duration = end - start;

  console.info("Run took:", Math.floor(duration / 1000), "s");

  addLine(`#### Run time - ${Math.floor(duration / 1000)}s`);
};

main();
