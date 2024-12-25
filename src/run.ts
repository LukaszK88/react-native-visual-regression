import fs from "fs";

import { generateMaestroFlows, spawnAll } from "@/maestro/maestro";
import { processImages } from "@/images/images";
import { addLine, generateMarkdownReport } from "./report";
import { formatStoryFileToKindWithNames } from "@/storybook/stories";
import {
  approveChangesForScreenshots,
  buildScreenshotName,
  toKebabCase,
} from "@/utils/utils";
import { logGreen } from "@/console";
import { verifyMaestroInstall } from "@/maestro/installation";
import { config, devices } from "@/config";
import { isApproveChanges, fileFilter, storyFilter } from "@/args";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "@/paths";
import { initStore, vrStore } from "@/store";

import { remote } from "webdriverio";
import { dirname, join } from "path";

function ensureDirectoryExistence(filePath: string) {
  const dir = dirname(filePath);
  if (fs.existsSync(dir)) {
    return true;
  }
  fs.mkdirSync(dir, { recursive: true });
}

const capabilities: WebdriverIO.Capabilities = {
  platformName: "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "Pixel_8_API_35",
  "appium:appPackage": config.appId,
  "appium:appActivity": ".MainActivity",
  "appium:forceAppLaunch": true,
  "appium:optionalIntentArguments": "--es kind MyButton --es name Basic",
};

const runVisualRegression = async () => {
  initStore();

  const { stories } = vrStore.getState();

  for (const device of devices) {
    for (const story of stories) {
      const driver = await remote({
        hostname: "localhost",
        port: 4723,
        logLevel: "info",
        capabilities: {
          platformName: "Android",
          "appium:automationName": "UiAutomator2",
          "appium:deviceName": device.name,
          "appium:appPackage": config.appId,
          "appium:appActivity": ".MainActivity",
          "appium:forceAppLaunch": true,
          "appium:optionalIntentArguments": `--es kind ${story.kind} --es name ${story.name.replace(/([A-Z])/g, " $1").trim()}`,
        },
      });

      const selector = `new UiSelector().resourceId("${story.kind.toLowerCase()}--${toKebabCase(story.name)}")`;
      const element = await driver.$(`android=${selector}`);

      await element.waitForDisplayed({ timeout: 5000 });

      const screenshot = await driver.takeScreenshot();

      const currentPathForDevice = join(
        VISUAL_REGRESSION_CURRENT_DIR,
        device.name,
        `${story.fullName}.png`,
      );

      ensureDirectoryExistence(currentPathForDevice);

      fs.writeFileSync(currentPathForDevice, screenshot, "base64");

      await driver.deleteSession();
    }
  }

  // const batteryItem = await driver.$('//*[@text="Battery"]');
  // await batteryItem.click();
  // verifyMaestroInstall();
  // generateMarkdownReport();

  // generateMaestroFlows();

  // await spawnAll();
  // await processImages();
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
