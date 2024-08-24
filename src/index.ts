import fs from "fs";
import path, { join } from "path";
// @ts-ignore
import arg from "arg";
import { generateMaestroFlow, runMaestroFlow } from "./maestro";
import { orchestrateImages } from "./images";
import { addLine, addRow } from "./report";
import { getVRStories } from "./stories";
import { exec, execSync } from "child_process";

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

const config = require(configPath) as {
  devices: {
    platform: 'android' | 'ios';
    name: string;
  }[];
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


async function findEmulatorByAvdName(targetAvdName: string): Promise<string> {
  const devicesOutput = execSync('adb devices', { encoding: 'utf-8' });
  const emulatorIds = devicesOutput
      .split('\n')
      .filter(line => line.startsWith('emulator-'))
      .map(line => line.split('\t')[0]);

  for (const emulatorId of emulatorIds) {
      const avdName = execSync(`adb -s ${emulatorId} emu avd name`, { encoding: 'utf-8' }).trim();

      if (avdName.startsWith(targetAvdName)) {
          console.log(`Emulator ID for AVD '${targetAvdName}' is: ${emulatorId}`);
          return emulatorId;
      }
  }

  throw new Error(`No running emulator found with AVD name '${targetAvdName}'`);
}

const runVisualRegression = async () => {
  const kindWithNames = getVRStories();

  for (const device of devices) {

    const deviceId = await findEmulatorByAvdName(device.name)

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
