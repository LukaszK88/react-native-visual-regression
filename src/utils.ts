import { execSync } from "child_process";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "./index";
import { join } from "path";
import fs from "fs";
import { logBlue, logGreen, logRed } from "./console";
import { Device } from "./types";

export function toKebabCase(str: string) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // Insert hyphen between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2") // Insert hyphen between uppercase letters
    .toLowerCase(); // Convert to lowercase
}

export function findEmulatorByAvdName(targetAvdName: string) {
  const devicesOutput = execSync("adb devices", { encoding: "utf-8" });
  const emulatorIds = devicesOutput
    .split("\n")
    .filter((line) => line.startsWith("emulator-"))
    .map((line) => line.split("\t")[0]);

  for (const emulatorId of emulatorIds) {
    const avdName = execSync(`adb -s ${emulatorId} emu avd name`, {
      encoding: "utf-8",
    }).trim();

    if (avdName.startsWith(targetAvdName)) {
      logBlue(`Emulator ID for AVD '${targetAvdName}' is: ${emulatorId}`);
      return emulatorId;
    }
  }

  throw new Error(`No running emulator found with AVD name '${targetAvdName}'`);
}

export function findSimulatorIdBySimulatorName(deviceName: string): string {
  // Execute the command to list booted devices
  const output = execSync("xcrun simctl list devices booted", {
    encoding: "utf-8",
  });

  // Regular expression to match the device ID and name
  const deviceRegex = new RegExp(
    `(${deviceName}) \\(([^)]+)\\) \\(Booted\\)`,
    "i",
  );
  const match = output.match(deviceRegex);

  if (match && match[2]) {
    const deviceId = match[2];
    logBlue(`Found device ID: ${deviceId} for device name: ${deviceName}`);
    return deviceId;
  } else {
    throw new Error(`No booted device found with name '${deviceName}'`);
  }
}

export const getDeviceIdByName = (device: Device) =>
  device.platform === "android"
    ? findEmulatorByAvdName(device.name)
    : findSimulatorIdBySimulatorName(device.name);

export const approveChangesForScreenshots = (screenshots: string[]) => {
  screenshots.forEach((screenshot) => {
    const currentScreenshot = join(VISUAL_REGRESSION_CURRENT_DIR, screenshot);
    if (!fs.existsSync(currentScreenshot)) {
      logRed("Given", currentScreenshot, "does not exist");
      return;
    }

    fs.copyFileSync(
      join(VISUAL_REGRESSION_CURRENT_DIR, screenshot),
      join(VISUAL_REGRESSION_BASELINE_DIR, screenshot),
    );
    logGreen("Updated as new baseline:", screenshot);
  });
};

export const buildScreenshotName = (
  deviceName: string,
  kind: string,
  name: string,
) => `${deviceName}-${kind}-${name}.png`;
