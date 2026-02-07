/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const isWindows = os.platform() === 'win32';
const shell = process.env.SHELL;
const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), '.nvm');

// pnpm version
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
if (!pkg.packageManager?.startsWith('pnpm@')) {
  console.error(
    'Error: package.json "packageManager" field is missing or invalid.'
  );
  process.exit(1);
}
const pnpmVersion = pkg.packageManager.split('@')[1];

// Execute a shell command
function run(cmd, { silent = false } = {}) {
  if (!silent) console.log(`> ${cmd}`);

  // On Windows, spawn a new shell on every command so Node switch does not break the script
  const isWindows = process.platform === 'win32';
  let output;
  if (isWindows) {
    output = spawnSync('powershell', ['-Command', cmd], {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } else {
    // Load nvm in the shell
    const nvmInit = `. ${nvmDir}/nvm.sh`;
    const fullCmd = `${nvmInit} && ${cmd}`;
    output = spawnSync(shell, ['-c', fullCmd], {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  }
  if (!silent) {
    process.stdout.write(output.stdout);
  }

  if (output.error) throw output.error;
  if (output.status !== 0) throw new Error(output.stderr);

  return output;
}

// Return the current Node version
function getCurrentNode() {
  const output = run('node -v', { silent: true });

  return output.stdout.trim().substring(1);
}

// Returns installed Node versions
function getInstalledNodes() {
  const output = run('nvm list', { silent: true });
  const result = output.stdout.trim();
  let parsed = result.match(/\d+\.\d+\.\d+/g) || [];

  parsed = parsed.filter((v) => v !== getCurrentNode()); // Do not remove current version

  return parsed;
}

try {
  console.log('Current Node version:');
  run('node -v');

  console.log('\nUpdating Node to latest LTS...');
  if (isWindows) {
    run('nvm install lts');
    run('nvm use lts');
  } else {
    run('nvm install --lts');
    run('nvm alias default "lts/*"');
    run('nvm use default');
  }

  console.log('\nUpdate complete! Now using:');
  run('node -v');

  // Install pnpm globally (or make sure it is already installed)
  console.log('\nInstalling pnpm globally...');
  run(`npm install -g pnpm@${pnpmVersion}`);

  console.log('\nCleaning up old Node versions...');
  const installedNodes = getInstalledNodes();

  if (installedNodes.length == 0) {
    console.log('No old Node versions found.');
  } else {
    console.log('Old Node versions:', installedNodes);
    installedNodes.forEach((v) => {
      console.log(`\nUninstalling ${v}...`);
      // Might produce errors (when the old installs are used by other processes)
      // Exit code is 0 so this script does not fail
      run(`nvm uninstall ${v}`);
    });
    console.log(); // dummy print
  }

  console.log('\nCleanup complete!');
} catch (err) {
  console.error('\nUpdate process failed:', err.message);
  process.exit(1);
}
