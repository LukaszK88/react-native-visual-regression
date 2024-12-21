import { execSync } from "child_process";

function isMaestroInstalledGlobally() {
  try {
    // Check if Maestro is available by running 'maestro --version'
    execSync("maestro --version", { stdio: "ignore" });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function installMaestro() {
  try {
    console.log("Maestro is not installed globally. Installing now...");
    execSync('curl -fsSL "https://get.maestro.mobile.dev" | bash', {
      stdio: "inherit",
    });
    console.log("Maestro has been installed globally.");
  } catch (error) {
    console.error(
      "Failed to install Maestro globally:",
      (error as unknown as Error).message,
    );
    process.exit(1);
  }
}

export const verifyMaestroInstall = () => {
  if (!isMaestroInstalledGlobally()) {
    installMaestro();
  } else {
    console.log("Maestro is already installed globally.");
  }
};
