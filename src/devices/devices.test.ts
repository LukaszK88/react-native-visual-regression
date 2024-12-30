import * as config from "@/config";
import { warmUpDevices } from "./devices";
import { exec, spawn } from "child_process";
import { logBlue, logGreen } from "@/console";

jest.mock("@/config", () => ({
  devices: [],
}));
jest.mock("@/args");
jest.mock("@/console");

jest.mock("child_process");

jest.mock("util", () => ({
  promisify: (callback: () => void) => callback,
}));

jest.mock("@/console");

describe("devices", () => {
  it("should start android emulator", async () => {
    // @ts-expect-error mock
    config.default.devices = [{ name: "Pixel_8_API_34", platform: "android" }];

    const mockExec = jest.mocked(exec);

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: "List of devices",
      //   stdout: "List of devices attached emulator-5554   device",
    });

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: "List of devices attached emulator-5554   device",
    });

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: "1",
    });

    // @ts-expect-error mock
    jest.mocked(spawn).mockReturnValue({
      unref: jest.fn(),
    });

    await warmUpDevices();

    expect(spawn).toHaveBeenCalledWith(
      "emulator",
      ["-avd", "Pixel_8_API_34", "-no-snapshot-load"],
      { detached: true, stdio: "ignore" },
    );

    expect(logBlue).toHaveBeenCalledWith("Pixel_8_API_34", "Starting emulator");
    expect(logBlue).toHaveBeenCalledWith(
      "Pixel_8_API_34",
      "Emulator started. Waiting for the device to boot...",
    );
    expect(logBlue).toHaveBeenCalledWith(
      "Emulator is online. Checking boot status...",
    );
    expect(logGreen).toHaveBeenCalledWith(
      "Pixel_8_API_34",
      "Emulator is ready.",
    );
  });

  it("should not start android emulator when already running", async () => {
    // @ts-expect-error mock
    config.default.devices = [{ name: "Pixel_8_API_34", platform: "android" }];

    const mockExec = jest.mocked(exec);

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: "List of devices attached emulator-5554   device",
    });

    await warmUpDevices();

    expect(logBlue).toHaveBeenCalledWith(
      "Pixel_8_API_34",
      "is already running.",
    );
  });

  it("should start iOS simulator", async () => {
    // @ts-expect-error mock
    config.default.devices = [{ name: "iPhone 15", platform: "ios" }];

    const mockExec = jest.mocked(exec);

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: `== Devices ==
-- iOS 17.5 --
    iPhone SE (3rd generation) (A4332049-D998-4A50-B432-D91C63CAD947) (Shutdown) 
    iPhone 15 (8C76A0C1-2189-4DDA-A8C8-1E5B7469380E) (Shutdown) 
    iPhone15-2 (264DE954-A6D6-4701-93F7-FA74C5C5CE6C) (Shutdown) 
    iPhone 15 Plus (9B2AE846-681D-4863-A47B-C1663B38E705) (Shutdown) 
    iPhone 15 Plus-2 (0BB823DE-325F-4275-9905-1BEC28DE18E1) (Shutdown) 
    iPhone 15 Pro (FA44B33F-5F69-4185-B219-D5AE7B256B82) (Shutdown) 
    iPhone 15 Pro Max (D1A57C50-190B-446C-ABC9-7CBD99C7507D) (Shutdown) 
    iPad (10th generation) (DBCE7748-C161-4B80-93DB-F71A073B91E6) (Shutdown) 
    iPad mini (6th generation) (C068066F-B408-423A-A43C-31025357C9B8) (Shutdown) 
    iPad Air 11-inch (M2) (04DD8838-B69A-4B61-97BF-9915D35D12AD) (Shutdown) 
    iPad Air 13-inch (M2) (A7F540B3-EF06-4D3F-96BF-00651CEE43E9) (Shutdown) 
    iPad Pro 11-inch (M4) (3264D0EC-0B93-4037-A04A-2446C4A33AA4) (Shutdown) 
    iPad Pro 13-inch (M4) (08ACA14A-12BE-404B-B2D8-356D084200C4) (Shutdown)`,
    });

    // xcrun simctl boot
    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({});

    // open -a Simulator
    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({});

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: `Monitoring boot status for iPhone 15 (8C76A0C1-2189-4DDA-A8C8-1E5B7469380E).
Device already booted, nothing to do. Finished`,
    });

    await warmUpDevices();

    expect(logBlue).toHaveBeenCalledWith("Finding simulator: iPhone 15");
    expect(logBlue).toHaveBeenCalledWith(
      "Booting simulator: iPhone 15 (8C76A0C1-2189-4DDA-A8C8-1E5B7469380E)",
    );
    expect(logBlue).toHaveBeenCalledWith(
      "iPhone 15",
      "started. Waiting for it to be ready...",
    );
    expect(logBlue).toHaveBeenCalledWith("Simulator is ready!");

    expect(mockExec).toHaveBeenCalledWith(
      "xcrun simctl boot 8C76A0C1-2189-4DDA-A8C8-1E5B7469380E",
    );
    expect(mockExec).toHaveBeenCalledWith("open -a Simulator");
    expect(mockExec).toHaveBeenCalledWith(
      "xcrun simctl bootstatus 8C76A0C1-2189-4DDA-A8C8-1E5B7469380E -b",
    );
  });

  it("should not start iOS simulator when already booted", async () => {
    // @ts-expect-error mock
    config.default.devices = [{ name: "iPhone 15", platform: "ios" }];

    const mockExec = jest.mocked(exec);

    // @ts-expect-error mock
    mockExec.mockResolvedValueOnce({
      stdout: `== Devices ==
-- iOS 17.5 --
    iPhone SE (3rd generation) (A4332049-D998-4A50-B432-D91C63CAD947) (Shutdown) 
    iPhone 15 (8C76A0C1-2189-4DDA-A8C8-1E5B7469380E) (Booted) 
    iPhone15-2 (264DE954-A6D6-4701-93F7-FA74C5C5CE6C) (Shutdown) 
    iPhone 15 Plus (9B2AE846-681D-4863-A47B-C1663B38E705) (Shutdown) 
    iPhone 15 Plus-2 (0BB823DE-325F-4275-9905-1BEC28DE18E1) (Shutdown) 
    iPhone 15 Pro (FA44B33F-5F69-4185-B219-D5AE7B256B82) (Shutdown) 
    iPhone 15 Pro Max (D1A57C50-190B-446C-ABC9-7CBD99C7507D) (Shutdown) 
    iPad (10th generation) (DBCE7748-C161-4B80-93DB-F71A073B91E6) (Shutdown) 
    iPad mini (6th generation) (C068066F-B408-423A-A43C-31025357C9B8) (Shutdown) 
    iPad Air 11-inch (M2) (04DD8838-B69A-4B61-97BF-9915D35D12AD) (Shutdown) 
    iPad Air 13-inch (M2) (A7F540B3-EF06-4D3F-96BF-00651CEE43E9) (Shutdown) 
    iPad Pro 11-inch (M4) (3264D0EC-0B93-4037-A04A-2446C4A33AA4) (Shutdown) 
    iPad Pro 13-inch (M4) (08ACA14A-12BE-404B-B2D8-356D084200C4) (Shutdown)`,
    });

    await warmUpDevices();

    expect(logBlue).toHaveBeenCalledWith("iPhone 15", "Already Booted");
  });
});
