/**
 * Prisma schema references env("DATABASE_URL"). A bare `prisma generate` does not load
 * the monorepo root .env, so install fails when DATABASE_URL is only in ../../.. /.env.
 * This script loads that file, then runs prisma generate (no DB connection).
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../../.env');

if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://127.0.0.1:5432/_prisma_generate_placeholder?schema=public';
}

const prisma = path.join(pkgRoot, 'node_modules', '.bin', 'prisma');
const cmd = fs.existsSync(prisma) ? prisma : 'prisma';
const result = spawnSync(cmd, ['generate'], {
  cwd: pkgRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === 0 ? 0 : result.status ?? 1);
