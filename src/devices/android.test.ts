import * as config from "@/config";
import * as args from "@/args";
import { spawn } from "child_process";
import { logBlue, logGreen, logRed } from "@/console";
import { handleAdditionalDevices, warmUpEmulator } from "./android";
import { addBaseDevice, addToBaseDevice } from "@/stores/deviceStore";
import { listEmulators } from "./android/emulator";
import {
  checkIfBootCompleted,
  getAvdById,
  getInstalledApp,
  installApk,
  listDevices,
} from "./android/adb";
import { createAVD, listAVDs } from "./android/avdmanager";

jest.mock("@/config", () => ({
  devices: [],
  appId: "appId",
}));
jest.mock("@/args");
jest.mock("@/console");
jest.mock("@/devices/android/adb");
jest.mock("@/devices/android/emulator");
jest.mock("@/devices/android/avdmanager");

jest.mock("child_process");

jest.mock("util", () => ({
  promisify: (callback: () => void) => callback,
}));

jest.mock("@/console");
jest.mock("@/stores/deviceStore");

const mockListDevices = jest.mocked(listDevices);
const mockGetAvdById = jest.mocked(getAvdById);
const mockCheckIfBootCompleted = jest.mocked(checkIfBootCompleted);
const mockGetInstalledApp = jest.mocked(getInstalledApp);
const mockListEmulators = jest.mocked(listEmulators);
const mockListAVDs = jest.mocked(listAVDs);
const mockCreateAVD = jest.mocked(createAVD);
const mockInstallApk = jest.mocked(installApk);

