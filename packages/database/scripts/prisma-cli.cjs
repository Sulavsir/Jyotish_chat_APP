/**
 * Run Prisma CLI without shell shims or dotenv-cli (those often yield exit code -2 on Linux/VPS).
 * Invokes: node <prisma>/build/index.js <args...> with cwd = packages/database.
 *
 * Loads env: repo root ../../../.env, then packages/database/.env (overrides).
 *
 * Usage: node ./scripts/prisma-cli.cjs generate
 *        node ./scripts/prisma-cli.cjs migrate deploy
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../../.env');
const localEnv = path.join(pkgRoot, '.env');

function loadEnv() {
  if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
  }
  if (fs.existsSync(localEnv)) {
    require('dotenv').config({ path: localEnv });
  }
}

function resolvePrismaEntry() {
  const roots = [pkgRoot, path.join(pkgRoot, '..'), path.join(pkgRoot, '..', '..')];
  for (const root of roots) {
    try {
      return require.resolve('prisma/build/index.js', { paths: [root] });
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'Could not resolve prisma/build/index.js. Run `pnpm install` from the monorepo root.'
  );
}

const PLACEHOLDER_DB =
  'postgresql://127.0.0.1:5432/_prisma_placeholder?schema=public';

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/prisma-cli.cjs <prisma arguments...>');
    console.error('Example: node scripts/prisma-cli.cjs generate');
    console.error('Example: node scripts/prisma-cli.cjs migrate deploy');
    process.exit(1);
  }

  loadEnv();

  const sub = args[0];
  const needsRealDb =
    sub === 'migrate' ||
    sub === 'db' ||
    sub === 'studio' ||
    sub === 'introspect' ||
    sub === 'pull';

  if (!process.env.DATABASE_URL) {
    if (sub === 'generate' || sub === 'validate' || sub === 'format') {
      process.env.DATABASE_URL = PLACEHOLDER_DB;
    } else if (!needsRealDb) {
      process.env.DATABASE_URL = PLACEHOLDER_DB;
    } else {
      console.error(
        '[prisma-cli] DATABASE_URL is not set. Add it to the repo root .env (../../../.env from here) or packages/database/.env'
      );
      process.exit(1);
    }
  }

  const prismaEntry = resolvePrismaEntry();
  const result = spawnSync(process.execPath, [prismaEntry, ...args], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (result.error) {
    console.error('[prisma-cli] spawn failed:', result.error);
    process.exit(1);
  }
  process.exit(result.status === 0 ? 0 : result.status ?? 1);
}

main();
