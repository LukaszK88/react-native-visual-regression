import fs from "fs";
import { getVRStories } from "./stories";
import { appId, device, storyFilter } from "./index";
import { join } from "path";
import { exec } from "child_process";

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
    id: "addon-backgrounds-container"
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

        console.info(`${maestroCommand.join(' ')} test ${flowFilePath}`)

      exec(`${maestroCommand.join(' ')} test ${flowFilePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Maestro flow: ${error}`);
          return reject(error);
        }
        console.log(`Maestro flow output: ${stdout}`);
        resolve(true);
      });
    });
  };