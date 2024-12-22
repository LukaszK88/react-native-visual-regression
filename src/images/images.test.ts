import { PNG } from "pngjs";
import { processImages } from "./images";
import { access, mkdir, readdir, rename, writeFile } from "fs/promises";

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

describe("images", () => {
  it("should do nothing if there are no images to process", async () => {
    expect(await processImages([], "Pixel")).toBeUndefined();
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

    await processImages(["StoryKind-NameA.png"], "Pixel");

    expect(mkdir).toHaveBeenCalledWith("visual-regression/baseline", {
      recursive: true,
    });
    expect(mkdir).toHaveBeenCalledWith("visual-regression/diff", {
      recursive: true,
    });

    expect(access).toHaveBeenCalledWith(
      "visual-regression/baseline/StoryKind-NameA.png",
    );
    expect(rename).toHaveBeenCalledWith(
      "visual-regression/current/StoryKind-NameA.png",
      "visual-regression/baseline/StoryKind-NameA.png",
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

    await processImages(["StoryKind-NameA.png"], "Pixel");

    expect(mkdir).toHaveBeenCalledWith("visual-regression/baseline", {
      recursive: true,
    });
    expect(mkdir).toHaveBeenCalledWith("visual-regression/diff", {
      recursive: true,
    });

    expect(access).toHaveBeenCalledWith(
      "visual-regression/baseline/StoryKind-NameA.png",
    );
    expect(rename).not.toHaveBeenCalled();

    expect(PNG.sync.read).toHaveBeenCalledTimes(2);

    expect(mockPixelmatch).toHaveBeenCalledWith([], [], undefined, 100, 200, {
      threshold: 0.1,
    });

    expect(writeFile).toHaveBeenCalledWith(
      "visual-regression/diff/StoryKind-NameA.png",
      undefined,
    );
  });
});
