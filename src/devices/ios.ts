import { appId } from "@/config";
import { logBlue, logRed } from "@/console";
import { exec } from "child_process";
import { promisify } from "util";
import { Device } from "@/types";
import { addBaseDevice, addToBaseDevice } from "@/stores/deviceStore";
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
      logBlue(uuid, "App is installed on");
      return true;
    }
    if (stderr) {
      logBlue(uuid, "App not installed on");

      return false;
    }
  } catch (e) {
    logBlue(uuid, "App not installed on", e);

    return false;
  }
};

const installApp = async (uuid: string) => {
  if (!appPath) {
    logRed(
      uuid,
      "App installation requested but appPath argument was not provided",
      "Either provide --appPath or install the app on the simulator",
    );

    return;
  }

  try {
    const { stderr } = await execAsync(
      `xcrun simctl install ${uuid} "${appPath}"`,
    );
    if (stderr) {
      logBlue(uuid, "App was not installed on");

      return false;
    }

    logBlue(uuid, "App was installed on");
    return true;
  } catch (e) {
    logBlue(uuid, "App was not installed on", e);

    return false;
  }
};

const createSimulator = async (
  name: string,
  deviceType: string,
  runtime: string,
) => {
  try {
    const { stdout } = await execAsync(
      `xcrun simctl create "${name}" "${deviceType}" "${runtime}"`,
    );

    if (stdout) {
      return stdout.replace("\n", "");
    }

    throw new Error("Failed to create the simulator");
  } catch (e) {
    logRed(e);
    throw new Error("Failed to create the simulator");
  }
};

const handlePararellDevicesForBaseSimulator = async (
  device: Device,
  simulators: { name: string; udid: string; status: "Booted" | "Shutdown" }[],
) => {
  if (device.devices) {
    const { stdout: deviceTypes } = await execAsync(
      "xcrun simctl list devicetypes",
    );
    const { stdout: runtimes } = await execAsync("xcrun simctl list runtimes");

    const deviceType = deviceTypes
      .split("\n")
      .find((deviceType) => deviceType.startsWith(`${device.name} (`))
      ?.match(/\(([^)]+)\)/)?.[1];

    const runtime = runtimes
      .split("\n")[1]
      .match(/com\.apple\.CoreSimulator\.SimRuntime\.iOS-[^\s)]+/g)?.[0];

    // one is already running
    const numOfDevices = Array(device.devices - 1).fill("");

    if (!deviceType) {
      return;
    }

    if (!runtime) {
      return;
    }

    for (const [index] of numOfDevices.entries()) {
      const simulatorName = `${device.name}_${index + 2}`;

      const simulatorExists = simulators.find(
        (sim) => sim.name === simulatorName,
      );

      let udid = simulatorExists?.udid;

      if (!simulatorExists) {
        logBlue(simulatorName, "Does not exist, attempt creation");

        udid = await createSimulator(simulatorName, deviceType, runtime);
      }

      if (!udid) {
        logRed("No udid");
        continue;
      }

      if (simulatorExists?.status !== "Booted") {
        await execAsync(`xcrun simctl boot ${udid}`);
        await waitForSimulator(udid);
      }

      logBlue(simulatorName, `is ready.`);

      const isInstalled = await checkIfAppIsInstalled(udid);

      if (!isInstalled) {
        await installApp(udid);
      }

      addToBaseDevice(device.name, { name: simulatorName, id: udid });
    }
  }
};

export async function startSimulator(device: Device) {
  const simulatorName = device.name;
  try {
    logBlue(simulatorName, `Finding simulator`);

    const simulatorsOutput = await listSimulators();
    const simulators = parseSimulators(simulatorsOutput);

    const simulator = simulators.find((sim) => sim.name === simulatorName);
    if (!simulator) {
      throw new Error(`"${simulatorName}" not found or unavailable.`);
    }

    if (simulator.status === "Booted") {
      logBlue(simulatorName, "Already Booted");

      const isInstalled = await checkIfAppIsInstalled(simulator.udid);

      if (!isInstalled) {
        await installApp(simulator.udid);
      }

      addBaseDevice({ name: device.name, id: simulator.udid });

      await handlePararellDevicesForBaseSimulator(device, simulators);

      return;
    }

    logBlue(simulator.name, simulator.udid, `Booting`);

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

    await handlePararellDevicesForBaseSimulator(device, simulators);
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
