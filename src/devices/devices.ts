import { devices } from "@/config";
import { warmUpEmulator } from "./android";
import { startSimulator } from "./ios";

export const warmUpDevices = async () => {
  await Promise.all(
    devices.map(async (device) => {
      if (device.platform === "android") {
        return warmUpEmulator(device);
      }

      return startSimulator(device);
    }),
  );
};
