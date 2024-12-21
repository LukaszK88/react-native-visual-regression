import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "./index";
import { join } from "path";
import fs from "fs";
import { logGreen, logRed } from "./console";

export function toKebabCase(str: string) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // Insert hyphen between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2") // Insert hyphen between uppercase letters
    .toLowerCase(); // Convert to lowercase
}

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
