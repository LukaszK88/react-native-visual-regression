import { devices } from "@/config";
import { logBlue, logGreen, logRed } from "@/console";
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

async function startEmulator(deviceName: string) {
  try {
    logBlue(deviceName, "Starting emulator");

    const emulatorProcess = spawn(
      "emulator",
      ["-avd", deviceName, "-no-snapshot-load"],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    emulatorProcess.unref();

    logBlue(deviceName, "Emulator started. Waiting for the device to boot...");

    await waitForEmulator();

    logGreen(deviceName, "Emulator is ready.");
  } catch (error) {
    logRed(deviceName, "Error starting emulator:", error);
  }
}

async function waitForEmulator() {
  try {
    let deviceReady = false;

    while (!deviceReady) {
      const { stdout } = await execAsync("adb devices");
      const devices = stdout
        .split("\n")
        .filter((line) => line.includes("emulator"));

      if (devices.some((line) => line.includes("offline"))) {
        logBlue("Emulator is offline. Waiting...");
      } else if (devices.some((line) => line.includes("device"))) {
        logBlue("Emulator is online. Checking boot status...");
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

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    logRed("Error while waiting for the emulator:", error);
    throw error;
  }
}

const warmUpEmulator = async (deviceName: string) => {
  const running = await isEmulatorRunning();
  if (running) {
    logBlue(deviceName, "is already running.");
  } else {
    await startEmulator(deviceName);
  }
};

async function listSimulators() {
  try {
    const { stdout } = await execAsync("xcrun simctl list devices");
    return stdout;
  } catch (error) {
    logRed("Error listing simulators:", error);
    throw error;
  }
}

async function startSimulator(simulatorName: string) {
  try {
    logBlue(`Finding simulator: ${simulatorName}`);

    const simulatorsOutput = await listSimulators();
    const simulators = parseSimulators(simulatorsOutput);

    const simulator = simulators.find((sim) => sim.name === simulatorName);
    if (!simulator) {
      throw new Error(`Simulator "${simulatorName}" not found or unavailable.`);
    }

    if (simulator.status === "Booted") {
      logBlue(simulatorName, "Already Booted");

      return;
    }

    logBlue(`Booting simulator: ${simulator.name} (${simulator.udid})`);

    await execAsync(`xcrun simctl boot ${simulator.udid}`);

    logBlue(simulator.name, "started. Waiting for it to be ready...");

    await execAsync("open -a Simulator");

    await waitForSimulator(simulator.udid);

    logBlue(`Simulator "${simulator.name}" is ready.`);
  } catch (error) {
    logRed("Error starting simulator:", error);
    throw error;
  }
}

async function waitForSimulator(udid: string) {
  let simulatorReady = false;

  while (!simulatorReady) {
    try {
      const { stdout } = await execAsync(`xcrun simctl bootstatus ${udid} -b`);

      if (stdout.includes("Finished")) {
        simulatorReady = true;
      } else {
        logBlue("Simulator is still booting...");
      }
    } catch (error) {
      logRed("Simulator is not ready yet. Retrying...", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  logBlue("Simulator is ready!");
}

function parseSimulators(output: string) {
  const simulators: {
    name: string;
    udid: string;
    status: "Booted" | "Shutdown";
  }[] = [];
  const lines = output.split("\n");

  lines.forEach((line) => {
    const deviceMatch = line
      .trim()
      .match(/^\s*(.+?)\s+\(([A-F0-9-]+)\)\s+\((\w+)\)$/);

    if (deviceMatch) {
      const name = deviceMatch[1].trim();
      const udid = deviceMatch[2].trim();
      const status = deviceMatch[3].trim() as "Booted" | "Shutdown";
      simulators.push({ name, udid, status });
    }
  });

  return simulators;
}

export const warmUpDevices = async () => {
  await Promise.all(
    devices.map(async (device) => {
      if (device.platform === "android") {
        return warmUpEmulator(device.name);
      }

      return startSimulator(device.name);
    }),
  );
};
