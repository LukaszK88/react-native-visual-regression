import arg from "arg";

const input = arg({
  // Types
  "--approve": Boolean,
  "--file": String,
  "--story": String, // kind-name
  "--device": [String],
  "--migrateToV2": Boolean,
  "--verbose": Boolean,
  "--reportFormat": String, // md | html
  "--apkPath": String,
  "--appPath": String,
  "--maskHomeBar": Boolean,
  "--driverLogLevel": String, // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
  "--reinstallApp": Boolean,
  // Aliases
  "-a": "--approve",
  "-f": "--file",
  "-s": "--story",
  "-d": "--device",
  "-v": "--verbose",
  "-rf": "--reportFormat",
  "-r": "--reinstallApp",
});

export const isApproveChanges = input["--approve"];
export const fileFilter = input["--file"];
export const storyFilter = input["--story"];
export const devicesFilter = input["--device"];
export const migrateToV2 = input["--migrateToV2"];
export const isVerbose = input["--verbose"];
export const reportFormat = input["--reportFormat"] ?? "md";
export const apkPath = input["--apkPath"];
export const appPath = input["--appPath"];
export const maskHomeBar = input["--maskHomeBar"];
export const driverLogLevel = input["--driverLogLevel"] ?? "silent";
export const reinstallApp = input["--reinstallApp"] ?? false;

export const isFilterApplied = fileFilter || storyFilter || devicesFilter;
