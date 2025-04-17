import fs from "fs/promises";

import { dirname, join, relative } from "path";
import { PNG } from "pngjs";
import { logBlue, logGreen, logRed } from "@/console";
import { isFilterApplied, maskHomeBar } from "@/args";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
  VISUAL_REGRESSION_DIFF_DIR,
} from "@/paths";
import { vrStore } from "@/store";
import { devices } from "@/config";
import { Story } from "@/types";
import { TestResults } from "@/reports/types";
import { generateReport } from "@/reports/report";

const BOTTOM_MASK_HEIGHT = 40;

/**
 * If current image does not have a baseline, set one.
 */
const checkIfImageHasBaseline = async (
  baselineImagePath: string,
  currentImagePath: string,
) => {
  let hasBaseline = false;

  try {
    await fs.access(baselineImagePath);
    hasBaseline = true;
  } catch {
    hasBaseline = false;
  }

  // If no baseline, set the current image as baseline
  if (!hasBaseline) {
    // Ensure destination directory exists
    await fs.mkdir(dirname(baselineImagePath), { recursive: true });

    await fs.rename(currentImagePath, baselineImagePath);
  }

  return hasBaseline;
};

export const processImages = async () => {
  const { stories } = vrStore.getState();
  if (!stories.length) {
    logBlue("No images provided to process.");
    return;
  }

  await fs.mkdir(VISUAL_REGRESSION_BASELINE_DIR, { recursive: true });
  await fs.mkdir(VISUAL_REGRESSION_DIFF_DIR, { recursive: true });

  const pixelmatch = (await import("pixelmatch")).default;

  // Track results per device
  const deviceResults: TestResults = {};

  for (const device of devices) {
    // Initialize results for this device
    deviceResults[device.name] = {
      passedTests: [],
      failedTests: [],
      newBaselines: [],
    };

    // Create dirs per device if they don't exist yet
    await fs.mkdir(join(VISUAL_REGRESSION_BASELINE_DIR, device.name), {
      recursive: true,
    });
    await fs.mkdir(join(VISUAL_REGRESSION_DIFF_DIR, device.name), {
      recursive: true,
    });

    for (const story of stories) {
      const image = `${story.fullName}.png`;
      const baselineImagePath = join(
        VISUAL_REGRESSION_BASELINE_DIR,
        device.name,
        image,
      );
      const currentImagePath = join(
        VISUAL_REGRESSION_CURRENT_DIR,
        device.name,
        image,
      );

      try {
        await fs.access(currentImagePath);
      } catch {
        deviceResults[device.name].failedTests.push(story.fullName);
        continue;
      }

      const hasBaseline = await checkIfImageHasBaseline(
        baselineImagePath,
        currentImagePath,
      );

      // If no baseline, set the current image as baseline
      if (!hasBaseline) {
        deviceResults[device.name].newBaselines.push(story.fullName);
        continue; // Go to the next image
      }

      // Read baseline and current images
      const baselineImage = PNG.sync.read(await fs.readFile(baselineImagePath));
      const currentImage = PNG.sync.read(await fs.readFile(currentImagePath));

      // Ensure both images have the same dimensions
      const { width, height } = baselineImage;
      const diff = new PNG({ width, height });

      // Mask bottom of both images
      function maskBottom(image: PNG, maskHeight: number) {
        for (let y = height - maskHeight; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (width * y + x) * 4;
            image.data[idx + 0] = 0; // R
            image.data[idx + 1] = 0; // G
            image.data[idx + 2] = 0; // B
            image.data[idx + 3] = 255; // A
          }
        }
      }

      if (device.platform === "ios" && maskHomeBar) {
        maskBottom(baselineImage, BOTTOM_MASK_HEIGHT);
        maskBottom(currentImage, BOTTOM_MASK_HEIGHT);
      }

      try {
        const pixelDiff = pixelmatch(
          baselineImage.data,
          currentImage.data,
          diff.data,
          width,
          height,
          { threshold: 0.1 },
        );
        const diffImagePath = join(
          VISUAL_REGRESSION_DIFF_DIR,
          device.name,
          image,
        );

        await fs.writeFile(diffImagePath, PNG.sync.write(diff));

        if (pixelDiff > 0) {
          deviceResults[device.name].failedTests.push(story.fullName);
        } else {
          deviceResults[device.name].passedTests.push(story.fullName);
        }
      } catch (e) {
        const error = (e as unknown as Error).message;

        // Handle image dimension mismatch
        if (error === "Image sizes do not match.") {
          logRed(
            `Image sizes do not match for ${image}. Baseline: ${baselineImagePath}, Current: ${currentImagePath}`,
          );

          deviceResults[device.name].failedTests.push(story.fullName);

          continue; // Skip further processing for this image
        }
      }
    }

    // Clean up obsolete images
    await deleteObsoleteImages(stories, device.name);
  }

  // Summary Output grouped by device
  console.log("\nTest Summary:");
  console.log("-----------------------------");

  // Output the results per device
  for (const deviceName of Object.keys(deviceResults)) {
    const results = deviceResults[deviceName];

    console.log(`\n📱 Device: ${deviceName}`);
    console.log("-----------------------------");

    logGreen(`Passed Tests (${results.passedTests.length}):`);
    results.passedTests.forEach((test) => console.log(`  ✅ ${test}`));

    console.log("");
    logRed(`Failed Tests (${results.failedTests.length}):`);
    results.failedTests.forEach((test) => console.log(`  ❌ ${test}`));

    console.log("");
    logBlue(`New Baselines (${results.newBaselines.length}):`);
    results.newBaselines.forEach((test) => console.log(`  📸 ${test}`));

    console.log("");
    console.log(
      `Total: ${results.passedTests.length + results.failedTests.length + results.newBaselines.length}, Passed: ${results.passedTests.length}, Failed: ${results.failedTests.length}, New: ${results.newBaselines.length}`,
    );
    console.log("");
    console.log("");
  }

  await generateReport(deviceResults);
};

const getAllImagePaths = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getAllImagePaths(fullPath);
      paths.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      paths.push(fullPath);
    }
  }

  return paths;
};

const deleteObsoleteImages = async (stories: Story[], deviceName: string) => {
  if (isFilterApplied) return;

  const baselineDeviceDir = join(VISUAL_REGRESSION_BASELINE_DIR, deviceName);
  const currentDeviceDir = join(VISUAL_REGRESSION_CURRENT_DIR, deviceName);
  const diffDeviceDir = join(VISUAL_REGRESSION_DIFF_DIR, deviceName);

  const allBaselinePaths = await getAllImagePaths(baselineDeviceDir);

  const validImagePaths = new Set(
    stories.map(
      (story) => join(baselineDeviceDir, ...story.fullName.split("/")) + ".png",
    ),
  );

  for (const baselineImagePath of allBaselinePaths) {
    if (!validImagePaths.has(baselineImagePath)) {
      const relPath = relative(baselineDeviceDir, baselineImagePath);
      const currentImagePath = join(currentDeviceDir, relPath);
      const diffImagePath = join(diffDeviceDir, relPath);

      await fs.rm(baselineImagePath, { force: true });
      await fs.rm(currentImagePath, { force: true });
      await fs.rm(diffImagePath, { force: true });

      logRed("Removed", relPath);
    }
  }
};
