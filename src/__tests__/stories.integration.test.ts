import { formatStoryFileToKindWithNames } from "../stories";

jest.mock("../index", () => ({
  STORIES_DIR_PATH: ["/path/to/stories"],
  fileFilter: null,
}));

describe("formatStoryFileToKindWithNames", () => {
  it("should return KindWithNames object with title and exports", () => {
    const result = formatStoryFileToKindWithNames(
      "src/__tests__/long-kind.story.ts",
    );
    expect(result).toEqual({
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
  });
});
