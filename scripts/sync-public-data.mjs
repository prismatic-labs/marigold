// Publish the data with the site, as Alyssum does, so every figure can be downloaded.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("public/data", { recursive: true });
for (const name of ["minerals", "flow", "districts", "sources", "supply"]) {
  try {
    cpSync(`data/${name}.json`, `public/data/${name}.json`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
