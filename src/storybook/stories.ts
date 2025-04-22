import { join, extname, resolve } from "path";
import fs from "fs";
import { KindWithNames } from "@/types";
import { fileFilter } from "@/args";
import { storiesDirectories } from "@/config";
import { vrStore } from "@/store";

function getStoryFiles(dirs: string[]): string[] {
  let results: string[] = [];

  for (const dir of dirs) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !filePath.startsWith("node_modules")) {
        results = results.concat(getStoryFiles([filePath]));
      } else if (extname(file) === ".tsx" && file.endsWith(".stories.tsx")) {
        results.push(filePath);
      }
    }
  }

  return results;
}

function extractExportNames(filePath: string, kind: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  // Regular expression to match any export const with a StoryObj type
  const exportRegex =
    /export\s+const\s+(\w+)\s*:\s*StoryObj<[^>]+>\s*=\s*({[\s\S]*?});/g;

  const exports: string[] = [];
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    const exportName = match[1];
    const exportContent = match[0];

    // Updated regex to check for visualRegression: true, handling nested structures
    const visualRegressionRegex =
      /parameters\s*:\s*{[\s\S]*?visualRegression\s*:\s*true[\s\S]*?}/s;

    if (visualRegressionRegex.test(exportContent)) {
      const awaitElementMatch = exportContent.match(
        /visualRegressionAwaitElement\s*:\s*['"`]([^'"`]+)['"`]/s,
      );

      exports.push(exportName);

      if (awaitElementMatch?.[1]) {
        vrStore.setState({
          storiesBeingProcessed: {
            ...vrStore.getState().storiesBeingProcessed,
            [`${kind}-${exportName}`]: {
              testID: awaitElementMatch[1],
            },
          },
        });
      }
    }
  }

  return exports;
}

function extractDefaultTitle(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const titleRegex =
    /Meta<\s*[^>]*>\s*=\s*{[^}]*?title\s*:\s*["']([^"']+)["']/s;

  const match = content.match(titleRegex) ?? [];
  return match[1] ?? "Unknown";
}

export const getVRStories = () => {
  let storyFiles = getStoryFiles(storiesDirectories);

  if (fileFilter) {
    storyFiles = storyFiles.filter((storyFile) => storyFile === fileFilter);
    if (!storyFiles.length) {
      console.error(fileFilter, "was not found among stories");
      throw new Error();
    }
  }

  let kindWithNames: KindWithNames = {};

  storyFiles.forEach((storyFile) => {
    kindWithNames = {
      ...kindWithNames,
      ...formatStoryFileToKindWithNames(storyFile),
    };
  });

  return kindWithNames;
};

/**
 * Formats a single file to KindWithNames
 */
export const formatStoryFileToKindWithNames = (
  storyFile: string,
): KindWithNames => {
  const absolutePath = resolve(storyFile);
  const kind = extractDefaultTitle(absolutePath);
  const names = extractExportNames(absolutePath, kind);

  return { [kind]: names };
};
