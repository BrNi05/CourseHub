/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const unixShell = process.env.SHELL || '/bin/bash';
const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
const nvmScript = path.join(nvmDir, 'nvm.sh');
const repoRoot = path.join(__dirname, '..');

const packageDirsPath = path.join(__dirname, 'pnpm-package-dirs.json');
const packageDirs = JSON.parse(readFileSync(packageDirsPath, 'utf-8')).map(
  (packageDir) => ({
    ...packageDir,
    cwd: path.resolve(repoRoot, packageDir.path),
    packageJsonPath: path.resolve(repoRoot, packageDir.path, 'package.json'),
  })
);

function getPackageManager(packageDir) {
  if (!existsSync(packageDir.packageJsonPath)) {
    throw new Error(`package.json was not found at ${packageDir.packageJsonPath}`);
  }

  const pkg = JSON.parse(readFileSync(packageDir.packageJsonPath, 'utf-8'));

  if (!pkg.packageManager?.startsWith('pnpm@')) {
    throw new Error(
      `${packageDir.label} package.json "packageManager" field is missing or invalid.`
    );
  }

  return pkg.packageManager;
}

function shellEscape(value) {
  const newLocal = String.raw`'\''`;
  return `'${String(value).replaceAll('\'', newLocal)}'`;
}

function powershellEscape(value) {
  return `'${String(value).replaceAll('\'', "''")}'`;
}

function buildScript(command) {
  if (isWindows) return command;

  if (!existsSync(nvmScript)) throw new Error(`nvm.sh was not found at ${nvmScript}`);

  return `. ${shellEscape(nvmScript)} && ${command}`;
}

function execute(command, { capture = false, cwd } = {}) {
  const shellCommand = buildScript(command);
  const executable = isWindows ? 'powershell' : unixShell;
  const args = isWindows
    ? ['-NoProfile', '-Command', shellCommand]
    : ['-lc', shellCommand];

  console.log(`> ${command}`);

  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf-8',
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    const output = `${result.stderr || ''}${result.stdout || ''}`.trim();
    throw new Error(output || `Command failed with exit code ${result.status}`);
  }

  return capture ? result.stdout.trim() : '';
}

try {
  console.log(`Current Node version: ${process.version}\n`);

  execute(
    isWindows
      ? 'nvm install lts; nvm use lts'
      : "nvm install --lts && nvm alias default 'lts/*' >/dev/null && nvm use --lts >/dev/null"
  );

  console.log(); // spacer

  execute(
    isWindows
      ? 'corepack enable'
      : 'nvm use --lts >/dev/null && corepack enable'
  );

  console.log(); // spacer

  for (const packageDir of packageDirs) {
    const packageManager = getPackageManager(packageDir);

    execute(
      isWindows
        ? `corepack prepare ${powershellEscape(packageManager)} --activate; corepack install`
        : `nvm use --lts >/dev/null && corepack prepare ${shellEscape(packageManager)} --activate && corepack install`,
      { cwd: packageDir.cwd }
    );

    console.log(); // spacer
  }
} catch (error) {
  console.error('\nUpdate process failed:', error.message);
  process.exit(1);
}
