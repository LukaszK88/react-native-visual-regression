import { apkPath } from "@/args";
import { appId } from "@/config";
import { logBlue, logGreen, logRed } from "@/console";
import {
  addBaseDevice,
  addToBaseDevice,
  deviceStore,
} from "@/stores/deviceStore";
import { Device } from "@/types";
import { exec, execSync, spawn } from "child_process";
import { promisify } from "util";

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

export function findEmulatorByAvdName(targetAvdName: string) {
  const devicesOutput = execSync("adb devices", { encoding: "utf-8" });
  const emulatorIds = devicesOutput
    .split("\n")
    .filter((line) => line.startsWith("emulator-"))
    .map((line) => line.split("\t")[0]);

  for (const emulatorId of emulatorIds) {
    const avdName = execSync(`adb -s ${emulatorId} emu avd name`, {
      encoding: "utf-8",
    }).trim();

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
      const emulatorId = findEmulatorByAvdName(emulatorName);

      if (!emulatorId) {
        logBlue(emulatorName, "Emulator is closed. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const { stdout } = await execAsync("adb devices");
      const deviceLine = stdout
        .split("\n")
        .find((line) => line.includes(emulatorId));

      if (deviceLine?.includes("offline")) {
        logBlue(emulatorName, "Emulator is offline. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      logBlue(emulatorName, "Emulator is online. Checking boot status...");
      const { stdout: bootStatus } = await execAsync(
        `adb -s ${emulatorId} shell getprop sys.boot_completed`,
      );

      if (bootStatus.trim() === "1") {
        deviceReady = true;
        return;
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

    await waitForEmulator(deviceName);

    logGreen(deviceName, "Emulator is ready.");
  } catch (error) {
    logRed(deviceName, "Error starting emulator:", error);
  }
}

const emulatorExists = async (name: string) => {
  const { stdout } = await execAsync("emulator -list-avds");

  const existingEmulators = stdout.split("\n");

  if (!existingEmulators.includes(name)) {
    logRed(name, "does not exist");
    return false;
  }
  logBlue(name, "already exists");
  return true;
};

function parseOutput(output: string) {
  const devices = output.split("---------");
  const result: Record<string, Record<string, string>> = {};

  for (const device of devices) {
    const lines = device.trim().split("\n");
    if (lines.length === 0) continue;

    // Extract device name from the second line
    const nameLine = lines[0]?.trim();
    const nameMatch = nameLine?.match(/^([\w\s/]+):\s*(.+)$/);
    if (!nameMatch) continue;

    const deviceName = nameMatch[2].trim();
    result[deviceName] = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Match lines with a `Key: Value` format
      const keyValueMatch = trimmedLine.match(/^([\w\s/]+):\s*(.+)$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();

        if (value.includes("Tag/ABI")) {
          // Handle "Based on" and "Tag/ABI" nested values
          const match = value.match(/^(.*?)(\s+Tag\/ABI:\s*.+)$/);
          if (match) {
            const basedOnValue = match[1].trim();
            const tagAbi = match[2].trim();

            result[deviceName][key] = basedOnValue;

            const [abiKey, abiValue] = tagAbi.split(":");
            result[deviceName][abiKey.trim()] = abiValue.trim();
          }
          continue;
        }

        result[deviceName][key] = value;
      }
    }
  }

  return result;
}

const checkIfAppIsInstalled = async (emulatorId: string) => {
  try {
    const { stdout } = await execAsync(
      `adb -s ${emulatorId} shell pm list packages | grep ${appId}`,
    );

    const isInstalled = stdout.includes(appId);

    logBlue(emulatorId, "is app instaled:", isInstalled);

    return isInstalled;
  } catch (e) {
    logBlue(emulatorId, "is app instaled:", false, e);

    return false;
  }
};

const installApp = async (emulatorId: string) => {
  const { stdout, stderr } = await execAsync(
    `adb -s ${emulatorId} install ${apkPath}`,
  );

  if (stdout) {
    logGreen(emulatorId, "App installed", stdout);
  }

  if (stderr) {
    logRed(emulatorId, "App failed to install", stderr);
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
      return;
    }
    logBlue("Attempt install");

    await installApp(emulatorId);
  }
};

export const warmUpEmulator = async (device: Device) => {
  const doesEmulatorExist = await emulatorExists(device.name);

  if (!doesEmulatorExist) {
    // TODO: create default device?
    throw new Error("Device does not exist, create emulator");
  }

  let emulatorId = findEmulatorByAvdName(device.name);

  if (!emulatorId) {
    logBlue(device.name, "is not runnig");
    await startEmulator(device.name);

    emulatorId = findEmulatorByAvdName(device.name);
  }

  if (!emulatorId) {
    logRed(device.name, "Emulator does not exist");
    return;
  }

  await attemptAppInstall(emulatorId);

  addBaseDevice({ name: device.name, id: emulatorId });

  if (device.devices) {
    // one is already running
    const numOfDevices = Array(device.devices - 1).fill("");

    for (const [index] of numOfDevices.entries()) {
      const emulatorName = `${device.name}_${index + 2}`;

      const doesEmulatorExist = await emulatorExists(emulatorName);

      if (doesEmulatorExist) {
        let emulatorId = findEmulatorByAvdName(emulatorName);
        if (!emulatorId) {
          logBlue(emulatorName, "is not runnig");
          await startEmulator(emulatorName);

          emulatorId = findEmulatorByAvdName(emulatorName);
        }

        if (!emulatorId) {
          logRed(emulatorName, "Emulator does not exist");
          return;
        }

        await attemptAppInstall(emulatorId);
        addToBaseDevice(device.name, {
          name: emulatorName,
          id: emulatorId,
        });

        continue;
      }

      const { stdout } = await execAsync(
        `$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager list avd`,
      );

      const parsedAVDs = parseOutput(stdout);
      const configurationAVD = parsedAVDs[device.name];

      const deviceType = configurationAVD.Device.replace(/\s*\(.*?\)/g, "");
      const basedOn = configurationAVD["Based on"];
      const apiLevel = androidVersionToApiMap[basedOn];
      const abi = configurationAVD["Tag/ABI"].replace("/", ";");

      await execAsync(
        `$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n ${emulatorName} -k "system-images;android-${apiLevel};${abi}" -d "${deviceType}"`,
      );

      logBlue(emulatorName, "created");
      await startEmulator(emulatorName);

      const emulatorId = findEmulatorByAvdName(emulatorName);

      if (!emulatorId) {
        logRed(emulatorId, "Emulator does not exist");
        return;
      }

      await attemptAppInstall(emulatorId);

      addToBaseDevice(device.name, {
        name: emulatorName,
        id: emulatorId,
      });
    }
  }
};
