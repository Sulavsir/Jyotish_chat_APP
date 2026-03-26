/**
 * Prisma schema references env("DATABASE_URL"). Loads monorepo root .env, then runs
 * `prisma generate` via Node (avoids pnpm `.bin` shell shims failing under spawnSync on Linux).
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../../.env');

function resolvePrismaEntry() {
  const searchRoots = [
    pkgRoot,
    path.join(pkgRoot, '..'), // packages/
    path.join(pkgRoot, '..', '..'), // repo root
  ];
  for (const root of searchRoots) {
    try {
      return require.resolve('prisma/build/index.js', { paths: [root] });
    } catch {
      // try next
    }
  }
  throw new Error(
    'Could not resolve prisma/build/index.js — run `pnpm install` from the monorepo root.'
  );
}

try {
  if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      'postgresql://127.0.0.1:5432/_prisma_generate_placeholder?schema=public';
  }

  const prismaEntry = resolvePrismaEntry();
  const result = spawnSync(process.execPath, [prismaEntry, 'generate'], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (result.error) {
    console.error('[postinstall-prisma] spawn failed:', result.error);
    process.exit(1);
  }
  process.exit(result.status === 0 ? 0 : result.status ?? 1);
} catch (err) {
  console.error('[postinstall-prisma]', err);
  process.exit(1);
}
