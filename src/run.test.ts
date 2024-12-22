import { main } from "@/run";
import { getDeviceIdByName } from "@/utils/device";
import { generateMaestroFlow, runMaestroFlow } from "@/maestro/maestro";
import { orchestrateImages } from "@/images";
import {
  formatStoryFileToKindWithNames,
  getVRStories,
} from "@/storybook/stories";
import * as config from "@/config";
import * as args from "@/args";
import * as utils from "@/utils/utils";
import { cpSync } from "fs";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
} from "@/paths";

jest.mock("@/storybook/stories");
jest.mock("@/maestro/installation");
jest.mock("@/maestro/maestro");
jest.mock("@/images");
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

describe("run", () => {
  it("should run flow for a single device", async () => {
    jest.mocked(getVRStories).mockReturnValue({
      Component: ["Basic", "SecondName"],
      ComponentB: ["Basic", "Second", "Third", "Fourth"],
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
    jest.mocked(getDeviceIdByName).mockReturnValue("deviceId");
    jest.mocked(generateMaestroFlow).mockReturnValue({
      imageNames: ["imageA", "imageB"],
    });

    await main();

    expect(generateMaestroFlow).toHaveBeenCalledWith(
      {
        Component: ["Basic", "SecondName"],
        ComponentB: ["Basic", "Second", "Third", "Fourth"],
        SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
      },
      "iPhone 15",
    );
    expect(generateMaestroFlow).toHaveBeenCalledTimes(1);

    expect(runMaestroFlow).toHaveBeenCalledWith("deviceId");
    expect(runMaestroFlow).toHaveBeenCalledTimes(1);

    expect(orchestrateImages).toHaveBeenCalledWith(
      ["imageA", "imageB"],
      "iPhone 15",
    );
    expect(orchestrateImages).toHaveBeenCalledTimes(1);
  });
  it("should run flow for a multiple devices", async () => {
    // @ts-expect-error test
    config.default.devices = [
      { platform: "ios", name: "iPhone 15" },
      { platform: "android", name: "Pixel 8" },
    ];

    jest.mocked(getVRStories).mockReturnValue({
      Component: ["Basic", "SecondName"],
      ComponentB: ["Basic", "Second", "Third", "Fourth"],
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
    jest.mocked(getDeviceIdByName).mockReturnValueOnce("deviceId");
    jest.mocked(getDeviceIdByName).mockReturnValueOnce("deviceId2");
    jest.mocked(generateMaestroFlow).mockReturnValue({
      imageNames: ["imageA", "imageB"],
    });

    await main();

    expect(generateMaestroFlow).toHaveBeenCalledWith(
      {
        Component: ["Basic", "SecondName"],
        ComponentB: ["Basic", "Second", "Third", "Fourth"],
        SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
      },
      "iPhone 15",
    );

    expect(generateMaestroFlow).toHaveBeenCalledWith(
      {
        Component: ["Basic", "SecondName"],
        ComponentB: ["Basic", "Second", "Third", "Fourth"],
        SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
      },
      "Pixel 8",
    );
    expect(generateMaestroFlow).toHaveBeenCalledTimes(2);

    expect(runMaestroFlow).toHaveBeenCalledWith("deviceId");
    expect(runMaestroFlow).toHaveBeenCalledWith("deviceId2");
    expect(runMaestroFlow).toHaveBeenCalledTimes(2);

    expect(orchestrateImages).toHaveBeenCalledWith(
      ["imageA", "imageB"],
      "iPhone 15",
    );
    expect(orchestrateImages).toHaveBeenCalledWith(
      ["imageA", "imageB"],
      "Pixel 8",
    );
    expect(orchestrateImages).toHaveBeenCalledTimes(2);
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
    expect(generateMaestroFlow).not.toHaveBeenCalled();
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
    expect(generateMaestroFlow).not.toHaveBeenCalled();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "iPhone 15-Component-Basic.png",
      "iPhone 15-Component-SecondName.png",
      "Pixel 8-Component-Basic.png",
      "Pixel 8-Component-SecondName.png",
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
    expect(generateMaestroFlow).not.toHaveBeenCalled();

    expect(utils.approveChangesForScreenshots).toHaveBeenCalledWith([
      "iPhone 15-Component-SecondName.png",
      "Pixel 8-Component-SecondName.png",
    ]);
  });
});
