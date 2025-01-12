import { apkPath } from "@/args";
import { appId } from "@/config";
import { logBlue, logGreen, logRed } from "@/console";
import { addBaseDevice, addToBaseDevice } from "@/stores/deviceStore";
import { Device } from "@/types";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import {
  checkIfBootCompleted,
  getAvdById,
  getInstalledApp,
  installApk,
  listDevices,
} from "@/devices/android/adb";
import { listEmulators } from "./android/emulator";
import { createAVD, listAVDs } from "./android/avdmanager";

const androidVersionToApiMap: Record<string, number> = {
  "Android 1.0": 1,
  "Android 1.1": 2,
  'Android 1.5 ("Cupcake")': 3,
  'Android 1.6 ("Donut")': 4,
  'Android 2.0 ("Eclair")': 5,
  'Android 2.0.1 ("Eclair")': 6,
  'Android 2.1 ("Eclair")': 7,
  'Android 2.2 ("Froyo")': 8,
  'Android 2.3 ("Gingerbread")': 9,
  'Android 2.3.3 ("Gingerbread")': 10,
  'Android 3.0 ("Honeycomb")': 11,
  'Android 3.1 ("Honeycomb")': 12,
  'Android 3.2 ("Honeycomb")': 13,
  'Android 4.0 ("Ice Cream Sandwich")': 14,
  'Android 4.0.3 ("Ice Cream Sandwich")': 15,
  'Android 4.1 ("Jelly Bean")': 16,
  'Android 4.2 ("Jelly Bean")': 17,
  'Android 4.3 ("Jelly Bean")': 18,
  'Android 4.4 ("KitKat")': 19,
  'Android 4.4W ("KitKat Wear")': 20,
  'Android 5.0 ("Lollipop")': 21,
  'Android 5.1 ("Lollipop")': 22,
  'Android 6.0 ("Marshmallow")': 23,
  'Android 7.0 ("Nougat")': 24,
  'Android 7.1 ("Nougat")': 25,
  'Android 8.0 ("Oreo")': 26,
  'Android 8.1 ("Oreo")': 27,
  'Android 9.0 ("Pie")': 28,
  'Android 10.0 ("Q")': 29,
  'Android 11.0 ("R")': 30,
  'Android 12.0 ("S")': 31,
  'Android 12.0L ("S")': 32,
  'Android 13.0 ("Tiramisu")': 33,
  'Android 14.0 ("UpsideDownCake")': 34,
  'Android 15.0 ("VanillaIceCream")': 35, // Placeholder for future versions
};

const execAsync = promisify(exec);

export async function findEmulatorByAvdName(targetAvdName: string) {
  const devicesOutput = await listDevices();

  const emulatorIds = devicesOutput
    .split("\n")
    .filter((line) => line.startsWith("emulator-"))
    .map((line) => line.split("\t")[0]);

  for (const emulatorId of emulatorIds) {
    const avdName = await getAvdById(emulatorId);

    if (avdName.startsWith(targetAvdName)) {
      logBlue(targetAvdName, `Emulator ID is: ${emulatorId}`);
      return emulatorId;
    }
  }

  return;
}

