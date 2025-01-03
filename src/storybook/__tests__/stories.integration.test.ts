import {
  formatStoryFileToKindWithNames,
  getVRStories,
} from "@/storybook/stories";
import * as args from "@/args";
import * as config from "@/config";

jest.mock("@/config", () => ({
  storiesDirectories: ["/path/to/stories"],
}));

jest.mock("@/args", () => ({
  fileFilter: undefined,
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
    config.default.storiesDirectories = ["src/storybook/fixtures"];

    expect(getVRStories()).toEqual({
      Component: ["Basic", "SecondName"],
      ComponentC: ["Basic", "EUR"],
      ComponentB: ["Basic", "Second", "Third", "Fourth"],
      SomeComponentWithVerLongNameWhichWillEndOnNextLine: ["Basic"],
    });
  });

  it("should respect a file filter", () => {
    // @ts-expect-error test
    config.default.storiesDirectories = ["src/storybook/fixtures"];
    // @ts-expect-error test
    args.default.fileFilter =
      "src/storybook/fixtures/multiple-names.stories.tsx";

    expect(getVRStories()).toEqual({
      Component: ["Basic", "SecondName"],
    });
  });
});
