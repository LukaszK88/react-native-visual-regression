import { appId } from "@/config";
import { logBlue, logRed } from "@/console";
import { Device } from "@/types";
import { addBaseDevice, addToBaseDevice } from "@/stores/deviceStore";
import { appPath, reinstallApp } from "@/args";
import {
  bootSimulator,
  checkBootStatus,
  checkIfAppIsInstalled,
  createSimulator,
  getDeviceDetails,
  installApp,
  listDevices,
  openSimulator,
} from "@/devices/ios/xcrun";

const handleInstallApp = async (uuid: string) => {
  if (!appPath) {
    logRed(
      uuid,
      "App installation requested but appPath argument was not provided",
      "Either provide --appPath or install the app on the simulator",
    );

    return false;
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

const handleExistingSimulator = async (
  name: string,
  udid: string,
  status: "Booted" | "Shutdown",
) => {
  if (status !== "Booted") {
    logBlue(name, udid, `Booting`);

    await bootSimulator(udid);

    logBlue(name, "started. Waiting for it to be ready...");

    await openSimulator();

    await waitForSimulator(udid);
  }

  logBlue(name, "is ready.");

  const isInstalled = await checkIfAppIsInstalled(udid, appId);
  if (!isInstalled || reinstallApp) {
    const installSuccessful = await handleInstallApp(udid);

    if (!installSuccessful) {
      return false;
    }
    return true;
  }
  return true;
};

const findSimulator = async (simulatorName: string) => {
  logBlue(simulatorName, `Finding simulator`);

  const simulators = await listDevices();

  return simulators.find((sim) => sim.name === simulatorName);
};

export const handlePararellDevicesForBaseSimulator = async (device: Device) => {
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

      const simulatorExists = await findSimulator(simulatorName);

      if (!simulatorExists) {
        logBlue(simulatorName, "Does not exist, attempt creation");

        await handleCreateSimulator(simulatorName, deviceType, runtime);
      }

      const simulator = await findSimulator(simulatorName);

      if (!simulator) {
        logRed(simulatorName, "Still does not exist");

        return;
      }

      const isReady = await handleExistingSimulator(
        simulatorName,
        simulator.udid,
        simulator.status,
      );

      if (!isReady) {
        return;
      }

      addToBaseDevice(device.name, { name: simulatorName, id: simulator.udid });
    }
  }
};

export async function startSimulator(device: Device) {
  const simulatorName = device.name;
  try {
    const simulator = await findSimulator(simulatorName);
    if (!simulator) {
      throw new Error(`"${simulatorName}" not found or unavailable.`);
    }

    const isReady = await handleExistingSimulator(
      simulator.name,
      simulator.udid,
      simulator.status,
    );

    if (!isReady) {
      return;
    }

    addBaseDevice({ name: device.name, id: simulator.udid });

    await handlePararellDevicesForBaseSimulator(device);
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
}
