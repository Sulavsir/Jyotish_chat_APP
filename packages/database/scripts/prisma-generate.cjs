/**
 * Run `prisma generate` for this package. Uses `pnpm exec prisma` (shell-invoked CLI),
 * never `node .../node_modules/.bin/prisma` — on Linux, `.bin/prisma` is often a shell
 * script; passing it to Node causes a syntax error / exit code -2.
 *
 * Loads monorepo root `../../.env` when present; otherwise sets a placeholder DATABASE_URL.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const repoRootEnv = path.join(pkgDir, '..', '..', '.env');

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
  process.env.DATABASE_URL =
    'postgresql://127.0.0.1:5432/prisma_generate_placeholder?schema=public';
}

try {
  execSync('pnpm exec prisma generate', {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
