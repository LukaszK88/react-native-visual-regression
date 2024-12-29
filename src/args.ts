import arg from "arg";

const input = arg({
  // Types
  "--approve": Boolean,
  "--file": String,
  "--story": String, // kind-name
  "--device": [String],
  "--migrateToV2": Boolean,
  "--verbose": Boolean,
  // Aliases
  "-a": "--approve",
  "-f": "--file",
  "-s": "--story",
  "-d": "--device",
  "-v": "--verbose",
});

export const isApproveChanges = input["--approve"];
export const fileFilter = input["--file"];
export const storyFilter = input["--story"];
export const devicesFilter = input["--device"];
export const migrateToV2 = input["--migrateToV2"];
export const isVerbose = input["--verbose"];

export const isFilterApplied = fileFilter || storyFilter || devicesFilter;
