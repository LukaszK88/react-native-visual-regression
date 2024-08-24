import fs from "fs";
import { getVRStories } from "./stories";
import { appId, device, storyFilter } from "./index";
import { join } from "path";
import { exec } from "child_process";

function toKebabCase(str: string) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Insert hyphen between uppercase letters
    .toLowerCase(); // Convert to lowercase
}

export const generateMaestroFlow = () => {
    const kindWithNames = getVRStories();
    const imageNames: string[] = [];

    console.log({kindWithNames})
  
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
        console.log("Running regression on", `${kind}-${name}`);
        imageNames.push(`${kind}-${name}.png`);
        flowContent += `
- launchApp:
    arguments: 
        kind: ${kind}
        name: ${name.replace(/([A-Z])/g, " $1").trim()}
- assertVisible:
    id: ${kind.toLowerCase()}--${toKebabCase(name)}
- takeScreenshot: ${kind}-${name}
  `;
      });
    });
  
    const flowFilePath = join(".maestro", `visual_regression.yaml`);
  
    if (fs.existsSync(flowFilePath)) {
      fs.rmSync(flowFilePath);
    }
  
    fs.writeFileSync(flowFilePath, flowContent);
    return {
      imageNames,
      flowFilePath,
    };
  };
  
  // Run Maestro flow and capture screenshot
  export const runMaestroFlow = (flowFilePath: string) => {
    return new Promise((resolve, reject) => {

      let maestroCommand = ['maestro'];

      if (device) {
        maestroCommand = maestroCommand.concat(['--device', device]);
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