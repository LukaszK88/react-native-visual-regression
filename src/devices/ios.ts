import { appId } from "@/config";
import { logBlue, logRed } from "@/console";
import { Device } from "@/types";
import { addBaseDevice, addToBaseDevice } from "@/stores/deviceStore";
import { appPath } from "@/args";
import {
  bootSimulator,
  checkBootStatus,
  checkIfAppIsInstalled,
  createSimulator,
  getDeviceDetails,
  installApp,
  listDevices,
  openSimulator,
} from "./ios/xcrun";

const handleInstallApp = async (uuid: string) => {
  if (!appPath) {
    logRed(
      uuid,
      "App installation requested but appPath argument was not provided",
      "Either provide --appPath or install the app on the simulator",
    );

    return;
  }

  try {
    const installed = await installApp(uuid, appPath);
    if (!installed) {
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

const handleCreateSimulator = async (
  name: string,
  deviceType: string,
  runtime: string,
) => {
  try {
    const udid = await createSimulator({
      name,
      deviceType,
      runtime,
    });

    if (udid) {
      return udid;
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
    const { deviceType, runtime } = await getDeviceDetails(device.name);

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

        udid = await handleCreateSimulator(simulatorName, deviceType, runtime);
      }

      if (!udid) {
        logRed("No udid");
        continue;
      }

      if (simulatorExists?.status !== "Booted") {
        await bootSimulator(udid);
        await waitForSimulator(udid);
      }

      logBlue(simulatorName, `is ready.`);

      const isInstalled = await checkIfAppIsInstalled(udid, appId);

      if (!isInstalled) {
        await handleInstallApp(udid);
      }

      addToBaseDevice(device.name, { name: simulatorName, id: udid });
    }
  }
};

export async function startSimulator(device: Device) {
  const simulatorName = device.name;
  try {
    logBlue(simulatorName, `Finding simulator`);

    const simulators = await listDevices();

    const simulator = simulators.find((sim) => sim.name === simulatorName);
    if (!simulator) {
      throw new Error(`"${simulatorName}" not found or unavailable.`);
    }

    if (simulator.status === "Booted") {
      logBlue(simulatorName, "Already Booted");

      const isInstalled = await checkIfAppIsInstalled(simulator.udid, appId);

      if (!isInstalled) {
        await handleInstallApp(simulator.udid);
      }

      addBaseDevice({ name: device.name, id: simulator.udid });

      await handlePararellDevicesForBaseSimulator(device, simulators);

      return;
    }

    logBlue(simulator.name, simulator.udid, `Booting`);

    await bootSimulator(simulator.udid);

    logBlue(simulator.name, "started. Waiting for it to be ready...");

    await openSimulator();

    await waitForSimulator(simulator.udid);

    logBlue(`Simulator "${simulator.name}" is ready.`);

    const isInstalled = await checkIfAppIsInstalled(simulator.udid, appId);

    if (!isInstalled) {
      await handleInstallApp(simulator.udid);
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
      const isFinished = await checkBootStatus(udid);

      if (isFinished) {
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
