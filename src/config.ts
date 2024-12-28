import path from "path";
import { Device } from "@/types";
import { devicesFilter } from "@/args";

function getRootConfigPath() {
  const rootDir = process.cwd();
  return path.join(rootDir, "rn-vr.config.js");
}

const configPath = getRootConfigPath();

interface AndroidConfig {
  activity: string;
}

// eslint-disable-next-line  @typescript-eslint/no-require-imports
export const config = require(configPath) as {
  devices: Device[];
  appId: string;
  android: AndroidConfig;
  storiesDirectories: string[];
};

export const appId = config.appId;
export const storiesDirectories = config.storiesDirectories;
export const androidConfig = config.android;

export const devices = devicesFilter
  ? config.devices.filter((device) => devicesFilter?.includes(device.name))
  : config.devices;
