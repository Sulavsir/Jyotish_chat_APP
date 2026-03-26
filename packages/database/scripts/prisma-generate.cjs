/**
 * Run `prisma generate` without depending on dotenv-cli (which isn't linked during postinstall).
 *
 * Loads repo-root `.env` when present; otherwise uses a placeholder DATABASE_URL
 * (Prisma only needs a valid URL shape for client generation, not a live DB).
 *
 * During `pnpm i`, prisma may not be linked yet — in that case we skip gracefully
 * (the `build` script will generate the client before compilation).
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

// Check if prisma binary is reachable before attempting generate.
// During `pnpm install` postinstall, devDependencies may not be linked yet.
try {
  execSync('pnpm exec prisma --version', {
    cwd: pkgDir,
    stdio: 'ignore',
    env: process.env,
  });
} catch {
  const isPostInstall = process.env.npm_lifecycle_event === 'postinstall';
  if (isPostInstall) {
    console.log(
      '[prisma-generate] prisma not available yet (postinstall). Skipping — will generate during build.'
    );
    process.exit(0);
  }
  console.error('[prisma-generate] prisma binary not found. Run pnpm install first.');
  process.exit(1);
}

try {
  execSync('pnpm exec prisma generate', {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
  });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
