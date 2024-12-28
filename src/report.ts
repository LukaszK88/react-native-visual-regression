import fs from "fs";
import { join } from "path";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
  VISUAL_REGRESSION_DIFF_DIR,
} from "./paths";

export type TestResults = Record<
  string,
  { passedTests: string[]; failedTests: string[]; newBaselines: string[] }
>;

// Helper function to render images in markdown
const imageMd = (src?: string) =>
  src ? `<img src="${src}" width="250" />` : "N/A";

export const addLine = (content: string) => {
  fs.appendFileSync("VisualRegressionTestReport.md", content);
};

// Function to generate the markdown report grouped by device
export const generateMarkdownReport = (deviceResults: TestResults) => {
  let markdown = `# Visual Regression Report\n\n`;

  // Iterate over the devices and generate the grouped report
  for (const deviceName of Object.keys(deviceResults)) {
    const results = deviceResults[deviceName];

    markdown += `\n## Device: ${deviceName}\n`;

    // Add passed tests with images
    markdown += `### Passed Tests (${results.passedTests.length})\n`;
    if (results.passedTests.length) {
      markdown += `| Name | Result | Baseline Image | Current Image | Difference Image |\n`;
      markdown += `|------|--------|----------------|---------------|------------------|\n`;
      results.passedTests.forEach((test) => {
        const baselineImagePath = join(
          VISUAL_REGRESSION_BASELINE_DIR,
          deviceName,
          `${test}.png`,
        );
        const currentImagePath = join(
          VISUAL_REGRESSION_CURRENT_DIR,
          deviceName,
          `${test}.png`,
        );
        const diffImagePath = join(
          VISUAL_REGRESSION_DIFF_DIR,
          deviceName,
          `${test}.png`,
        );

        markdown += `| ${test} | ✅ Passed | ${imageMd(baselineImagePath)} | ${imageMd(currentImagePath)} | ${imageMd(diffImagePath)} |\n`;
      });
    }

    // Add failed tests with images
    markdown += `\n### Failed Tests (${results.failedTests.length})\n`;

    if (results.failedTests.length) {
      markdown += `| Name | Result | Baseline Image | Current Image | Difference Image |\n`;
      markdown += `|------|--------|----------------|---------------|------------------|\n`;
      results.failedTests.forEach((test) => {
        const baselineImagePath = join(
          VISUAL_REGRESSION_BASELINE_DIR,
          deviceName,
          `${test}.png`,
        );
        const currentImagePath = join(
          VISUAL_REGRESSION_CURRENT_DIR,
          deviceName,
          `${test}.png`,
        );
        const diffImagePath = join(
          VISUAL_REGRESSION_DIFF_DIR,
          deviceName,
          `${test}.png`,
        );

        markdown += `| ${test} | ❌ Failed | ${imageMd(baselineImagePath)} | ${imageMd(currentImagePath)} | ${imageMd(diffImagePath)} |\n`;
      });
    }

    // Add new baselines with images
    markdown += `\n### New Baselines (${results.newBaselines.length})\n`;

    if (results.newBaselines.length) {
      markdown += `| Name | Result | Baseline Image | Current Image | Difference Image |\n`;
      markdown += `|------|--------|----------------|---------------|------------------|\n`;
      results.newBaselines.forEach((test) => {
        const baselineImagePath = join(
          VISUAL_REGRESSION_BASELINE_DIR,
          deviceName,
          `${test}.png`,
        );
        const currentImagePath = join(
          VISUAL_REGRESSION_CURRENT_DIR,
          deviceName,
          `${test}.png`,
        );
        const diffImagePath = join(
          VISUAL_REGRESSION_DIFF_DIR,
          deviceName,
          `${test}.png`,
        );

        markdown += `| ${test} | 📸 New Baseline | ${imageMd(baselineImagePath)} | ${imageMd(currentImagePath)} | ${imageMd(diffImagePath)} |\n`;
      });
    }
  }

  // Write the final markdown content to the file
  fs.writeFileSync("VisualRegressionTestReport.md", markdown);
};
