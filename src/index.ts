import fs from "fs";
import path, { join } from "path";
// @ts-ignore
import arg from "arg";
import { generateMaestroFlow, runMaestroFlow } from "./maestro";
import { orchestrateImages } from "./images";
import { addLine, addRow } from "./report";
import { getVRStories } from "./stories";
import { exec, execSync } from "child_process";
import { findEmulatorByAvdName, getDeviceIdByName } from "./utils";

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
  return path.join(rootDir, 'rn-vr.config.js');
}

const configPath = getRootConfigPath();

export type Device = {
  platform: 'android' | 'ios';
  name: string;
}

const config = require(configPath) as {
  devices: Device[];
  appId: string;
  storiesDirectories: string[];
}

const isApproveChanges = args["--approve"];
export const fileFilter = args["--file"];
export const storyFilter = args["--story"];
export const appId = config.appId;
export const devices = config.devices;

export const STORIES_DIR_PATH = config.storiesDirectories;

export const VISUAL_REGRESSION_DIR = "visual-regression";
export const VISUAL_REGRESSION_DIFF_DIR = join(VISUAL_REGRESSION_DIR, "diff");
export const VISUAL_REGRESSION_CURRENT_DIR = join(VISUAL_REGRESSION_DIR, "current");
export const VISUAL_REGRESSION_BASELINE_DIR = join(VISUAL_REGRESSION_DIR, "baseline");

const runVisualRegression = async () => {
  const kindWithNames = getVRStories();

  for (const device of devices) {

    const deviceId = await getDeviceIdByName(device);

    const { imageNames } = generateMaestroFlow(kindWithNames, device.name);

    await runMaestroFlow(deviceId);
  
    await orchestrateImages(imageNames);
  }
};

const main = async () => {
  // TODO approve single file or story
  if (isApproveChanges) {
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

  console.info('Run took:', Math.floor(duration / 1000));

  addLine(`#### Run time - ${Math.floor(duration / 1000)}s`)
};

main();
