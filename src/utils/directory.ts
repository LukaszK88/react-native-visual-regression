import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export function ensureDirectoryExistence(filePath: string) {
  const dir = dirname(filePath);
  if (existsSync(dir)) {
    return true;
  }
  mkdirSync(dir, { recursive: true });
}
