import fs from "fs";
import { VISUAL_REGRESSION_BASELINE_DIR, VISUAL_REGRESSION_CURRENT_DIR, VISUAL_REGRESSION_DIFF_DIR, VISUAL_REGRESSION_DIR } from "./index";
import { addRow, generateMarkdownReport } from "./report";
import { join } from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export const orchestrateImages = (imageNames: string[]) => {
    if (!fs.existsSync(VISUAL_REGRESSION_DIR)) {
      fs.mkdirSync(VISUAL_REGRESSION_BASELINE_DIR, { recursive: true });
      fs.mkdirSync(VISUAL_REGRESSION_CURRENT_DIR);
      fs.mkdirSync(VISUAL_REGRESSION_DIFF_DIR);
    }
  
    generateMarkdownReport();
  
    imageNames.forEach((image) => {
      const baselineImagePath = join(VISUAL_REGRESSION_BASELINE_DIR, image);
      const hasBaseline = fs.existsSync(baselineImagePath);
  
      if (!hasBaseline) {
        fs.renameSync(image, baselineImagePath);
        console.log("Set", image, "as baseline");
  
        addRow({
          name: image,
          result: "New",
          baseline: baselineImagePath,
        });
  
        return;
      }
  
      const moveImage = fs.existsSync(image);
      const currentImagePath = join(VISUAL_REGRESSION_CURRENT_DIR, image);
  
      if (moveImage) {
        fs.renameSync(image, currentImagePath);
        console.log("Set", image, "as current");
      }
  
      const baselineImage = PNG.sync.read(fs.readFileSync(baselineImagePath));
      const currentImage = PNG.sync.read(fs.readFileSync(currentImagePath));
  
      const { width, height } = baselineImage;
      const diff = new PNG({ width, height });
  
      const pixelDiff = pixelmatch(
        baselineImage.data,
        currentImage.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 },
      );
  
      const diffImagePath = join(VISUAL_REGRESSION_DIFF_DIR, image);
  
      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
  
      const statusMd = pixelDiff > 0 ? `❌` : `✅`;
  
      addRow({
        name: image,
        result: statusMd,
        baseline: baselineImagePath,
        current: currentImagePath,
        diff: diffImagePath,
      });
    });

    deleteObsoleteImages(imageNames);
  };
  
  const deleteObsoleteImages = (imageNames: string[]) => {
    const currentBaselineImages = fs.readdirSync(VISUAL_REGRESSION_BASELINE_DIR);
  
    currentBaselineImages.forEach((baselineImage) => {
      if (!imageNames.includes(baselineImage)) {
        fs.rmSync(join(VISUAL_REGRESSION_BASELINE_DIR, baselineImage));
        fs.rmSync(join(VISUAL_REGRESSION_CURRENT_DIR, baselineImage));
        fs.rmSync(join(VISUAL_REGRESSION_DIFF_DIR, baselineImage));
        console.log("Removed", baselineImage);
      }
    });
  };