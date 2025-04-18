import { main } from "@/run";
import { processImages } from "@/images/images";
import { formatStoryFileToKindWithNames } from "@/storybook/stories";
import * as config from "@/config";
import * as args from "@/args";
import * as utils from "@/utils/utils";
import { cpSync } from "fs";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "@/paths";
import { captureScreenshots } from "@/driver";
import { initStore } from "@/store";

jest.mock("@/storybook/stories");
jest.mock("@/images/images");
jest.mock("@/args", () => ({
  isApproveChanges: undefined,
  fileFilter: undefined,
  storyFilter: undefined,
}));
jest.mock("@/utils/device");
jest.mock("@/config", () => ({
  devices: [{ platform: "ios", name: "iPhone 15" }],
}));

jest.mock("fs");
jest.mock("@/driver");
jest.mock("@/store");

describe("run", () => {
  it("should run flow for a single device", async () => {
    await main();

    expect(captureScreenshots).toHaveBeenCalledTimes(1);
    expect(processImages).toHaveBeenCalledTimes(1);
    expect(initStore).toHaveBeenCalledTimes(1);
  });

  it("should handle approve changes", async () => {
    // @ts-expect-error mock
    args.default.isApproveChanges = true;

    await main();

    expect(cpSync).toHaveBeenCalledWith(
      VISUAL_REGRESSION_CURRENT_DIR,
      VISUAL_REGRESSION_BASELINE_DIR,
      { recursive: true },
    );
  });

  it("should handle approva changes with a file filter", async () => {
    // @ts-expect-error mock
    args.default.isApproveChanges = true;
    // @ts-expect-error mock
    args.default.fileFilter = "someStoryFile";

    // @ts-expect-error test
    config.default.devices = [
      { platform: "ios", name: "iPhone 15" },
      { platform: "android", name: "Pixel 8" },
    ];

    jest.mocked(formatStoryFileToKindWithNames).mockReturnValue({
      Component: ["Basic", "SecondName"],
    });

    jest
      .spyOn(utils, "approveChangesForScreenshots")
      .mockReturnValue(undefined);

    await main();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "Component-Basic.png",
      "Component-SecondName.png",
    ]);
  });

  it("should handle approve changes with a file filter and story with nested folders name", async () => {
    // @ts-expect-error mock
    args.default.isApproveChanges = true;
    // @ts-expect-error mock
    args.default.fileFilter = "someStoryFile";

    // @ts-expect-error test
    config.default.devices = [
      { platform: "ios", name: "iPhone 15" },
      { platform: "android", name: "Pixel 8" },
    ];

    jest.mocked(formatStoryFileToKindWithNames).mockReturnValue({
      "Components/Calendar/Test": ["Basic", "SecondName"],
    });

    jest
      .spyOn(utils, "approveChangesForScreenshots")
      .mockReturnValue(undefined);

    await main();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "Calendar/Test/Components-Basic.png",
      "Calendar/Test/Components-SecondName.png",
    ]);
  });

  it("should handle approva changes with a story filter", async () => {
    // @ts-expect-error mock
    args.default.isApproveChanges = true;
    // @ts-expect-error mock
    args.default.storyFilter = "Component-SecondName";
    // @ts-expect-error mock
    args.default.fileFilter = undefined;

    // @ts-expect-error test
    config.default.devices = [
      { platform: "ios", name: "iPhone 15" },
      { platform: "android", name: "Pixel 8" },
    ];

    jest.mocked(formatStoryFileToKindWithNames).mockReturnValue({
      Component: ["Basic", "SecondName"],
    });

    jest
      .spyOn(utils, "approveChangesForScreenshots")
      .mockReturnValue(undefined);

    await main();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "Component-SecondName.png",
    ]);
  });

  it("should handle approve changes with a story filter and story with nested folders name", async () => {
    // @ts-expect-error mock
    args.default.isApproveChanges = true;
    // @ts-expect-error mock
    args.default.storyFilter = "Components/Calendar/Test-SecondName";
    // @ts-expect-error mock
    args.default.fileFilter = undefined;

    // @ts-expect-error test
    config.default.devices = [
      { platform: "ios", name: "iPhone 15" },
      { platform: "android", name: "Pixel 8" },
    ];

    jest.mocked(formatStoryFileToKindWithNames).mockReturnValue({
      "Components/Calendar/Test": ["Basic", "SecondName"],
    });

    jest
      .spyOn(utils, "approveChangesForScreenshots")
      .mockReturnValue(undefined);

    await main();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "Components/Calendar/Test-SecondName.png",
    ]);
  });
});
