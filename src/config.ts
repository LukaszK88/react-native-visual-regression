import path from "path";
import { Device } from "@/types";

function getRootConfigPath() {
  const rootDir = process.cwd();
  return path.join(rootDir, "rn-vr.config.js");
}

const configPath = getRootConfigPath();

// eslint-disable-next-line  @typescript-eslint/no-require-imports
export const config = require(configPath) as {
  devices: Device[];
  appId: string;
  storiesDirectories: string[];
};

export const appId = config.appId;
export const storiesDirectories = config.storiesDirectories;
export const devices = config.devices;
