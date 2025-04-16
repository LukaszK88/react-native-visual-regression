import { addBaseDevice } from "@/stores/deviceStore";
import { startSimulator } from "./ios";
import {
  bootSimulator,
  checkBootStatus,
  checkIfAppIsInstalled,
  installApp,
  listDevices,
  openSimulator,
} from "@/devices/ios/xcrun";
import { logBlue, logRed } from "@/console";
import * as args from "@/args";

const mockListDevices = jest.mocked(listDevices);
const mockBootSimulator = jest.mocked(bootSimulator);
const mockOpenSimulator = jest.mocked(openSimulator);
const mockCheckBootStatus = jest.mocked(checkBootStatus);
const mockCheckIfAppIsInstalled = jest.mocked(checkIfAppIsInstalled);
const mockInstallApp = jest.mocked(installApp);

jest.mock("@/stores/deviceStore");
jest.mock("@/config", () => ({
  devices: [],
  appId: "appId",
}));
jest.mock("@/args");
jest.mock("@/console");
jest.mock("@/devices/ios/xcrun");

describe("ios", () => {
  beforeEach(() => {
    // @ts-expect-error mock
    args.appPath = "";
  });
  describe("Shutdown simulator", () => {
    it("should start iOS simulator with the app installed", async () => {
      mockListDevices.mockResolvedValueOnce([
        {
          name: "iPhone 15",
          udid: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
          status: "Shutdown",
        },
      ]);

      mockBootSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockOpenSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockCheckBootStatus.mockResolvedValueOnce(true);
      mockCheckIfAppIsInstalled.mockResolvedValueOnce(true);

      await startSimulator({ name: "iPhone 15", platform: "ios" });

      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "Finding simulator");
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        "Booting",
      );
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "started. Waiting for it to be ready...",
      );
      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "is ready.");

      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        name: "iPhone 15",
      });
    });

    it("should start iOS simulator with the app not installed and appPath is provided", async () => {
      // @ts-expect-error mock
      args.appPath = "ios/app.app";

      mockListDevices.mockResolvedValueOnce([
        {
          name: "iPhone 15",
          udid: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
          status: "Shutdown",
        },
      ]);

      mockBootSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockOpenSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockCheckBootStatus.mockResolvedValueOnce(true);
      mockCheckIfAppIsInstalled.mockResolvedValueOnce(false);
      mockInstallApp.mockResolvedValueOnce(true);

      await startSimulator({ name: "iPhone 15", platform: "ios" });

      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "Finding simulator");
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        "Booting",
      );
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "started. Waiting for it to be ready...",
      );
      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "is ready.");
      expect(logBlue).toHaveBeenCalledWith(
        "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        "App was installed on",
      );

      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        name: "iPhone 15",
      });
    });

    it("should start iOS simulator with the app not installed and appPath is not provided", async () => {
      mockListDevices.mockResolvedValueOnce([
        {
          name: "iPhone 15",
          udid: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
          status: "Shutdown",
        },
      ]);

      mockBootSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockOpenSimulator.mockResolvedValueOnce({ stdout: "", stderr: "" });
      mockCheckBootStatus.mockResolvedValueOnce(true);
      mockCheckIfAppIsInstalled.mockResolvedValueOnce(false);

      await startSimulator({ name: "iPhone 15", platform: "ios" });

      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "Finding simulator");
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        "Booting",
      );
      expect(logBlue).toHaveBeenCalledWith(
        "iPhone 15",
        "started. Waiting for it to be ready...",
      );
      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "is ready.");

      expect(logRed).toHaveBeenCalledWith(
        "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        "App installation requested but appPath argument was not provided",
        "Either provide --appPath or install the app on the simulator",
      );

      expect(addBaseDevice).not.toHaveBeenCalled();
    });
  });

  describe("Booted simulator", () => {
    it("should start iOS simulator with the app installed", async () => {
      mockListDevices.mockResolvedValueOnce([
        {
          name: "iPhone 15",
          udid: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
          status: "Booted",
        },
      ]);

      mockCheckBootStatus.mockResolvedValueOnce(true);
      mockCheckIfAppIsInstalled.mockResolvedValueOnce(true);

      await startSimulator({ name: "iPhone 15", platform: "ios" });

      expect(logBlue).toHaveBeenCalledWith("iPhone 15", "is ready.");

      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
        name: "iPhone 15",
      });
    });
  });
});
