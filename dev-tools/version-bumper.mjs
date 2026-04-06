/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const packageDirsPath = path.join(scriptDir, 'pnpm-package-dirs.json');

const packageDirs = JSON.parse(readFileSync(packageDirsPath, 'utf8'));

function getPackageJsonPath(packageDir) {
  return path.join(repoRoot, packageDir.path, 'package.json');
}

function readPackageJson(packageDir) {
  const packageJsonPath = getPackageJsonPath(packageDir);
  return {
    path: packageJsonPath,
    json: JSON.parse(readFileSync(packageJsonPath, 'utf8')),
    label: packageDir.label,
  };
}

function bumpVersion(version, bumpType) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) throw new Error(`Unsupported version format: ${version}`);

  const [, major, minor, patch] = match;
  const next = {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
  };

  if (bumpType === '1') next.patch += 1;

  if (bumpType === '2') {
    next.minor += 1;
    next.patch = 0;
  }

  if (bumpType === '3') {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
  }

  return `${next.major}.${next.minor}.${next.patch}`;
}

const rootPackage = packageDirs.find((packageDir) => packageDir.path === '.');

if (!rootPackage) {
  console.error('\nRoot package directory configuration is missing.');
  process.exit(1);
}

const rootPackageJson = readPackageJson(rootPackage);
const currentVersion = rootPackageJson.json.version;

console.log(`Current root version: ${currentVersion}`);
console.log('\nWhat to bump?');
console.log('1: patch');
console.log('2: minor');
console.log('3: major');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const choice = (await rl.question('\nSelect bump: ')).trim();

  if (!['1', '2', '3'].includes(choice)) {
    console.log('\nNo changes made.');
    process.exit(0);
  }

  const nextVersion = bumpVersion(currentVersion, choice);

  console.log(); // spacer

  for (const packageDir of packageDirs) {
    const packageData = readPackageJson(packageDir);
    packageData.json.version = nextVersion;

    writeFileSync(
      packageData.path,
      `${JSON.stringify(packageData.json, null, 2)}\n`,
      'utf8'
    );

    console.log(`[${packageData.label}] ${nextVersion}`);
  }
} finally {
  rl.close();
}
