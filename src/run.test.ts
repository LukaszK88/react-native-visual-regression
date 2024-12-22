import { main } from "@/run";
import { getDeviceIdByName } from "@/utils/device";
import { generateMaestroFlow, runMaestroFlow } from "@/maestro/maestro";
import { orchestrateImages } from "@/images";
import { getVRStories } from "./storybook/stories";

jest.mock("@/storybook/stories");
jest.mock("@/maestro/installation");
jest.mock("@/maestro/maestro");
jest.mock("@/images");
jest.mock("@/utils/device");
jest.mock("@/config", () => ({
  config: {
    storiesDirectories: ["src/storybook/fixtures"],
    appId: "appId",
    devices: [{ platform: "ios", name: "iPhone 15" }],
  },
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

    expect(runMaestroFlow).toHaveBeenCalledWith("deviceId");
    expect(orchestrateImages).toHaveBeenCalledWith(
      ["imageA", "imageB"],
      "iPhone 15",
    );
  });
});
