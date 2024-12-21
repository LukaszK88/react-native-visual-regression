import { generateMaestroFlow } from "@/maestro/maestro";
import { writeFileSync } from "fs";
import * as index from "@/index";

jest.mock("fs");
jest.mock("@/index", () => ({
  storyFilter: "",
  appId: "com.app.id",
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
      index.default.storyFilter = "StoryKind-NameB";

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
      index.default.storyFilter = "StoryKind-NameB";

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