async function waitForEmulator(emulatorName: string) {
  try {
    let deviceReady = false;

    while (!deviceReady) {
      const emulatorId = await findEmulatorByAvdName(emulatorName);

      if (!emulatorId) {
        logBlue(emulatorName, "Emulator is closed. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const stdout = await listDevices();

      const deviceLine = stdout
        .split("\n")
        .find((line) => line.includes(emulatorId));

      if (deviceLine?.includes("offline")) {
        logBlue(emulatorName, "Emulator is offline. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      logBlue(emulatorName, "Emulator is online. Checking boot status...");
      const completed = await checkIfBootCompleted(emulatorId);

      if (completed) {
        deviceReady = true;
        return emulatorId;
      }

      logBlue(emulatorName, "Emulator is online but still booting...");

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    logRed(emulatorName, "Error while waiting for the emulator:", error);
    throw error;
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

    const emulatorId = await waitForEmulator(deviceName);

    logGreen(deviceName, "Emulator is ready.", "ID is", emulatorId);

    return emulatorId;
  } catch (error) {
    logRed(deviceName, "Error starting emulator:", error);
  }
}

const emulatorExists = async (name: string) => {
  const emulators = await listEmulators();

  const existingEmulators = emulators.split("\n");

  if (!existingEmulators.map((emultator) => emultator.trim()).includes(name)) {
    logRed(name, "does not exist");
    return false;
  }
  logBlue(name, "already exists");
  return true;
};

const checkIfAppIsInstalled = async (emulatorId: string) => {
  try {
    const match = await getInstalledApp(emulatorId, appId);

    const isInstalled = match.includes(appId);

    logBlue(emulatorId, "is app instaled:", isInstalled);

    return isInstalled;
  } catch (e) {
    logBlue(emulatorId, "is app instaled:", false, e);

    return false;
  }
};

const installApp = async (emulatorId: string) => {
  const succeded = await installApk(emulatorId, apkPath!);

  if (succeded) {
    logGreen(emulatorId, "App installed");
  } else {
    logRed(emulatorId, "App failed to install");
  }
};

const attemptAppInstall = async (emulatorId: string) => {
  const isAppInstalled = await checkIfAppIsInstalled(emulatorId);

  if (!isAppInstalled) {
    if (!apkPath) {
      logRed(
        emulatorId,
        `App is not instaled on, install the app on the emulator or provide --apkPath as argument`,
      );
      return false;
    }
    logBlue("Attempt install");

    await installApp(emulatorId);
    return true;
  }

  return true;
};

const handleExistingEmulator = async (emulatorName: string) => {
  let emulatorId = await findEmulatorByAvdName(emulatorName);
  if (!emulatorId) {
    logBlue(emulatorName, "is not runnig");
    emulatorId = await startEmulator(emulatorName);
  }

  if (!emulatorId) {
    logRed(emulatorName, "Emulator does not exist");
    return;
  }

  const wasInstallSuccessful = await attemptAppInstall(emulatorId);

  if (wasInstallSuccessful) {
    return emulatorId;
  }
};

export const handleAdditionalDevices = async (device: Device) => {
  if (!device.devices) return;
  // one is already running
  const numOfDevices = Array(device.devices - 1).fill("");

  for (const [index] of numOfDevices.entries()) {
    const emulatorName = `${device.name}_${index + 2}`;

    const doesEmulatorExist = await emulatorExists(emulatorName);

    if (doesEmulatorExist) {
      const emulatorId = await handleExistingEmulator(emulatorName);

      if (emulatorId) {
        addToBaseDevice(device.name, {
          name: emulatorName,
          id: emulatorId,
        });
      }
      continue;
    }

    const parsedAVDs = await listAVDs();
    const configurationAVD = parsedAVDs[device.name];

    const deviceType = configurationAVD.Device.replace(/\s*\(.*?\)/g, "");
    const basedOn = configurationAVD["Based on"];
    const apiLevel = androidVersionToApiMap[basedOn];
    const abi = configurationAVD["Tag/ABI"].replace("/", ";");

    await createAVD({
      deviceType,
      emulatorName,
      apiLevel,
      abi,
    });

    logBlue(emulatorName, "created");

    const emulatorId = await startEmulator(emulatorName);

    if (!emulatorId) {
      logRed(emulatorId, "Emulator does not exist");
      return;
    }

    const wasInstallSuccessful = await attemptAppInstall(emulatorId);

    if (wasInstallSuccessful) {
      addToBaseDevice(device.name, {
        name: emulatorName,
        id: emulatorId,
      });
    }
  }
};

export const warmUpEmulator = async (device: Device) => {
  const doesEmulatorExist = await emulatorExists(device.name);

  if (!doesEmulatorExist) {
    // TODO: create default device?
    throw new Error("Device does not exist, create emulator");
  }

  const emulatorId = await handleExistingEmulator(device.name);

  if (!emulatorId) {
    return;
  }

  addBaseDevice({ name: device.name, id: emulatorId });

  await handleAdditionalDevices(device);
};
