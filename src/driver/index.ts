import { androidConfig, appId, devices } from "@/config";
import {
  VISUAL_REGRESSION_CURRENT_DIR,
  VISUAL_REGRESSION_DIFF_DIR,
} from "@/paths";
import { vrStore } from "@/store";
import { Device, Story } from "@/types";
import { ensureDirectoryExistence } from "@/utils/directory";
import { toKebabCase } from "@/utils/utils";
import { join } from "path";
import { ChainablePromiseElement, remote } from "webdriverio";
import fs from "fs";
import { exec, spawn } from "child_process";
import { logBlue, logRed } from "@/console";
import { SingleBar, Presets } from "cli-progress";
import { splitArrayIntoParts } from "@/utils/array";
import { deviceStore } from "@/stores/deviceStore";

type Config = Parameters<typeof remote>[0];

const driverConfig: Partial<Config> = {
  hostname: "localhost",
  port: 4723,
  logLevel: "silent", // TODO: add verbose;
};

const getDriverForPlatform = async (
  device: Device,
  story: Story,
  deviceId: string,
  index: number,
) => {
  const name = story.name.replace(/([a-z])([A-Z])/g, "$1 $2").trim();

  const isAndroid = device.platform === "android";

  const port = +`4${isAndroid ? 7 : 8}33` + index;

  if (device.platform === "android") {
    const driver = await remote({
      ...driverConfig,
      capabilities: {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:udid": deviceId,
        "appium:appPackage": appId,
        "appium:systemPort": port,
        "appium:appActivity": androidConfig.activity,
        "appium:forceAppLaunch": true,
        "appium:optionalIntentArguments": `--es kind ${story.kind} --es name "${name}"`,
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
      "appium:udid": deviceId,
      "appium:platformVersion": "17.5",
      "appium:bundleId": appId,
      "appium:wdaLocalPort": port,
      "appium:processArguments": {
        args: ["-kind", story.kind, "-name", name],
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

const processStory = async (
  deviceName: string,
  storyFullName: string,
  bar: SingleBar,
  element: ChainablePromiseElement,
  driver: WebdriverIO.Browser,
) => {
  await element.waitForDisplayed({ timeout: 7000 });

  const screenshot = await driver.takeScreenshot();
  const currentPathForDevice = join(
    VISUAL_REGRESSION_CURRENT_DIR,
    deviceName,
    `${storyFullName}.png`,
  );

  ensureDirectoryExistence(currentPathForDevice);

  fs.writeFileSync(currentPathForDevice, screenshot, "base64");
  bar.increment();
};

const processStoriesSequentially = async (
  device: Device,
  stories: Story[],
  bar: SingleBar,
) => {
  const failedStories: Story[] = [];

  const pararellDevices = deviceStore.getState().devices[device.name];

  const numberOfDevices = pararellDevices.length;

  const groupedStoriesPerDevice = splitArrayIntoParts(stories, numberOfDevices);

  await Promise.all(
    pararellDevices.map(async (pararellDevice, index) => {
      const storiesForDevice = groupedStoriesPerDevice[index];
      logBlue("storiesForDevice", pararellDevice.name, storiesForDevice.length);

      for (const story of storiesForDevice) {
        const { driver, element } = await getDriverForPlatform(
          device,
          story,
          pararellDevice.id,
          index,
        );

        try {
          logBlue("Processing", story.fullName, ":", pararellDevice.name);
          await processStory(device.name, story.fullName, bar, element, driver);
        } catch (e) {
          logBlue(
            "\n",
            story.fullName,
            "Processing failed, will retry",
            e,
            "\n",
          );
          failedStories.push(story);
        } finally {
          await driver.deleteSession();
        }
      }
    }),
  );

  const pararellDevice = pararellDevices[0];

  for (const failedStory of failedStories) {
    const { driver, element } = await getDriverForPlatform(
      device,
      failedStory,
      pararellDevice.id,
      0,
    );

    try {
      logBlue("Processing", failedStory.fullName, ":", pararellDevice.name);
      await processStory(
        device.name,
        failedStory.fullName,
        bar,
        element,
        driver,
      );
    } catch (e) {
      logRed("\n", failedStory.fullName, "Processing failed twice", e, "\n");
      const image = `${failedStory.fullName}.png`;
      fs.rmSync(join(VISUAL_REGRESSION_CURRENT_DIR, device.name, image), {
        force: true,
      });
      fs.rmSync(join(VISUAL_REGRESSION_DIFF_DIR, device.name, image), {
        force: true,
      });
    } finally {
      await driver.deleteSession();
    }
  }
};

const prepareDrivers = async () => {
  await new Promise((resolve) => {
    exec(
      "npx appium driver install uiautomator2",
      null,
      (error, stdout, stderr) => {
        if (error) {
          resolve(`Command failed: ${stderr || error.message}`);
          return;
        }
        resolve(stdout);
      },
    );
  });
  await new Promise((resolve) => {
    exec(
      "npx appium driver install xcuitest",
      null,
      (error, stdout, stderr) => {
        if (error) {
          resolve(`Command failed: ${stderr || error.message}`);
          return;
        }
        resolve(stdout);
      },
    );
  });
};

export const captureScreenshots = async () => {
  const { stories } = vrStore.getState();
  await prepareDrivers();

  const appiumProcess = spawn("npx", ["appium"], {
    stdio: "pipe",
    shell: true,
  });

  const bar = new SingleBar(
    {
      format:
        "\x1b[32mProcessing |{bar}| {percentage}%\x1b[0m | {value}/{total} | ETA: {eta}s",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    Presets.rect,
  );

  bar.start(devices.length * stories.length, 0);

  try {
    await Promise.all(
      devices.map(async (device) => {
        await processStoriesSequentially(device, stories, bar);
      }),
    );
  } catch (e) {
    logRed("Capture failed", (e as unknown as Error).message);
    throw new Error("test run failed");
  } finally {
    appiumProcess.kill("SIGINT");
    bar.stop();
  }
};
