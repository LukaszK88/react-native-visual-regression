import { devices } from "@/config";
import { logBlue, logGreen, logRed } from "@/console";
import { Device } from "@/types";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function isEmulatorRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`adb devices`);
    return stdout.includes("emulator-");
  } catch (error) {
    console.error("Error checking emulator status:", error);
    return false;
  }
}

async function startEmulator(device: Device) {
  try {
    logBlue(device.name, "Starting emulator");

    const emulatorProcess = spawn(
      "emulator",
      ["-avd", device.name, "-no-snapshot-load"],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    emulatorProcess.unref();

    logBlue(device.name, "Emulator started. Waiting for the device to boot...");

    await waitForDevice();

    logGreen(device.name, "Emulator is ready.");
  } catch (error) {
    logRed(device.name, "Error starting emulator:", error);
  }
}

// Function to wait for the emulator to boot
async function waitForDevice() {
  try {
    let deviceReady = false;

    while (!deviceReady) {
      // Check the status of connected devices
      const { stdout } = await execAsync("adb devices");
      const devices = stdout
        .split("\n")
        .filter((line) => line.includes("emulator"));

      if (devices.some((line) => line.includes("offline"))) {
        logBlue("Emulator is offline. Waiting...");
      } else if (devices.some((line) => line.includes("device"))) {
        logBlue("Emulator is online. Checking boot status...");
        // Check if the device has completed booting
        const { stdout: bootStatus } = await execAsync(
          "adb shell getprop sys.boot_completed",
        );
        if (bootStatus.trim() === "1") {
          deviceReady = true;
        } else {
          logBlue("Emulator is online but still booting...");
        }
      } else {
        logBlue("No emulator found. Waiting...");
      }

      // Wait 2 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    logRed("Error while waiting for the emulator:", error);
    throw error;
  }
}

export const warmUpDevices = async () => {
  await Promise.all(
    devices.map(async (device) => {
      if (device.platform === "android") {
        const running = await isEmulatorRunning();
        if (running) {
          logBlue(device.name, "is already running.");
        } else {
          await startEmulator(device);
        }
      }
    }),
  );
};
