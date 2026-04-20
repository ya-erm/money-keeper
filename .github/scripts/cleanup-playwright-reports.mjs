import fs from 'node:fs';
import path from 'node:path';

const reportsRoot = process.argv[2];
const keepPerPr = Number(process.env.PLAYWRIGHT_REPORTS_KEEP_PER_PR ?? 5);
const keepTotal = Number(process.env.PLAYWRIGHT_REPORTS_KEEP_TOTAL ?? 200);

if (!reportsRoot || !fs.existsSync(reportsRoot)) {
  process.exit(0);
}

const toRunNumber = (name) => {
  const value = Number(name);

  return Number.isSafeInteger(value) ? value : null;
};

const removeDirectory = (directory) => {
  fs.rmSync(directory, { force: true, recursive: true });
  console.log(`Removed old Playwright report: ${directory}`);
};

const runs = [];
const keep = new Set();

for (const prDirectoryName of fs.readdirSync(reportsRoot)) {
  if (!/^pr-\d+$/.test(prDirectoryName)) {
    continue;
  }

  const prDirectory = path.join(reportsRoot, prDirectoryName);
  const prDirectoryStat = fs.statSync(prDirectory);

  if (!prDirectoryStat.isDirectory()) {
    continue;
  }

  const prRuns = fs
    .readdirSync(prDirectory)
    .map((runDirectoryName) => ({
      directory: path.join(prDirectory, runDirectoryName),
      runNumber: toRunNumber(runDirectoryName),
    }))
    .filter((run) => run.runNumber !== null && fs.statSync(run.directory).isDirectory())
    .sort((left, right) => right.runNumber - left.runNumber);

  for (const run of prRuns.slice(0, keepPerPr)) {
    keep.add(run.directory);
  }

  runs.push(...prRuns);
}

runs
  .sort((left, right) => right.runNumber - left.runNumber)
  .slice(0, keepTotal)
  .forEach((run) => keep.add(run.directory));

for (const run of runs) {
  if (!keep.has(run.directory)) {
    removeDirectory(run.directory);
  }
}

for (const prDirectoryName of fs.readdirSync(reportsRoot)) {
  const prDirectory = path.join(reportsRoot, prDirectoryName);

  if (fs.statSync(prDirectory).isDirectory() && fs.readdirSync(prDirectory).length === 0) {
    removeDirectory(prDirectory);
  }
}
