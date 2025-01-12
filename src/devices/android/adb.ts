import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const listDevices = async () => {
  const { stdout } = await execAsync("adb devices", {
    encoding: "utf-8",
  });

  return stdout;
};

export const getAvdById = async (emulatorId: string) => {
  const { stdout } = await execAsync(`adb -s ${emulatorId} emu avd name`, {
    encoding: "utf-8",
  });

  return stdout.trim();
};

export const getInstalledApp = async (emulatorId: string, appId: string) => {
  const { stdout } = await execAsync(
    `adb -s ${emulatorId} shell pm list packages | grep ${appId}`,
  );

  return stdout;
};

export const installApk = async (emulatorId: string, apkPath: string) => {
  const { stdout, stderr } = await execAsync(
    `adb -s ${emulatorId} install ${apkPath}`,
  );

  if (stdout) return true;
  if (stderr) return false;
};

export const checkIfBootCompleted = async (emulatorId: string) => {
  const { stdout: bootStatus } = await execAsync(
    `adb -s ${emulatorId} shell getprop sys.boot_completed`,
  );

  return bootStatus.trim() === "1";
};
