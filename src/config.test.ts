import * as args from "@/args";

jest.mock("@/args", () => ({
  devicesFilter: undefined,
}));

describe("config", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("should filter devices from the config by device filter", () => {
    // @ts-expect-error mock
    args.default.devicesFilter = ["iPhone 15"];

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { devices } = require("./config");

    expect(devices).toEqual([{ name: "iPhone 15", platform: "ios" }]);
  });

  it("should filter devices without the device filter applied", () => {
    // @ts-expect-error mock
    args.default.devicesFilter = undefined;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { devices } = require("./config");

    expect(devices).toEqual([
      { name: "Pixel_8_API_35", platform: "android" },
      { name: "iPhone 15", platform: "ios" },
    ]);
  });
});
