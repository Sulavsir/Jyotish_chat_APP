/**
 * Run `prisma generate` without dotenv-cli or `pnpm exec`.
 *
 * Why not `pnpm exec prisma generate`?
 *   During postinstall, `pnpm exec` can fail with exit code -2 on Linux
 *   because shell PATH / bin links aren't fully wired yet.
 *
 * Instead we resolve prisma's CLI JS entry via require.resolve and run it
 * directly with the current Node process — zero shell dependencies.
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

// Find prisma CLI entry point via require.resolve (works even when PATH isn't wired).
let prismaCli;
try {
  const prismaDir = path.dirname(require.resolve('prisma/package.json', { paths: [pkgDir] }));
  prismaCli = path.join(prismaDir, 'build', 'index.js');
  if (!fs.existsSync(prismaCli)) prismaCli = null;
} catch {
  prismaCli = null;
}

if (!prismaCli) {
  console.log('[prisma-generate] prisma not installed yet. Skipping — will generate during build.');
  process.exit(0);
}

try {
  execSync(`node "${prismaCli}" generate`, {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
  });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
