import fs from "fs";

const imageMd = (src?: string) =>
    src ? `<img src="${src}" width="250" />` : "N/A";
  

export const addRow = (row: {
    name: string;
    result?: string;
    baseline?: string;
    current?: string;
    diff?: string;
  }) => {
    fs.appendFileSync(
      "VisualRegressionTestReport.md",
      `| ${row.name} | ${row.result} | ${imageMd(row.baseline)} | ${imageMd(row.current)} | ${imageMd(row.diff)} |\n`,
    );
  };
  
  export const generateMarkdownReport = () => {
    let markdown = `# Visual Regression Report\n\n`;
  
    markdown += `### Test Cases\n`;
    markdown += `| Name | Result | Baseline Image | Current Image | Difference Image |\n`;
    markdown += `|------|--------|----------------|---------------|------------------|\n`;
  
    fs.writeFileSync("VisualRegressionTestReport.md", markdown);
  };