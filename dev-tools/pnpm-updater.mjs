import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const corepackCommand = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';

const dockerfilePath = path.join(repoRoot, 'Dockerfile');
const packageManagerVersionPattern = /^pnpm@([^+]+)(?:\+.*)?$/;
const dockerfilePnpmSearchPattern = /corepack prepare pnpm@[^\s]+ --activate/;
const dockerfilePnpmReplacePattern = /corepack prepare pnpm@[^\s]+ --activate/g;

const packageDirsPath = path.join(scriptDir, 'pnpm-package-dirs.json');
const packageDirs = JSON.parse(readFileSync(packageDirsPath, 'utf-8')).map(
  (packageDir) => ({
    ...packageDir,
    cwd: path.resolve(repoRoot, packageDir.path),
    packageJsonPath: path.resolve(repoRoot, packageDir.path, 'package.json'),
  })
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function getPackageManagerVersion(packageDir) {
  const packageJson = JSON.parse(readFileSync(packageDir.packageJsonPath, 'utf-8'));
  const match = packageJson.packageManager?.match(packageManagerVersionPattern);

  if (!match) {
    throw new Error(
      `${packageDir.label} package.json "packageManager" field is missing or invalid.`
    );
  }

  return match[1];
}

function syncDockerfilePnpmVersion(version) {
  const dockerfile = readFileSync(dockerfilePath, 'utf-8');

  if (!dockerfilePnpmSearchPattern.test(dockerfile)) {
    throw new Error(`No "corepack prepare pnpm@... --activate" entry found in ${dockerfilePath}`);
  }

  const updatedDockerfile = dockerfile.replaceAll(
    dockerfilePnpmReplacePattern,
    `corepack prepare pnpm@${version} --activate`
  );

  if (updatedDockerfile !== dockerfile) {
    writeFileSync(dockerfilePath, updatedDockerfile);
    console.log(`\n[Dockerfile] synced corepack pnpm version to ${version}`);
    return;
  }

  console.log(`\n[Dockerfile] pnpm version already matches ${version}`);
}

try {
  for (const packageDir of packageDirs) {
    console.log(`\n[${packageDir.label}] corepack use pnpm@latest`);
    run(corepackCommand, ['use', 'pnpm@latest'], packageDir.cwd);
  }

  // Overwrite pnpm version in Dockerfile as well
  const rootPackageDir = packageDirs.find((packageDir) => packageDir.path === '.');
  if (!rootPackageDir) throw new Error('Root package directory configuration is missing.');
  syncDockerfilePnpmVersion(getPackageManagerVersion(rootPackageDir));

  console.log('\nFinished updating pnpm.');
} catch (error) {
  console.error('\nFailed to update pnpm:', error.message);
  process.exit(1);
}
