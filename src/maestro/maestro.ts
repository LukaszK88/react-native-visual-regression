import fs from "fs";
import { appId } from "@/config";
import { join } from "path";
import { exec } from "child_process";
import { toKebabCase } from "@/utils/utils";
import { logBlue, logGreen } from "@/console";
import { KindWithNames } from "@/types";
import { storyFilter } from "@/args";
import { VISUAL_REGRESSION_CURRENT_DIR } from "@/paths";

const flowFilePath = join(".maestro", `visual_regression.yaml`);

export const generateMaestroFlow = (
  kindWithNames: KindWithNames,
  deviceName: string,
) => {
  const imageNames: string[] = [];

  let flowContent = `
appId: ${appId}
---
`;

  Object.keys(kindWithNames).forEach((kind) => {
    // ignore any kind which does not start with storyFilter
    if (storyFilter && !storyFilter.startsWith(kind)) {
      return;
    }
    kindWithNames[kind].forEach((name) => {
      if (storyFilter && !storyFilter.endsWith(name)) {
        return;
      }
      const fullName = `${deviceName}-${kind}-${name}`;
      imageNames.push(`${fullName}.png`);
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
- takeScreenshot: ${VISUAL_REGRESSION_CURRENT_DIR}/${fullName}
`;
    });
  });

  if (fs.existsSync(flowFilePath)) {
    fs.rmSync(flowFilePath);
  }

  fs.writeFileSync(flowFilePath, flowContent);

  logBlue(`Running regression on ${deviceName} for the following scenarios:`);

  imageNames.forEach((image) => {
    logGreen(`- ${image}`);
  });

  return {
    imageNames,
  };
};

// Run Maestro flow and capture screenshot
export const runMaestroFlow = (deviceId: string) => {
  return new Promise((resolve, reject) => {
    let maestroCommand = ["maestro"];

    if (deviceId) {
      maestroCommand = maestroCommand.concat(["--device", deviceId]);
    }

    const command = `${maestroCommand.join(" ")} test ${flowFilePath}`;

    console.info(command);

    exec(command, (error) => {
      if (error) {
        console.error(`Error executing Maestro flow: ${error}`);
        return reject(error);
      }
      resolve(true);
    }).stdout?.pipe(process.stdout);
  });
};
