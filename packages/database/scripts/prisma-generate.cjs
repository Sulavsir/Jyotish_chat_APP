/**
 * Runs `prisma generate` without dotenv-cli or pnpm exec.
 *
 * dotenv-cli spawns pnpm exec without a shell, which fails on Linux when pnpm
 * is installed as a shell script (exit code -2 / ENOENT).
 *
 * This script:
 *   1. Loads the repo-root .env if present (no external deps)
 *   2. Finds the prisma CLI JS file directly via require.resolve or known pnpm paths
 *   3. Runs `node <prisma-cli> generate` — no shell, no PATH lookup needed
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(pkgDir, '..', '..');
const repoRootEnv = path.join(workspaceRoot, '.env');

// Load .env without dotenv-cli
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(repoRootEnv);

if (!process.env.DATABASE_URL) {
  // Prisma generate only needs schema access, not a live DB — placeholder is fine
  process.env.DATABASE_URL =
    'postgresql://127.0.0.1:5432/prisma_generate_placeholder?schema=public';
}

// Find the prisma CLI JS entry point (avoids PATH / shell script issues)
function findPrismaCli() {
  const candidates = [
    // 1. Local package node_modules (pnpm links devDeps here)
    path.join(pkgDir, 'node_modules', 'prisma', 'build', 'index.js'),
    // 2. Workspace root hoisted node_modules
    path.join(workspaceRoot, 'node_modules', 'prisma', 'build', 'index.js'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // 3. pnpm virtual store: <root>/node_modules/.pnpm/prisma@VERSION/node_modules/prisma/build/index.js
  const pnpmStore = path.join(workspaceRoot, 'node_modules', '.pnpm');
  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (!entry.startsWith('prisma@')) continue;
      const c = path.join(pnpmStore, entry, 'node_modules', 'prisma', 'build', 'index.js');
      if (fs.existsSync(c)) return c;
    }
  }

  // 4. require.resolve fallback
  try {
    const pkg = require.resolve('prisma/package.json', { paths: [pkgDir, workspaceRoot] });
    const c = path.join(path.dirname(pkg), 'build', 'index.js');
    if (fs.existsSync(c)) return c;
  } catch { /* ignore */ }

  return null;
}

const prismaCli = findPrismaCli();

if (!prismaCli) {
  console.error('[prisma-generate] ERROR: prisma CLI not found. Run pnpm install first.');
  process.exit(1);
}

console.log('[prisma-generate] Using:', prismaCli);

try {
  execFileSync(process.execPath, [prismaCli, 'generate'], {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
  });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
