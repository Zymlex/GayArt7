import { execSync } from "child_process";

export function getGraphStartDate(year) {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOfWeek = jan1.getUTCDay();
  const sunday = new Date(jan1);
  sunday.setUTCDate(jan1.getUTCDate() - dayOfWeek);
  sunday.setUTCHours(12, 0, 0, 0);
  return sunday;
}

export function getDateForPixel(year, column, row, startWeek = 0, secondOffset = 0) {
  const start = getGraphStartDate(year);
  const daysOffset = (startWeek + column) * 7 + row;
  const date = new Date(start);
  date.setUTCDate(start.getUTCDate() + daysOffset);
  date.setUTCMinutes(0, secondOffset, 0);
  date.setUTCHours(12);
  return date;
}

export function generateCommits(pixels, { year, startWeek = 0, dryRun = false, commitsPerPixel = 25 }) {
  if (!pixels.length) { console.log("No pixels to draw."); return; }

  const datedPixels = pixels.map((p, i) => ({
    ...p, date: getDateForPixel(year, p.col, p.row, startWeek, i % 60),
  }));
  datedPixels.sort((a, b) => a.date.getTime() - b.date.getTime());

  const totalPixels = datedPixels.length;
  const total = totalPixels * commitsPerPixel;

  if (dryRun) {
    console.log(`\nDRY RUN: ${totalPixels} pixels x ${commitsPerPixel} = ${total} commits\n`);
    datedPixels.slice(0, 5).forEach(p =>
      console.log(`  ${p.date.toISOString().slice(0, 10)} (week ${startWeek + p.col}, day ${p.row})`)
    );
    if (totalPixels > 5) console.log(`  ... and ${totalPixels - 5} more`);
    return;
  }

  console.log(`\nCreating ${total} commits (${totalPixels} pixels x ${commitsPerPixel} each)...\n`);

  try { execSync("git config user.name", { stdio: "pipe" }); }
  catch {
    execSync('git config user.name "mosaic-bot"', { stdio: "inherit" });
    execSync('git config user.email "mosaic-bot@users.noreply.github.com"', { stdio: "inherit" });
  }

  try { execSync("git log --oneline -1", { stdio: "pipe" }); }
  catch { execSync('git commit --allow-empty -m "initial"', { stdio: "inherit" }); }

  let lastPercent = -1, commitIndex = 0;
  for (let i = 0; i < totalPixels; i++) {
    const p = datedPixels[i];
    for (let c = 0; c < commitsPerPixel; c++) {
      const date = new Date(p.date);
      date.setUTCSeconds(c);
      const dateStr = date.toISOString();
      execSync(
        `GIT_AUTHOR_DATE="${dateStr}" GIT_COMMITTER_DATE="${dateStr}" ` +
        `git commit --allow-empty -m "contribution ${commitIndex}"`,
        { stdio: "pipe" }
      );
      commitIndex++;
      const percent = Math.floor((commitIndex / total) * 100);
      if (percent !== lastPercent && percent % 10 === 0) {
        lastPercent = percent;
        const bar = "█".repeat(Math.floor(percent/10)) + "░".repeat(10 - Math.floor(percent/10));
        process.stdout.write(`  [${bar}] ${percent}%\r`);
      }
    }
  }
  console.log(`\n\nDone! ${total} commits created.`);
}
