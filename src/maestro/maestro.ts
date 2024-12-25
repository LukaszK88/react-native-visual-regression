import fs from "fs";
import { appId, devices } from "@/config";
import { join } from "path";
import { spawn } from "child_process";
import { toKebabCase } from "@/utils/utils";
import { logBlue, logGreen, logRed } from "@/console";
import { VISUAL_REGRESSION_CURRENT_DIR } from "@/paths";
import { vrStore } from "@/store";
import { getDeviceIdByName } from "@/utils/device";

/**
 * Generate a flow per device for concurent run.
 */
export const generateMaestroFlows = () => {
  devices.forEach((device) => {
    generateMaestroFlow(device.name);
  });
};

export const generateMaestroFlow = (deviceName: string) => {
  let flowContent = `
appId: ${appId}
---
`;

  const { stories } = vrStore.getState();

  stories.forEach(({ kind, name, fullName }) => {
    flowContent += `
- launchApp:
    arguments:
        kind: ${kind}
        name: ${name.replace(/([A-Z])/g, " $1").trim()}
    label: "Open ${fullName}"
- assertVisible:
    id: ${kind.toLowerCase()}--${toKebabCase(name)}
    label: ${fullName}
- waitForAnimationToEnd:
    timeout: 500
    label: Wait for anminations to settle
- takeScreenshot: ${VISUAL_REGRESSION_CURRENT_DIR}/${deviceName}/${fullName}
`;
  });

  const flowFilePath = join(".maestro", `${deviceName}_visual_regression.yaml`);

  if (fs.existsSync(flowFilePath)) {
    fs.rmSync(flowFilePath);
  }

  fs.writeFileSync(flowFilePath, flowContent);

  logBlue(`Running regression on ${deviceName} for the following scenarios:`);

  stories.forEach(({ fullName }) => {
    logGreen(`- ${fullName}`);
  });
};

function spawnCommand(cmd: string, args: string[]) {
  logBlue(`Starting command: ${cmd} ${args.join(" ")}`);

  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`[${cmd}]${output.trim()}`);
    });

    process.stderr.on("data", (data) => {
      const errorOutput = data.toString();
      stderr += errorOutput;
      logRed(`[${cmd}]${errorOutput.trim()}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        logBlue(`Command completed successfully: ${cmd}`);
        resolve(stdout.trim());
      } else {
        console.error(`Command failed with exit code ${code}: ${cmd}`);
        reject(stderr.trim());
      }
    });

    process.on("error", (error) => {
      console.error(`Error starting command: ${cmd} - ${error.message}`);
      reject(error.message);
    });
  });
}

export const spawnAll = async () => {
  const commands: [string, string[]][] = devices.map((device) => {
    const deviceId = getDeviceIdByName(device);
    return [
      "maestro",
      [
        "--device",
        deviceId,
        "test",
        join(".maestro", `${device.name}_visual_regression.yaml`),
      ],
    ];
  });

  await Promise.all(
    commands.map(
      ([cmd, args], index) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(spawnCommand(cmd, args));
          }, index * 2000);
        }),
    ),
  );
};
