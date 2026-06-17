#!/usr/bin/env node
import { textToPixels, textWidth, renderPreview } from "./lib/font.js";
import { generateCommits, getGraphStartDate } from "./lib/commit-generator.js";

const TEXT = process.env.TEXT || "GAY";
const COMMITS_PER_PIXEL = parseInt(process.env.COMMITS_PER_PIXEL || "25", 10);
const DRY_RUN = process.env.DRY_RUN === "true";

function autoCalculatePosition(text) {
  const today = new Date();
  const w = textWidth(text);
  const targetYear = today.getFullYear() - 1;
  const graphStart = getGraphStartDate(targetYear);
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const leftEdgeWeek = Math.max(0, Math.ceil((oneYearAgo - graphStart) / msPerWeek));
  const rightEdgeWeek = Math.floor((today - graphStart) / msPerWeek) - 1;
  const availableWeeks = rightEdgeWeek - leftEdgeWeek;
  const margin = Math.max(1, Math.floor((availableWeeks - w) / 2));
  return { year: targetYear, startWeek: leftEdgeWeek + margin };
}

const auto = autoCalculatePosition(TEXT);
const YEAR = (process.env.YEAR && process.env.YEAR !== "") ? parseInt(process.env.YEAR, 10) : auto.year;
const START_WEEK = (process.env.START_WEEK && process.env.START_WEEK !== "") ? parseInt(process.env.START_WEEK, 10) : auto.startWeek;

console.log("\n╔══════════════════════════════════════════════╗");
console.log("║   GitHub Mosaic Text Drawer                 ║");
console.log("╚══════════════════════════════════════════════╝\n");
console.log(`  Text:              "${TEXT}"`);
console.log(`  Year:              ${YEAR} ${!process.env.YEAR ? "(auto)" : ""}`);
console.log(`  Start week:        ${START_WEEK} ${!process.env.START_WEEK ? "(auto)" : ""}`);
console.log(`  Commits per pixel: ${COMMITS_PER_PIXEL}`);
console.log(`  Dry run:           ${DRY_RUN}`);

const pixels = textToPixels(TEXT);
const width = textWidth(TEXT);
console.log(`  Width:      ${width} columns`);
console.log(`  Total:      ${pixels.length} pixels x ${COMMITS_PER_PIXEL} = ${pixels.length * COMMITS_PER_PIXEL} commits\n`);
console.log(renderPreview(pixels, Math.max(width, 10)));

generateCommits(pixels, { year: YEAR, startWeek: START_WEEK, dryRun: DRY_RUN, commitsPerPixel: COMMITS_PER_PIXEL });

if (!DRY_RUN) console.log('\n Run "git push --force" to upload.\n');
