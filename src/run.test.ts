import { main } from "@/run";
import { getDeviceIdByName } from "@/utils/device";
import { generateMaestroFlow, runMaestroFlow } from "@/maestro/maestro";
import { orchestrateImages } from "@/images";
import { getVRStories } from "@/storybook/stories";
import * as config from "@/config";

jest.mock("@/storybook/stories");
jest.mock("@/maestro/installation");
jest.mock("@/maestro/maestro");
jest.mock("@/images");
jest.mock("@/utils/device");
jest.mock("@/config", () => ({
  devices: [{ platform: "ios", name: "iPhone 15" }],
}));
jest.mock("@/args", () => ({}));

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
});
