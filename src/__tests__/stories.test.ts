import { getVRStories, formatStoryFileToKindWithNames } from "../stories";
import fs from "fs";
import * as path from "path";

// Mock file system methods
jest.mock("fs");
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  resolve: jest.fn(),
}));

jest.mock("../index", () => ({
  STORIES_DIR_PATH: ["/path/to/stories"],
  fileFilter: null,
}));

describe("formatStoryFileToKindWithNames", () => {
  it("should return KindWithNames object with title and exports", () => {
    const mockTitle = "MyStory/Component";

    jest.spyOn(path, "resolve").mockReturnValue("/path/to/story");
    jest
      .mocked(fs.readFileSync)
      .mockReturnValueOnce(`export default { title: '${mockTitle}' };`);
    jest.mocked(fs.readFileSync).mockReturnValueOnce(`
        export const Example1: StoryObj<any> = { parameters: { visualRegression: true } };
        export const Example2: StoryObj<any> = { parameters: { visualRegression: true } };
      `);

    const result = formatStoryFileToKindWithNames("/path/to/story");
    expect(result).toEqual({
      "MyStory/Component": ["Example1", "Example2"],
    });
  });
});

describe("getVRStories", () => {
  it("should gather VR stories and return a KindWithNames object", () => {
    const mockStoryFile = "/path/to/story.stories.tsx";
    // @ts-expect-error minimal mock
    jest.mocked(fs.readdirSync).mockReturnValueOnce([mockStoryFile]);
    // @ts-expect-error minimal mock
    jest.mocked(fs.statSync).mockReturnValueOnce({ isDirectory: () => false });
    jest
      .mocked(fs.readFileSync)
      .mockReturnValueOnce(`export default { title: 'MyStory' };`);
    jest.mocked(fs.readFileSync).mockReturnValueOnce(`
        export const Example1: StoryObj<any> = { parameters: { visualRegression: true } };
      `);

    const result = getVRStories();
    expect(result).toEqual({
      MyStory: ["Example1"],
    });
  });
});
