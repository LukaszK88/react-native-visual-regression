import {
  formatStoryFileToKindWithNames,
  getVRStories,
} from "@/storybook/stories";
import * as index from "@/index";

jest.mock("@/index", () => ({
  STORIES_DIR_PATH: ["/path/to/stories"],
  fileFilter: null,
}));

describe("formatStoryFileToKindWithNames", () => {
  it("should return KindWithNames object with title and exports for a very long name", () => {
    const result = formatStoryFileToKindWithNames(
      "src/storybook/fixtures/long-kind.stories.tsx",
    );
    expect(result).toEqual({
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
  });

  it("should return KindWithNames object with title and exports for multiple names", () => {
    const result = formatStoryFileToKindWithNames(
      "src/storybook/fixtures/multiple-names.stories.tsx",
    );
    expect(result).toEqual({
      Component: ["Basic", "SecondName"],
    });
  });

  it("should return KindWithNames object with title and exports when there are other params present", () => {
    const result = formatStoryFileToKindWithNames(
      "src/storybook/fixtures/other-parameters.stories.tsx",
    );
    expect(result).toEqual({
      ComponentB: ["Basic", "Second", "Third", "Fourth"],
    });
  });
});

describe("getVRStories", () => {
  it("should return kind with names for a directory", () => {
    // @ts-expect-error test
    index.default.STORIES_DIR_PATH = ["src/storybook/fixtures"];

    expect(getVRStories()).toEqual({
      Component: ["Basic", "SecondName"],
      ComponentB: ["Basic", "Second", "Third", "Fourth"],
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
  });

  it("should respect a file filter", () => {
    // @ts-expect-error test
    index.default.STORIES_DIR_PATH = ["src/storybook/fixtures"];
    // @ts-expect-error test
    index.default.fileFilter =
      "src/storybook/fixtures/multiple-names.stories.tsx";

    expect(getVRStories()).toEqual({
      Component: ["Basic", "SecondName"],
    });
  });
});
