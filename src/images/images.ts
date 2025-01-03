import fs from "fs/promises";

import { join } from "path";
import { PNG } from "pngjs";
import { logBlue, logGreen, logRed } from "@/console";
import { isFilterApplied } from "@/args";
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

const deleteObsoleteImages = async (stories: Story[], deviceName: string) => {
  // do not clean when filter is applied
  if (isFilterApplied) return;

  const currentBaselineImages = await fs.readdir(
    join(VISUAL_REGRESSION_BASELINE_DIR, deviceName),
  );

  const imageNames = stories.map((story) => `${story.fullName}.png`);

  for (const baselineImage of currentBaselineImages) {
    // skip folder if not the current device
    if (!baselineImage.startsWith(deviceName)) continue;

    if (!imageNames.includes(baselineImage)) {
      // Remove corresponding files from baseline, current, and diff directories
      await fs.rm(join(VISUAL_REGRESSION_BASELINE_DIR, baselineImage));
      await fs.rm(join(VISUAL_REGRESSION_CURRENT_DIR, baselineImage));
      await fs.rm(join(VISUAL_REGRESSION_DIFF_DIR, baselineImage));

      logRed("Removed", baselineImage);
    }
  }
};
