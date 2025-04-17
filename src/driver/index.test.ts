import { vrStore } from "@/store";
import { deviceStore } from "@/stores/deviceStore";
import { captureScreenshots } from ".";
import { remote } from "webdriverio";
import { writeFileSync } from "fs";
import { ChildProcess, exec } from "child_process";

jest.mock("@/store", () => ({
  vrStore: {
    getState: jest.fn(),
  },
}));

jest.mock("child_process", () => ({
  spawn: () => ({
    kill: jest.fn(),
  }),
  exec: jest.fn(),
}));

const mockTakeScreenshot = jest.fn();
const mock$ = jest.fn();
jest.mock("webdriverio", () => ({
  remote: jest.fn(() => ({
    $: mock$,
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
  androidConfig: {
    activity: ".MainActivity",
  },
}));

describe("index", () => {
  beforeEach(() => {
    mock$.mockReturnValue({
      waitForDisplayed: jest.fn(),
    });

    jest.spyOn(deviceStore, "getState").mockReturnValue({
      devices: {
        "iPhone 15": [{ name: "iPhone 15", id: "uuid" }],
        Pixel_8_API_34: [{ name: "Pixel_8_API_34", id: "id" }],
      },
    });
  });

  it("should run pararell driver run for different platforms", async () => {
    jest
      .mocked(exec)
      .mockImplementation(
        (cmd, options, callback) =>
          callback?.(null, "stdout", "stderr") as unknown as ChildProcess,
      );
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
        "appium:udid": "uuid",
        "appium:connectHardwareKeyboard": true,
        "appium:hideKeyboard": true,
        "appium:wdaLocalPort": 4830,
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: [
            "-kind",
            "StoryKind",
            "-name",
            "Name A",
            "-visualRegression",
            "true",
          ],
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
        "appium:connectHardwareKeyboard": true,
        "appium:hideKeyboard": true,
        "appium:udid": "uuid",
        "appium:wdaLocalPort": 4830,
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: [
            "-kind",
            "StoryKindB",
            "-name",
            "Name B",
            "-visualRegression",
            "true",
          ],
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
        "appium:udid": "id",
        "appium:systemPort": 4730,
        "appium:forceAppLaunch": true,
        "appium:hideKeyboard": true,
        "appium:optionalIntentArguments":
          '--es kind StoryKind --es name "Name A" --es visualRegression true',
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
        "appium:udid": "id",
        "appium:systemPort": 4730,
        "appium:forceAppLaunch": true,
        "appium:hideKeyboard": true,
        "appium:optionalIntentArguments":
          '--es kind StoryKindB --es name "Name B" --es visualRegression true',
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

  it("should run pararell driver run for different platforms on multiple devices", async () => {
    jest
      .mocked(exec)
      .mockImplementation(
        (cmd, options, callback) =>
          callback?.(null, "stdout", "stderr") as unknown as ChildProcess,
      );
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

    jest.spyOn(deviceStore, "getState").mockReturnValue({
      devices: {
        "iPhone 15": [
          { name: "iPhone 15", id: "uuid" },
          { name: "iPhone 15_2", id: "uuid-2" },
        ],
        Pixel_8_API_34: [
          { name: "Pixel_8_API_34", id: "id" },
          { name: "Pixel_8_API_34_2", id: "id-2" },
        ],
      },
    });

    await captureScreenshots();

    expect(remote).toHaveBeenCalledTimes(4);
    expect(remote).toHaveBeenCalledWith({
      capabilities: {
        "appium:automationName": "XCUITest",
        "appium:bundleId": "appId",
        "appium:connectHardwareKeyboard": true,
        "appium:hideKeyboard": true,
        "appium:udid": "uuid",
        "appium:wdaLocalPort": 4830,
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: [
            "-kind",
            "StoryKind",
            "-name",
            "Name A",
            "-visualRegression",
            "true",
          ],
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
        "appium:connectHardwareKeyboard": true,
        "appium:hideKeyboard": true,
        "appium:udid": "uuid-2",
        "appium:wdaLocalPort": 4831,
        "appium:platformVersion": "17.5",
        "appium:processArguments": {
          args: [
            "-kind",
            "StoryKindB",
            "-name",
            "Name B",
            "-visualRegression",
            "true",
          ],
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
        "appium:udid": "id",
        "appium:systemPort": 4730,
        "appium:forceAppLaunch": true,
        "appium:hideKeyboard": true,
        "appium:optionalIntentArguments":
          '--es kind StoryKind --es name "Name A" --es visualRegression true',
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
        "appium:udid": "id-2",
        "appium:systemPort": 4731,
        "appium:forceAppLaunch": true,
        "appium:hideKeyboard": true,
        "appium:optionalIntentArguments":
          '--es kind StoryKindB --es name "Name B" --es visualRegression true',
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

  it("should handle drivers set up failure", async () => {
    jest
      .mocked(exec)
      .mockImplementation(
        (cmd, options, callback) =>
          callback?.(
            new Error("ups"),
            "stdout",
            "stderr",
          ) as unknown as ChildProcess,
      );
    await captureScreenshots();

    expect(remote).toHaveBeenCalledTimes(4);
    expect(mockTakeScreenshot).toHaveBeenCalledTimes(4);
  });

  it("should hoist story processing failure", async () => {
    jest
      .mocked(exec)
      .mockImplementation(
        (cmd, options, callback) =>
          callback?.(null, "stdout", "stderr") as unknown as ChildProcess,
      );
    mockTakeScreenshot.mockRejectedValue(new Error("ups"));

    try {
      await captureScreenshots();
    } catch (e) {
      expect(remote).toHaveBeenCalledTimes(2);
      expect(mockTakeScreenshot).toHaveBeenCalledTimes(2);

      expect(e).toEqual(new Error("test run failed"));
    }
  });

  it("should handle caps only story name", async () => {
    jest
      .mocked(exec)
      .mockImplementation(
        (cmd, options, callback) =>
          callback?.(null, "stdout", "stderr") as unknown as ChildProcess,
      );
    jest.mocked(vrStore.getState).mockReturnValue({
      stories: [
        {
          fullName: "StoryKind-EUR",
          kind: "StoryKind",
          name: "EUR",
        },
      ],
    });
    mockTakeScreenshot.mockResolvedValue("");

    await captureScreenshots();

    expect(remote).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilities: expect.objectContaining({
          "appium:processArguments": expect.objectContaining({
            args: [
              "-kind",
              "StoryKind",
              "-name",
              "EUR",
              "-visualRegression",
              "true",
            ],
          }),
        }),
      }),
    );
    expect(remote).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilities: expect.objectContaining({
          "appium:optionalIntentArguments":
            '--es kind StoryKind --es name "EUR" --es visualRegression true',
        }),
      }),
    );

    expect(mock$).toHaveBeenCalledWith("~storykind--eur");
    expect(mock$).toHaveBeenCalledWith(
      'android=new UiSelector().resourceId("storykind--eur")',
    );
  });
});
