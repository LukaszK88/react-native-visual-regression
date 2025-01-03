import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { TestResults } from "./types";
import {
  VISUAL_REGRESSION_BASELINE_DIR,
  VISUAL_REGRESSION_CURRENT_DIR,
  VISUAL_REGRESSION_DIFF_DIR,
} from "@/paths";
import { logRed } from "@/console";

export const generateHtmlReport = (
  testResults: TestResults,
  outputFilePath: string,
) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      line-height: 1.6;
    }
    h1, h2, h3 {
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table th, table td {
      border: 1px solid #ccc;
      padding: 10px;
      text-align: center;
    }
    table th {
      background-color: #f4f4f4;
    }
    img {
      width: 250px;
      height: auto;
    }
    .status-pass {
      color: green;
      font-weight: bold;
    }
    .status-fail {
      color: red;
      font-weight: bold;
    }
    .status-new {
      color: orange;
      font-weight: bold;
    }
    .collapsible {
      cursor: pointer;
      background-color: #f4f4f4;
      padding: 10px;
      border: none;
      text-align: left;
      font-size: 1.2em;
      width: 100%;
    }
    .collapsible:after {
      content: '\\25BC';
      font-size: 0.8em;
      float: right;
    }
    .collapsible.active:after {
      content: '\\25B2';
    }
    .content {
      display: none;
      overflow: hidden;
      padding: 10px 0;
    }
  </style>
</head>
<body>
  <h1>Visual Regression Report</h1>
  <div id="report-summary" class="summary"></div>
  ${Object.keys(testResults)
    .map((deviceName) => {
      const deviceData = testResults[deviceName];
      return `
    <section>
      <button class="collapsible">Device: ${deviceName}</button>
      <div class="content">
        ${createCollapsibleSection("Passed Tests", "✅ Passed", "status-pass", deviceData.passedTests, deviceName)}
        ${createCollapsibleSection("Failed Tests", "❌ Failed", "status-fail", deviceData.failedTests, deviceName)}
        ${createCollapsibleSection("New Baselines", "📸 New Baseline", "status-new", deviceData.newBaselines, deviceName)}
      </div>
    </section>
    `;
    })
    .join("")}
</body>
  <script>
    const collapsibles = document.querySelectorAll(".collapsible");
    collapsibles.forEach(button => {
      button.addEventListener("click", () => {
        button.classList.toggle("active");
        const content = button.nextElementSibling;
        content.style.display = content.style.display === "block" ? "none" : "block";
      });
    });
  </script>
</html>
`;

  writeFileSync(outputFilePath, htmlContent, "utf8");
  console.log(`HTML report generated at: ${outputFilePath}`);
};

const createCollapsibleSection = (
  title: string,
  statusText: string,
  statusClass: string,
  tests: string[],
  deviceName: string,
) => {
  if (!tests.length) {
    return `<h3>${title} (0)</h3><p>No tests in this category.</p>`;
  }

  const rows = tests
    .map((test) => {
      const baselinePath = path.join(
        VISUAL_REGRESSION_BASELINE_DIR,
        deviceName,
        `${test}.png`,
      );
      const currentPath = path.join(
        VISUAL_REGRESSION_CURRENT_DIR,
        deviceName,
        `${test}.png`,
      );
      const diffPath = path.join(
        VISUAL_REGRESSION_DIFF_DIR,
        deviceName,
        `${test}.png`,
      );
      return `
    <tr>
      <td>${test}</td>
      <td class="${statusClass}">${statusText}</td>
      <td><img src="${baselinePath}" alt="Baseline Image"></td>
      <td><img src="${currentPath}" alt="Current Image"></td>
      <td><img src="${diffPath}" alt="Difference Image"></td>
    </tr>
    `;
    })
    .join("");

  return `
  <button class="collapsible">${title} (${tests.length})</button>
  <div class="content">
    <table>
      <tr>
        <th>Name</th>
        <th>Result</th>
        <th>Baseline Image</th>
        <th>Current Image</th>
        <th>Difference Image</th>
      </tr>
      ${rows}
    </table>
  </div>
  `;
};

export const addRuntimeToHTML = (runtime: string, filePath: string) => {
  let htmlContent = readFileSync(filePath, "utf8");

  const targetId = 'id="report-summary"';
  const startIndex = htmlContent.indexOf(targetId);

  if (startIndex === -1) {
    logRed("Element with id 'report-summary' not found.");
    return;
  }

  const divStart = htmlContent.lastIndexOf("<div", startIndex);
  const divEnd = htmlContent.indexOf("</div>", startIndex);

  if (divStart === -1 || divEnd === -1) {
    logRed("Invalid or malformed HTML structure.");
    return;
  }

  const beforeDiv = htmlContent.slice(0, divStart);
  const afterDiv = htmlContent.slice(divEnd + 6); // 6 = length of "</div>"
  const newDiv = `<div id="report-summary" class="summary">${runtime}</div>`;

  htmlContent = beforeDiv + newDiv + afterDiv;

  writeFileSync(filePath, htmlContent, "utf8");
};
