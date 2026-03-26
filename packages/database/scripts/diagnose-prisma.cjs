/**
 * Run on the server (SSH) to compare staging vs production: paths, Node, prisma resolve, .env presence.
 * Does not print your DB password (only host/port/db from DATABASE_URL if set).
 *
 *   pnpm --filter database db:diagnose
 *   # or from packages/database:
 *   node ./scripts/diagnose-prisma.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgRoot = path.join(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../.env');
const localEnv = path.join(pkgRoot, '.env');

function maskDatabaseUrl(url) {
  if (!url || typeof url !== 'string') return '(not set)';
  try {
    const u = new URL(url);
    const user = u.username ? `${u.username}@` : '';
    return `${u.protocol}//${user}${u.hostname}:${u.port || '(default)'}/${u.pathname.replace(/^\//, '').split('/')[0] || ''}${u.search ? '?' + u.search.slice(0, 20) + '…' : ''}`;
  } catch {
    return '(invalid URL, hidden)';
  }
}

console.log('--- Prisma / env diagnose ---');
console.log('cwd:', process.cwd());
console.log('packages/database:', pkgRoot);
console.log('repo root .env (expected):', rootEnv);
console.log('  exists:', fs.existsSync(rootEnv));
console.log('packages/database/.env (optional):', localEnv);
console.log('  exists:', fs.existsSync(localEnv));
console.log('node:', process.version);
console.log('platform:', process.platform, process.arch);

try {
  console.log('pnpm:', execSync('pnpm --version', { encoding: 'utf8' }).trim());
} catch {
  console.log('pnpm: (not in PATH)');
}

try {
  const p = require.resolve('prisma/build/index.js', { paths: [pkgRoot] });
  console.log('prisma CLI resolved:', p);
  console.log('  file exists:', fs.existsSync(p));
} catch (e) {
  console.log('prisma CLI resolve FAILED:', e.message);
  console.log('  Fix: run `pnpm install` from monorepo root.');
}

if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
}

console.log('DATABASE_URL (masked):', maskDatabaseUrl(process.env.DATABASE_URL));
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || '(unset)');
console.log('--- end ---');
