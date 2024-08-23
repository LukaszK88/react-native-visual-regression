import fs from "fs";
import { join } from "path";
// @ts-ignore
import arg from "arg";
import { generateMaestroFlow, runMaestroFlow } from "./maestro";
import { orchestrateImages } from "./images";

const args = arg({
  // Types
  "--approve": Boolean,
  "--file": String,
  "--story": String, // kind-name
  "--storiesDirectories": [String],
  "--appId": String,
  "--device": String,
  // Aliases
  "-a": "--approve",
  "-f": "--file",
  "-s": "--story",
});

const isApproveChanges = args["--approve"];
export const fileFilter = args["--file"];
export const storyFilter = args["--story"];
export const appId = args["--appId"];
export const device = args["--device"];

export const STORIES_DIR_PATH = args["--storiesDirectories"] || ["./"];

export const VISUAL_REGRESSION_DIR = "visual-regression";
export const VISUAL_REGRESSION_DIFF_DIR = join(VISUAL_REGRESSION_DIR, "diff");
export const VISUAL_REGRESSION_CURRENT_DIR = join(VISUAL_REGRESSION_DIR, "current");
export const VISUAL_REGRESSION_BASELINE_DIR = join(VISUAL_REGRESSION_DIR, "baseline");

const runVisualRegression = async () => {
  const { flowFilePath, imageNames } = generateMaestroFlow();

  await runMaestroFlow(flowFilePath);

  orchestrateImages(imageNames);
};

const main = () => {
  if (isApproveChanges) {
    fs.cpSync(VISUAL_REGRESSION_CURRENT_DIR, VISUAL_REGRESSION_BASELINE_DIR, {
      recursive: true,
    });
    console.log("Changes approved");
    return;
  }
  runVisualRegression();
};

main();

// TODO: console colours & better output
// TODO: run time in report
