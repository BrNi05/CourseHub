import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const workflowDir = path.join(repoRoot, '.github', 'workflows');
const corepackCommand = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';

// Monorepo packages
const packageDirs = [
  { label: 'root', cwd: repoRoot },
  { label: 'backend', cwd: path.join(repoRoot, 'apps', 'backend') },
  { label: 'client', cwd: path.join(repoRoot, 'apps', 'client') },
  { label: 'sdk', cwd: path.join(repoRoot, 'packages', 'sdk') },
];

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

// After the package pnpm update, read it
function readResolvedPnpmVersion() {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const packageManager = packageJson.packageManager;

  return packageManager.slice('pnpm@'.length).split('+')[0];
}

function updateWorkflowVersions(pnpmVersion) {
  const workflowFiles = readdirSync(workflowDir)
    .filter((fileName) => /\.ya?ml$/i.test(fileName))
    .map((fileName) => path.join(workflowDir, fileName));

  for (const workflowFile of workflowFiles) {
    const source = readFileSync(workflowFile, 'utf8');

    const lines = source.split(/\r?\n/);

    let insidePnpmSetupStep = false;
    let setupIndent = -1;
    let changed = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const indent = line.match(/^\s*/)?.[0].length ?? 0;

      if (/^\s*-\s/.test(line)) {
        insidePnpmSetupStep = false;
        setupIndent = indent;
      }

      if (/^\s*uses:\s*pnpm\/action-setup@/i.test(line)) {
        insidePnpmSetupStep = true;
        setupIndent = indent;
        continue;
      }

      if (
        insidePnpmSetupStep &&
        indent > setupIndent &&
        /^\s*version:\s*/.test(line)
      ) {
        const match = line.match(/^(\s*version:\s*)(["']?)([^"'\r\n]+)(["']?)\s*$/);

        if (!match) continue;

        const quote = match[2] || match[4] || '';
        const nextLine = `${match[1]}${quote}${pnpmVersion}${quote}`;

        if (nextLine !== line) {
          lines[index] = nextLine;
          changed = true;
        }

        console.log(`\n[${path.basename(workflowFile)}] ${line.trim()} -> ${nextLine.trim()}`);

        insidePnpmSetupStep = false;
      }
    }

    if (changed) {
      writeFileSync(workflowFile, lines.join(source.includes('\r\n') ? '\r\n' : '\n'));
    }
  }
}

try {
  for (const packageDir of packageDirs) {
    console.log(`\n[${packageDir.label}] corepack use pnpm@latest`);
    run(corepackCommand, ['use', 'pnpm@latest'], packageDir.cwd);
  }

  updateWorkflowVersions(readResolvedPnpmVersion());

  console.log('\nFinished updating pnpm.');
} catch (error) {
  console.error('\nFailed to update pnpm:', error.message);
  process.exit(1);
}
