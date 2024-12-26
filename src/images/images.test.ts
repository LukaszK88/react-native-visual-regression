import { PNG } from "pngjs";
import { processImages } from "./images";
import { access, mkdir, readdir, rename, writeFile } from "fs/promises";
import { vrStore } from "@/store";

const mockPixelmatch = jest.fn();
jest.mock("pixelmatch", () => ({
  __esModule: true,
  default: mockPixelmatch,
}));

jest.mock("fs/promises");

jest.mock("pngjs", () => {
  class PNG {
    static sync = {
      read: jest.fn(),
      write: jest.fn(),
    };
  }
  return {
    PNG,
  };
});

jest.mock("@/store", () => ({
  vrStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/args");
jest.mock("@/config", () => ({
  devices: [{ platform: "ios", name: "iPhone 15" }],
}));

describe("images", () => {
  it("should do nothing if there are no images to process", async () => {
    jest.mocked(vrStore.getState).mockReturnValue({ stories: [] });

    expect(await processImages()).toBeUndefined();
  });

  it("should handle images without a baseline", async () => {
    jest.mocked(PNG.sync.read).mockReturnValue({
      width: 100,
      height: 200,
      // @ts-expect-error mock
      data: [],
    });

    jest.mocked(readdir).mockResolvedValue([]);
    jest.mocked(access).mockRejectedValue("does not exist");

    jest.mocked(vrStore.getState).mockReturnValue({
      stories: [
        {
          fullName: "StoryKind-NameA",
          kind: "StoryKind",
          name: "NameA",
        },
      ],
    });

    await processImages();

    expect(mkdir).toHaveBeenCalledWith("visual-regression/baseline", {
      recursive: true,
    });
    expect(mkdir).toHaveBeenCalledWith("visual-regression/diff", {
      recursive: true,
    });

    expect(access).toHaveBeenCalledWith(
      "visual-regression/baseline/iPhone 15/StoryKind-NameA.png",
    );
    expect(rename).toHaveBeenCalledWith(
      "visual-regression/current/iPhone 15/StoryKind-NameA.png",
      "visual-regression/baseline/iPhone 15/StoryKind-NameA.png",
    );
  });

  it("should handle images witha a baseline to assert against", async () => {
    jest.mocked(PNG.sync.read).mockReturnValue({
      width: 100,
      height: 200,
      // @ts-expect-error mock
      data: [],
    });

    jest.mocked(readdir).mockResolvedValue([]);
    jest.mocked(access).mockResolvedValue(undefined);

    jest.mocked(vrStore.getState).mockReturnValue({
      stories: [
        {
          fullName: "StoryKind-NameA",
          kind: "StoryKind",
          name: "NameA",
        },
      ],
    });

    await processImages();

    expect(mkdir).toHaveBeenCalledWith("visual-regression/baseline", {
      recursive: true,
    });
    expect(mkdir).toHaveBeenCalledWith("visual-regression/diff", {
      recursive: true,
    });

    expect(access).toHaveBeenCalledWith(
      "visual-regression/baseline/iPhone 15/StoryKind-NameA.png",
    );
    expect(rename).not.toHaveBeenCalled();

    expect(PNG.sync.read).toHaveBeenCalledTimes(2);

    expect(mockPixelmatch).toHaveBeenCalledWith([], [], undefined, 100, 200, {
      threshold: 0.1,
    });

    expect(writeFile).toHaveBeenCalledWith(
      "visual-regression/diff/iPhone 15/StoryKind-NameA.png",
      undefined,
    );
  });
});
