import { generateMaestroFlow } from "@/maestro/maestro";
import { writeFileSync } from "fs";
import * as args from "@/args";

jest.mock("fs");
jest.mock("@/paths", () => ({
  VISUAL_REGRESSION_CURRENT_DIR: "VISUAL_REGRESSION_CURRENT_DIR",
}));
jest.mock("@/args", () => ({
  storyFilter: "",
}));
jest.mock("@/config", () => ({
  appId: "com.app.id",
  storiesDirectories: [],
}));

describe("maestro", () => {
  describe("generateMaestroFlow", () => {
    it("should generate flowfile and return image names for a story", () => {
      const kindWithNames = {
        StoryKind: ["NameA"],
      };
      const deviceName = "iPhone 15";

      expect(generateMaestroFlow(kindWithNames, deviceName)).toEqual({
        imageNames: ["iPhone 15-StoryKind-NameA.png"],
      });

      expect(jest.mocked(writeFileSync).mock.calls[0][1]).toMatchSnapshot();
    });

    it("should generate flowfile and return image names for a story with multiple names", () => {
      const kindWithNames = {
        StoryKind: ["NameA", "NameB"],
      };
      const deviceName = "iPhone 15";

      expect(generateMaestroFlow(kindWithNames, deviceName)).toEqual({
        imageNames: [
          "iPhone 15-StoryKind-NameA.png",
          "iPhone 15-StoryKind-NameB.png",
        ],
      });

      expect(jest.mocked(writeFileSync).mock.calls[0][1]).toMatchSnapshot();
    });

    it("should respect story filter if present", () => {
      // @ts-expect-error test
      args.default.storyFilter = "StoryKind-NameB";

      const kindWithNames = {
        StoryKind: ["NameA", "NameB"],
      };
      const deviceName = "iPhone 15";

      expect(generateMaestroFlow(kindWithNames, deviceName)).toEqual({
        imageNames: ["iPhone 15-StoryKind-NameB.png"],
      });

      expect(jest.mocked(writeFileSync).mock.calls[0][1]).toMatchSnapshot();
    });

    it("should respect story filter if present on multiple kinds", () => {
      // @ts-expect-error test
      args.default.storyFilter = "StoryKind-NameB";

      const kindWithNames = {
        StoryKind: ["NameA", "NameB"],
        StoryKindB: ["NameC", "NameD"],
      };
      const deviceName = "iPhone 15";

      expect(generateMaestroFlow(kindWithNames, deviceName)).toEqual({
        imageNames: ["iPhone 15-StoryKind-NameB.png"],
      });

      expect(jest.mocked(writeFileSync).mock.calls[0][1]).toMatchSnapshot();
    });
  });
});
