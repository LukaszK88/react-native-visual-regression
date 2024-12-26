import { config, devices } from "@/config";
import { VISUAL_REGRESSION_CURRENT_DIR } from "@/paths";
import { vrStore } from "@/store";
import { Device, Story } from "@/types";
import { ensureDirectoryExistence } from "@/utils/directory";
import { toKebabCase } from "@/utils/utils";
import { join } from "path";
import { remote } from "webdriverio";
import fs from "fs";
import { spawn } from "child_process";
import { logRed } from "@/console";

type Config = Parameters<typeof remote>[0];

const driverConfig: Partial<Config> = {
  hostname: "localhost",
  port: 4723,
  logLevel: "silent", // TODO: add verbose;
};

const getDriverForPlatform = async (device: Device, story: Story) => {
  if (device.platform === "android") {
    const driver = await remote({
      ...driverConfig,
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

    return {
      driver,
      element,
    };
  }

  const driver = await remote({
    ...driverConfig,
    capabilities: {
      platformName: "iOS",
      "appium:automationName": "XCUITest",
      "appium:deviceName": device.name,
      "appium:platformVersion": "17.5",
      "appium:bundleId": config.appId,
      "appium:processArguments": {
        args: [
          "-kind",
          story.kind,
          "-name",
          story.name.replace(/([A-Z])/g, " $1").trim(),
        ],
      },
    },
  });

  const element = await driver.$(
    `~${story.kind.toLowerCase()}--${toKebabCase(story.name)}`,
  );

  return {
    driver,
    element,
  };
};

const processStoriesSequentially = async (device: Device, stories: Story[]) => {
  for (const story of stories) {
    const { driver, element } = await getDriverForPlatform(device, story);

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
};

export const captureScreenshots = async () => {
  const { stories } = vrStore.getState();

  const appiumProcess = spawn("npx", ["appium"], {
    stdio: "pipe",
    shell: true,
  });

  try {
    await Promise.all(
      devices.map(async (device) => {
        await processStoriesSequentially(device, stories);
      }),
    );
  } catch (e) {
    logRed("Capture failed", e);
  } finally {
    appiumProcess.kill("SIGINT");
  }
};
