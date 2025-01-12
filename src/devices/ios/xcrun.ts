import { logBlue, logRed } from "@/console";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

export const listDevices = async () => {
  try {
    const { stdout } = await execAsync("xcrun simctl list devices");
    return parseSimulators(stdout);
  } catch (error) {
    logRed("Error listing simulators:", error);
    throw error;
  }
};

export const checkIfAppIsInstalled = async (uuid: string, appId: string) => {
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

export const checkBootStatus = async (udid: string) => {
  const { stdout } = await execAsync(`xcrun simctl bootstatus ${udid} -b`);

  return stdout.includes("Finished");
};

export const bootSimulator = async (udid: string) => {
  return await execAsync(`xcrun simctl boot ${udid}`);
};

export const openSimulator = async () => {
  return await execAsync("open -a Simulator");
};

export const installApp = async (udid: string, appPath: string) => {
  const { stderr } = await execAsync(
    `xcrun simctl install ${udid} "${appPath}"`,
  );

  if (stderr) {
    return false;
  }

  return true;
};

export const getDeviceDetails = async (deviceName: string) => {
  const { stdout: deviceTypes } = await execAsync(
    "xcrun simctl list devicetypes",
  );
  const { stdout: runtimes } = await execAsync("xcrun simctl list runtimes");

  const deviceType = deviceTypes
    .split("\n")
    .find((deviceType) => deviceType.startsWith(`${deviceName} (`))
    ?.match(/\(([^)]+)\)/)?.[1];

  const runtime = runtimes
    .split("\n")[1]
    .match(/com\.apple\.CoreSimulator\.SimRuntime\.iOS-[^\s)]+/g)?.[0];

  return {
    deviceType,
    runtime,
  };
};

export const createSimulator = async ({
  name,
  deviceType,
  runtime,
}: {
  name: string;
  deviceType: string;
  runtime: string;
}) => {
  const { stdout } = await execAsync(
    `xcrun simctl create "${name}" "${deviceType}" "${runtime}"`,
  );

  if (stdout) {
    return stdout.replace("\n", "");
  }
};
