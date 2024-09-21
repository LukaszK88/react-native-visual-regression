import fs from "fs/promises";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
  VISUAL_REGRESSION_DIFF_DIR,
} from "./index";
import { addRow, generateMarkdownReport } from "./report";
import { join } from "path";
import { PNG } from "pngjs";

export const orchestrateImages = async (imageNames: string[]) => {
  if (imageNames.length === 0) {
    console.log("No images provided to process.");
    return;
  }

  await fs.mkdir(VISUAL_REGRESSION_BASELINE_DIR, { recursive: true });
  await fs.mkdir(VISUAL_REGRESSION_CURRENT_DIR, { recursive: true });
  await fs.mkdir(VISUAL_REGRESSION_DIFF_DIR, { recursive: true });

  generateMarkdownReport();
  const pixelmatch = (await import("pixelmatch")).default;

  for (const image of imageNames) {
    const baselineImagePath = join(VISUAL_REGRESSION_BASELINE_DIR, image);
    let hasBaseline = false;

    try {
      await fs.access(baselineImagePath);
      hasBaseline = true;
    } catch {
      hasBaseline = false;
    }

    // If no baseline, set the current image as baseline
    if (!hasBaseline) {
      await fs.rename(image, baselineImagePath);
      console.log("Set", image, "as baseline");

      addRow({
        name: image,
        result: "New",
        baseline: baselineImagePath,
      });

      continue; // Go to the next image
    }

    // If baseline exists, move the current image to the current directory
    const moveImage = await fs
      .access(image)
      .then(() => true)
      .catch(() => false);
    const currentImagePath = join(VISUAL_REGRESSION_CURRENT_DIR, image);

    if (moveImage) {
      await fs.rename(image, currentImagePath);
      console.log("Set", image, "as current");
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
      const diffImagePath = join(VISUAL_REGRESSION_DIFF_DIR, image);

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
  await deleteObsoleteImages(imageNames);
};

const deleteObsoleteImages = async (imageNames: string[]) => {
  const currentBaselineImages = await fs.readdir(
    VISUAL_REGRESSION_BASELINE_DIR,
  );

  for (const baselineImage of currentBaselineImages) {
    if (!imageNames.includes(baselineImage)) {
      // Remove corresponding files from baseline, current, and diff directories
      await fs.rm(join(VISUAL_REGRESSION_BASELINE_DIR, baselineImage));
      await fs.rm(join(VISUAL_REGRESSION_CURRENT_DIR, baselineImage));
      await fs.rm(join(VISUAL_REGRESSION_DIFF_DIR, baselineImage));

      console.log("Removed", baselineImage);
    }
  }
};
