import { reportFormat } from "@/args";
import { addRuntimeToHTML, generateHtmlReport } from "./html";
import { TestResults } from "./types";
import { addLine, generateMarkdownReport } from "./md";

export const generateReport = (results: TestResults) => {
  if (reportFormat === "html") {
    generateHtmlReport(results, "VisualRegressionTestReport.html");
    return;
  }

  generateMarkdownReport(results);
};

export const addRuntime = (runtime: string) => {
  if (reportFormat === "html") {
    addRuntimeToHTML(runtime, "VisualRegressionTestReport.html");
    return;
  }

  addLine(`#### ${runtime}`);
};
