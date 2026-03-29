import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const corepackCommand = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';

const packageDirsPath = path.join(scriptDir, 'pnpm-package-dirs.json');
const packageDirs = JSON.parse(readFileSync(packageDirsPath, 'utf-8')).map(
  (packageDir) => ({
    ...packageDir,
    cwd: path.resolve(repoRoot, packageDir.path),
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

try {
  for (const packageDir of packageDirs) {
    console.log(`\n[${packageDir.label}] corepack use pnpm@latest`);
    run(corepackCommand, ['use', 'pnpm@latest'], packageDir.cwd);
  }

  console.log('\nFinished updating pnpm.');
} catch (error) {
  console.error('\nFailed to update pnpm:', error.message);
  process.exit(1);
}
