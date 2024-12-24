import fs from "fs/promises";

import { addRow } from "../report";
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

/**
 * If current image does not have a baseline, set one.
 */
const checkIfImageHasBaseline = async (
  baselineImagePath: string,
  currentImagePath: string,
  image: string,
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
    logGreen("Set", image, "as baseline");

    addRow({
      name: image,
      result: "New",
      baseline: baselineImagePath,
    });
  }

  return hasBaseline;
};

export const processImages = async () => {
  const { stories } = vrStore.getState();
  if (stories.length === 0) {
    logBlue("No images provided to process.");
    return;
  }

  await fs.mkdir(VISUAL_REGRESSION_BASELINE_DIR, { recursive: true });
  await fs.mkdir(VISUAL_REGRESSION_DIFF_DIR, { recursive: true });

  const pixelmatch = (await import("pixelmatch")).default;

  for (const device of devices) {
    // create dirs per device if they don't exist yet
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

      const hasBaseline = await checkIfImageHasBaseline(
        baselineImagePath,
        currentImagePath,
        image,
      );

      // If no baseline, set the current image as baseline
      if (!hasBaseline) {
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

        const statusMd = pixelDiff > 0 ? `❌` : `✅`;

        addRow({
          name: image,
          result: statusMd,
          baseline: baselineImagePath,
          current: currentImagePath,
          diff: diffImagePath,
        });
      } catch (e) {
        const error = (e as unknown as Error).message;

        // Handle image dimension mismatch
        if (error === "Image sizes do not match.") {
          console.log(
            `Image sizes do not match for ${image}. Baseline: ${baselineImagePath}, Current: ${currentImagePath}`,
          );

          addRow({
            name: image,
            result: `Image sizes do not match. ❌`,
            baseline: baselineImagePath,
            current: currentImagePath,
          });

          continue; // Skip further processing for this image
        }
      }
    }

    // Clean up obsolete images
    await deleteObsoleteImages(stories, device.name);
  }
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
