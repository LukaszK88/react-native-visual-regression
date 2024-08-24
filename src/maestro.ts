import fs from "fs";
import { KindWithNames } from "./stories";
import { appId, storyFilter } from "./index";
import { join } from "path";
import { exec } from "child_process";
import { toKebabCase } from "./utils";

const flowFilePath = join(".maestro", `visual_regression.yaml`);

export const generateMaestroFlow = (kindWithNames: KindWithNames, deviceName: string) => {
    const imageNames: string[] = [];
  
    let flowContent = `
appId: ${appId}
---
  `;

    Object.keys(kindWithNames).forEach((kind) => {
      if (storyFilter && !storyFilter.startsWith(kind)) {
        return;
      }
      kindWithNames[kind].forEach((name) => {
        if (storyFilter && !storyFilter.endsWith(name)) {
          return;
        }
        const fullName = `${deviceName}-${kind}-${name}`
        console.log("Running regression on", fullName);
        imageNames.push(`${fullName}.png`);
        flowContent += `
- launchApp:
    arguments: 
        kind: ${kind}
        name: ${name.replace(/([A-Z])/g, " $1").trim()}
- assertVisible:
    id: ${kind.toLowerCase()}--${toKebabCase(name)}
- takeScreenshot: ${fullName}
  `;
      });
    });
  
  
    if (fs.existsSync(flowFilePath)) {
      fs.rmSync(flowFilePath);
    }
  
    fs.writeFileSync(flowFilePath, flowContent);
    return {
      imageNames,
    };
  };
  
  // Run Maestro flow and capture screenshot
  export const runMaestroFlow = (deviceId: string) => {
    return new Promise((resolve, reject) => {

      let maestroCommand = ['maestro'];

      if (deviceId) {
        maestroCommand = maestroCommand.concat(['--device', deviceId]);
      }

      const command = `${maestroCommand.join(' ')} test ${flowFilePath}`;

      console.info(command)

      exec(command, (error) => {
        if (error) {
          console.error(`Error executing Maestro flow: ${error}`);
          return reject(error);
        }
        resolve(true);
      }).stdout?.pipe(process.stdout)
    });
  };