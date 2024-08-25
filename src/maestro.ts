import fs from "fs";
import { KindWithNames } from "./stories";
import { appId, storyFilter } from "./index";
import { join } from "path";
import { exec, execSync } from "child_process";
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

  function isMaestroInstalledGlobally() {
    try {
        // Check if Maestro is available by running 'maestro --version'
        execSync('maestro --version', { stdio: 'ignore' });
        return true;
    } catch (err) {
        return false;
    }
}

function installMaestro() {

  try {
      console.log('Maestro is not installed globally. Installing now...');
      execSync('curl -fsSL "https://get.maestro.mobile.dev" | bash', { stdio: 'inherit' });
      console.log('Maestro has been installed globally.');
  } catch (error) {
      console.error('Failed to install Maestro globally:', (error as unknown as Error).message);
      process.exit(1);
  }
}

export const verifyMaestroInstall =() => {
  if (!isMaestroInstalledGlobally()) {
    installMaestro();
} else {
    console.log('Maestro is already installed globally.');
}
}

  
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