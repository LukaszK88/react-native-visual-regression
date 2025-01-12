import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

export const listAVDs = async () => {
  const { stdout } = await execAsync(
    `$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager list avd`,
  );

  return parseOutput(stdout);
};

export const createAVD = async ({
  emulatorName,
  apiLevel,
  abi,
  deviceType,
}: {
  emulatorName: string;
  apiLevel: number;
  abi: string;
  deviceType: string;
}) => {
  const { stdout } = await execAsync(
    `$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n ${emulatorName} -k "system-images;android-${apiLevel};${abi}" -d "${deviceType}"`,
  );

  return stdout;
};
