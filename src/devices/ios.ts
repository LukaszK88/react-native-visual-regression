import { appId, devices } from "@/config";
import { logBlue, logRed } from "@/console";
import { exec } from "child_process";
import { promisify } from "util";
import { warmUpEmulator } from "./android";
import { Device } from "@/types";
import { addBaseDevice } from "@/stores/deviceStore";
import { appPath } from "@/args";

const execAsync = promisify(exec);

async function listSimulators() {
  try {
    const { stdout } = await execAsync("xcrun simctl list devices");
    return stdout;
  } catch (error) {
    logRed("Error listing simulators:", error);
    throw error;
  }
}

const checkIfAppIsInstalled = async (uuid: string) => {
  try {
    const { stdout, stderr } = await execAsync(
      `xcrun simctl get_app_container ${uuid} ${appId}`,
    );
    if (stdout) {
      logBlue("App is installed on", uuid);
      return true;
    }
    if (stderr) {
      logBlue("App not installed on", uuid);

      return false;
    }
  } catch (e) {
    logBlue("App not installed on", uuid, e);

    return false;
  }
};

const installApp = async (uuid: string) => {
  if (!appPath) {
    logRed(
      "App installation requested but appPath argument was not provided",
      "Either provide --appPath or install the app on the simulator",
      uuid,
    );

    return;
  }

  try {
    const { stderr } = await execAsync(
      `xcrun simctl install ${uuid} "${appPath}"`,
    );
    if (stderr) {
      logBlue("App was not installed on", uuid);

      return false;
    }

    logBlue("App was installed on", uuid);
    return true;
  } catch (e) {
    logBlue("App was not installed on", uuid, e);

    return false;
  }
};

export async function startSimulator(device: Device) {
  const simulatorName = device.name;
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

      const isInstalled = await checkIfAppIsInstalled(simulator.udid);

      if (!isInstalled) {
        await installApp(simulator.udid);
      }

      addBaseDevice({ name: device.name, id: simulator.udid });

      return;
    }

    logBlue(`Booting simulator: ${simulator.name} (${simulator.udid})`);

    await execAsync(`xcrun simctl boot ${simulator.udid}`);

    logBlue(simulator.name, "started. Waiting for it to be ready...");

    await execAsync("open -a Simulator");

    await waitForSimulator(simulator.udid);

    logBlue(`Simulator "${simulator.name}" is ready.`);

    const isInstalled = await checkIfAppIsInstalled(simulator.udid);

    if (!isInstalled) {
      await installApp(simulator.udid);
    }

    addBaseDevice({ name: device.name, id: simulator.udid });


    if (device.devices) {
        // one is already running
        const numOfDevices = Array(device.devices - 1).fill("");
    
        for (const [index] of numOfDevices.entries()) {
          const simulatorName = `${device.name}_${index + 2}`;
        }
    }

    // handle other devices
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