describe("android", () => {
  it("should fail if the base emulator does not exits", async () => {
    // @ts-expect-error mock
    config.default.devices = [{ name: "Pixel_8_API_34", platform: "android" }];

    jest.mocked(listEmulators).mockResolvedValueOnce("List of devices");

    try {
      await warmUpEmulator({
        devices: 2,
        name: "Pixel_8_API_34",
        platform: "android",
      });
    } catch (e) {
      expect(listEmulators).toHaveBeenCalledTimes(1);
      expect(logRed).toHaveBeenCalledWith("Pixel_8_API_34", "does not exist");
      expect(addBaseDevice).not.toHaveBeenCalled();
    }
  });

  describe("Base emulator is booted", () => {
    it("should handle emulator with the app already installed", async () => {
      // @ts-expect-error mock
      config.default.devices = [
        { name: "Pixel_8_API_34", platform: "android" },
      ];

      jest.mocked(listEmulators)
        .mockResolvedValueOnce(`INFO    | Storing crashdata in: /tmp/android-lukaskowal/emu-crash-34.2.16.db, detection is enabled for process: 22356
    Medium_Phone_API_35
    Pixel_8_API_34`);

      jest
        .mocked(listDevices)
        .mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

      jest.mocked(getAvdById).mockResolvedValueOnce("Pixel_8_API_34\nOK");

      jest.mocked(getInstalledApp).mockResolvedValueOnce("package:appId");

      await warmUpEmulator({
        name: "Pixel_8_API_34",
        platform: "android",
      });

      expect(listEmulators).toHaveBeenCalledTimes(1);
      expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "already exists");
      expect(listDevices).toHaveBeenCalledTimes(1);
      expect(getAvdById).toHaveBeenCalledWith("emulator-5554");
      expect(getInstalledApp).toHaveBeenCalledWith("emulator-5554", "appId");
      expect(logBlue).toHaveBeenCalledWith(
        "emulator-5554",
        "is app instaled:",
        true,
      );

      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "emulator-5554",
        name: "Pixel_8_API_34",
      });
    });

    it("should handle emulator when app is not installed and apkPath is not provided", async () => {
      // @ts-expect-error mock
      config.default.devices = [
        { name: "Pixel_8_API_34", platform: "android" },
      ];

      jest.mocked(listEmulators)
        .mockResolvedValueOnce(`INFO    | Storing crashdata in: /tmp/android-lukaskowal/emu-crash-34.2.16.db, detection is enabled for process: 22356
    Medium_Phone_API_35
    Pixel_8_API_34`);

      jest
        .mocked(listDevices)
        .mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

      jest.mocked(getAvdById).mockResolvedValueOnce("Pixel_8_API_34\nOK");

      jest.mocked(getInstalledApp).mockResolvedValueOnce("");

      await warmUpEmulator({
        name: "Pixel_8_API_34",
        platform: "android",
      });

      expect(listEmulators).toHaveBeenCalledTimes(1);
      expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "already exists");
      expect(listDevices).toHaveBeenCalledTimes(1);

      expect(getAvdById).toHaveBeenCalledWith("emulator-5554");

      expect(getInstalledApp).toHaveBeenCalledWith("emulator-5554", "appId");

      expect(logBlue).toHaveBeenCalledWith(
        "emulator-5554",
        "is app instaled:",
        false,
      );
      expect(logRed).toHaveBeenCalledWith(
        "emulator-5554",
        "App is not instaled on, install the app on the emulator or provide --apkPath as argument",
      );

      expect(addBaseDevice).not.toHaveBeenCalled();
    });

    it("should handle emulator when app is not installed and apkPath is provided", async () => {
      // @ts-expect-error mock
      config.default.devices = [
        { name: "Pixel_8_API_34", platform: "android" },
      ];
      // @ts-expect-error mock
      args.apkPath = "android/app.apk";

      jest.mocked(listEmulators)
        .mockResolvedValueOnce(`INFO    | Storing crashdata in: /tmp/android-lukaskowal/emu-crash-34.2.16.db, detection is enabled for process: 22356
    Medium_Phone_API_35
    Pixel_8_API_34`);

      jest
        .mocked(listDevices)
        .mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

      jest.mocked(getAvdById).mockResolvedValueOnce("Pixel_8_API_34\nOK");

      jest.mocked(getInstalledApp).mockResolvedValueOnce("");

      jest.mocked(installApk).mockResolvedValueOnce(true);

      await warmUpEmulator({
        name: "Pixel_8_API_34",
        platform: "android",
      });

      expect(listEmulators).toHaveBeenCalledTimes(1);
      expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "already exists");
      expect(listDevices).toHaveBeenCalledTimes(1);
      expect(getAvdById).toHaveBeenCalledWith("emulator-5554");
      expect(getInstalledApp).toHaveBeenCalledWith("emulator-5554", "appId");

      expect(logBlue).toHaveBeenCalledWith(
        "emulator-5554",
        "is app instaled:",
        false,
      );

      expect(installApk).toHaveBeenCalledWith(
        "emulator-5554",
        "android/app.apk",
      );

      expect(logGreen).toHaveBeenCalledWith("emulator-5554", "App installed");

      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "emulator-5554",
        name: "Pixel_8_API_34",
      });
    });
  });

  describe("Base emulator is not booted", () => {
    it("should start the emulator", async () => {
      // @ts-expect-error mock
      config.default.devices = [
        { name: "Pixel_8_API_34", platform: "android" },
      ];

      jest.mocked(listEmulators)
        .mockResolvedValueOnce(`INFO    | Storing crashdata in: /tmp/android-lukaskowal/emu-crash-34.2.16.db, detection is enabled for process: 22356
    Medium_Phone_API_35
    Pixel_8_API_34`);

      mockListDevices.mockResolvedValueOnce("List of devices attached\n");

      jest.mocked(getAvdById).mockResolvedValueOnce("OK");

      // @ts-expect-error mock
      jest.mocked(spawn).mockReturnValue({
        unref: jest.fn(),
      });

      mockListDevices.mockResolvedValueOnce(
        "List of devices attached\nemulator-5554\t   device \n",
      );

      mockGetAvdById.mockResolvedValueOnce("Pixel_8_API_34\nOK");

      mockListDevices.mockResolvedValueOnce(
        "List of devices attached\nemulator-5554\t   device \n",
      );

      mockListDevices.mockResolvedValueOnce(
        "List of devices attached\nemulator-5554\t   device \n",
      );

      mockCheckIfBootCompleted.mockResolvedValueOnce(true);

      mockGetInstalledApp.mockResolvedValueOnce("appId");

      await warmUpEmulator({
        name: "Pixel_8_API_34",
        platform: "android",
      });

      expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "already exists");
      expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "is not runnig");
      expect(logBlue).toHaveBeenCalledWith(
        "Pixel_8_API_34",
        "Starting emulator",
      );
      expect(logBlue).toHaveBeenCalledWith(
        "Pixel_8_API_34",
        "Emulator started. Waiting for the device to boot...",
      );
      expect(logBlue).toHaveBeenCalledWith(
        "Pixel_8_API_34",
        "Emulator is online. Checking boot status...",
      );
      expect(addBaseDevice).toHaveBeenCalledWith({
        id: "emulator-5554",
        name: "Pixel_8_API_34",
      });
    });
  });

  describe("Additional Devices", () => {
    describe("Emulator Does Not Exist", () => {
      it("should handle emulator creation", async () => {
        mockListEmulators.mockResolvedValueOnce(`INFO    | Storing crashdata in: /tmp/android-lukaskowal/emu-crash-34.2.16.db, detection is enabled for process: 22356
    Medium_Phone_API_35`);
        // @ts-expect-error mock
        args.apkPath = "android/app.apk";

        mockListAVDs.mockResolvedValueOnce({
          Pixel_8_API_34: {
            Device: "pixel_8 (Google)",
            "Based on": 'Android 14.0 ("UpsideDownCake")',
            "Tag/ABI": "google_apis_playstore/arm64-v8a",
          },
        });

        mockCreateAVD.mockResolvedValueOnce("");

        // @ts-expect-error mock
        jest.mocked(spawn).mockReturnValue({
          unref: jest.fn(),
        });

        mockListDevices.mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

        mockGetAvdById.mockResolvedValueOnce("Pixel_8_API_34_2\nOK");

        mockListDevices.mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

        mockListDevices.mockResolvedValueOnce(
          "List of devices attached\nemulator-5554\t   device \n",
        );

        mockCheckIfBootCompleted.mockResolvedValueOnce(true);

        mockGetInstalledApp.mockResolvedValueOnce("");
        mockInstallApk.mockResolvedValueOnce(true);

        await handleAdditionalDevices({
          name: "Pixel_8_API_34",
          platform: "android",
          devices: 2,
        });

        expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34_2", "created");
        expect(logGreen).toHaveBeenCalledWith(
          "Pixel_8_API_34_2",
          "Emulator is ready.",
          "ID is",
          "emulator-5554",
        );
        expect(addToBaseDevice).toHaveBeenCalledWith("Pixel_8_API_34", {
          id: "emulator-5554",
          name: "Pixel_8_API_34_2",
        });

        expect(createAVD).toHaveBeenCalledWith({
          abi: "google_apis_playstore;arm64-v8a",
          apiLevel: 34,
          deviceType: "pixel_8",
          emulatorName: "Pixel_8_API_34_2",
        });
      });
    });
  });
});
