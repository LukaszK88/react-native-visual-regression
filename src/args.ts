import arg from "arg";

const input = arg({
  // Types
  "--approve": Boolean,
  "--file": String,
  "--story": String, // kind-name
  "--device": [String],
  "--migrateToV2": Boolean,
  // Aliases
  "-a": "--approve",
  "-f": "--file",
  "-s": "--story",
  "-d": "--device",
});

export const isApproveChanges = input["--approve"];
export const fileFilter = input["--file"];
export const storyFilter = input["--story"];
export const devicesFilter = input["--device"];
export const migrateToV2 = input["--migrateToV2"];

export const isFilterApplied = fileFilter || storyFilter || devicesFilter;
