import { vrStore } from "@/store";
import { captureScreenshots } from ".";
import { remote } from "webdriverio";
import { writeFileSync } from "fs";

jest.mock("@/store", () => ({
  vrStore: {
    getState: jest.fn(),
  },
}));

jest.mock("child_process", () => ({
  spawn: () => ({
    kill: jest.fn(),
  }),
}));

const mockTakeScreenshot = jest.fn();
jest.mock("webdriverio", () => ({
  remote: jest.fn(() => ({
    $: () => ({
      waitForDisplayed: jest.fn(),
    }),
    takeScreenshot: mockTakeScreenshot,
    deleteSession: jest.fn(),
  })),
}));
jest.mock("cli-progress");
jest.mock("fs");

jest.mock("@/config", () => ({
  appId: "appId",
  devices: [
    { platform: "ios", name: "iPhone 15" },
    { platform: "android", name: "Pixel_8_API_34" },
  ],
}));

describe("index", () => {
  it("should run pararell driver run for devices", async () => {
    jest.mocked(vrStore.getState).mockReturnValue({
      stories: [
        {
          fullName: "StoryKind-NameA",
          kind: "StoryKind",
          name: "NameA",
        },
        {
          fullName: "StoryKindB-NameB",
          kind: "StoryKindB",
          name: "NameB",
        },
      ],
    });

    await captureScreenshots();

    expect(remote).toHaveBeenCalledTimes(4);
    expect(remote).toHaveBeenCalledWith({
      capabilities: {
        "appium:automationName": "XCUITest",
        "appium:bundleId": "appId",
        "appium:deviceName": "iPhone 15",
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: ["-kind", "StoryKind", "-name", "Name A"],
        },
        platformName: "iOS",
      },
      hostname: "localhost",
      logLevel: "silent",
      port: 4723,
    });
    expect(remote).toHaveBeenCalledWith({
      capabilities: {
        "appium:automationName": "XCUITest",
        "appium:bundleId": "appId",
        "appium:deviceName": "iPhone 15",
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: ["-kind", "StoryKindB", "-name", "Name B"],
        },
        platformName: "iOS",
      },
      hostname: "localhost",
      logLevel: "silent",
      port: 4723,
    });
    expect(remote).toHaveBeenCalledWith({
      capabilities: {
        "appium:appActivity": ".MainActivity",
        "appium:appPackage": "appId",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": "Pixel_8_API_34",
        "appium:forceAppLaunch": true,
        "appium:optionalIntentArguments":
          "--es kind StoryKind --es name Name A",
        platformName: "Android",
      },
      hostname: "localhost",
      logLevel: "silent",
      port: 4723,
    });
    expect(remote).toHaveBeenCalledWith({
      capabilities: {
        "appium:appActivity": ".MainActivity",
        "appium:appPackage": "appId",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": "Pixel_8_API_34",
        "appium:forceAppLaunch": true,
        "appium:optionalIntentArguments":
          "--es kind StoryKindB --es name Name B",
        platformName: "Android",
      },
      hostname: "localhost",
      logLevel: "silent",
      port: 4723,
    });

    expect(mockTakeScreenshot).toHaveBeenCalledTimes(4);

    expect(writeFileSync).toHaveBeenCalledWith(
      "visual-regression/current/iPhone 15/StoryKindB-NameB.png",
      undefined,
      "base64",
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      "visual-regression/current/iPhone 15/StoryKind-NameA.png",
      undefined,
      "base64",
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      "visual-regression/current/Pixel_8_API_34/StoryKind-NameA.png",
      undefined,
      "base64",
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      "visual-regression/current/Pixel_8_API_34/StoryKindB-NameB.png",
      undefined,
      "base64",
    );
  });
});
