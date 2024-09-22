import {
  toKebabCase,
  findEmulatorByAvdName,
  findSimulatorIdBySimulatorName,
  getDeviceIdByName,
  approveChangesForScreenshots,
  buildScreenshotName,
} from "../utils";
import { execSync } from "child_process";
import fs from "fs";
import { logBlue, logGreen, logRed } from "../console";
import { Device } from "../types";

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  copyFileSync: jest.fn(),
}));
jest.mock("../console", () => ({
  logBlue: jest.fn(),
  logGreen: jest.fn(),
  logRed: jest.fn(),
}));

jest.mock("../index", () => ({
  VISUAL_REGRESSION_BASELINE_DIR: "VISUAL_REGRESSION_BASELINE_DIR",
  VISUAL_REGRESSION_CURRENT_DIR: "VISUAL_REGRESSION_CURRENT_DIR",
}));

describe("toKebabCase", () => {
  it("converts camelCase to kebab-case", () => {
    expect(toKebabCase("camelCaseString")).toBe("camel-case-string");
  });

  it("converts PascalCase to kebab-case", () => {
    expect(toKebabCase("PascalCaseString")).toBe("pascal-case-string");
  });
});

describe("findEmulatorByAvdName", () => {
  it("returns emulator ID when matching AVD name is found", () => {
    jest
      .mocked(execSync)
      .mockReturnValueOnce("emulator-5554\tdevice\n")
      .mockReturnValueOnce("targetAvdName");

    expect(findEmulatorByAvdName("targetAvdName")).toEqual("emulator-5554");
    expect(logBlue).toHaveBeenCalledWith(
      "Emulator ID for AVD 'targetAvdName' is: emulator-5554",
    );
  });

  it("throws error when no matching AVD name is found", () => {
    jest
      .mocked(execSync)
      .mockReturnValueOnce("emulator-5554\tdevice\n")
      .mockReturnValueOnce("nonMatchingAvdName");

    try {
      findEmulatorByAvdName("targetAvdName");
    } catch (e) {
      expect((e as Error).message).toEqual(
        "No running emulator found with AVD name 'targetAvdName'",
      );
    }
  });
});

describe("findSimulatorIdBySimulatorName", () => {
  it("returns simulator ID when device name matches", () => {
    jest
      .mocked(execSync)
      .mockReturnValueOnce("iPhone 12 (ABCD1234-1234) (Booted)");
    const simulatorId = findSimulatorIdBySimulatorName("iPhone 12");
    expect(simulatorId).toBe("ABCD1234-1234");
    expect(logBlue).toHaveBeenCalledWith(
      "Found device ID: ABCD1234-1234 for device name: iPhone 12",
    );
  });

  it("throws error when no booted device matches", () => {
    jest.mocked(execSync).mockReturnValueOnce("");
    expect(() => findSimulatorIdBySimulatorName("iPhone 12")).toThrow(
      "No booted device found with name 'iPhone 12'",
    );
  });
});

describe("getDeviceIdByName", () => {
  it("calls findEmulatorByAvdName for android platform", () => {
    const device: Device = { platform: "android", name: "Pixel_4" };
    jest
      .mocked(execSync)
      .mockReturnValueOnce("emulator-5554\tdevice\n")
      .mockReturnValueOnce("Pixel_4");

    expect(getDeviceIdByName(device)).toEqual("emulator-5554");
  });

  it("calls findSimulatorIdBySimulatorName for ios platform", () => {
    const device: Device = { platform: "ios", name: "iPhone 12" };
    jest
      .mocked(execSync)
      .mockReturnValueOnce("iPhone 12 (ABCD1234-1234) (Booted)");
    const simulatorId = getDeviceIdByName(device);
    expect(simulatorId).toBe("ABCD1234-1234");
  });
});

describe("approveChangesForScreenshots", () => {
  it("copies screenshot when it exists", () => {
    jest.mocked(fs.existsSync).mockReturnValueOnce(true);
    approveChangesForScreenshots(["screenshot1.png"]);
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining("screenshot1.png"),
      expect.stringContaining("screenshot1.png"),
    );
    expect(logGreen).toHaveBeenCalledWith(
      "Updated as new baseline:",
      "screenshot1.png",
    );
  });

  it("logs an error when screenshot does not exist", () => {
    jest.mocked(fs.existsSync).mockReturnValueOnce(false);
    approveChangesForScreenshots(["screenshot1.png"]);
    expect(logRed).toHaveBeenCalledWith(
      "Given",
      expect.stringContaining("screenshot1.png"),
      "does not exist",
    );
  });
});

describe("buildScreenshotName", () => {
  it("builds a correct screenshot name", () => {
    const name = buildScreenshotName("iPhone 12", "test-kind", "test-name");
    expect(name).toBe("iPhone 12-test-kind-test-name.png");
  });
});
