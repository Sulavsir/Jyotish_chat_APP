/**
 * Run `prisma generate` with a fixed cwd (packages/database) so schema.prisma is found,
 * and load monorepo root .env for DATABASE_URL. Safe for CI/VPS when .env is missing
 * (placeholder URL — generate does not connect to the DB).
 *
 * Prefer running via: pnpm --filter database db:generate (from repo root)
 * Do not rely on postinstall for Prisma — run generate explicitly after install/deploy.
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../../.env');

try {
  if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      'postgresql://127.0.0.1:5432/_prisma_generate_placeholder?schema=public';
  }

  // Prefer pnpm so the workspace's prisma is used without npx/npm noise in monorepos.
  const cmd = process.env.PRISMA_GENERATE_CMD || 'pnpm exec prisma generate';
  execSync(cmd, {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
} catch (err) {
  console.error('[prisma-generate]', err);
  process.exit(1);
}
