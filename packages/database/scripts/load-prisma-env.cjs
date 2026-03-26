/**
 * Preload for: node -r ./scripts/load-prisma-env.cjs ./node_modules/prisma/build/index.js <prisma args>
 *
 * - Loads repo root .env then packages/database/.env
 * - Strips NODE_OPTIONS (pnpm often injects flags that break Prisma when run as the main script)
 * - Sets DATABASE_URL placeholder only for generate/validate/format when unset
 *
 * Running Prisma in the SAME Node process avoids a nested subprocess — fixes exit -2 / 254 on Linux + pnpm.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..');
const rootEnv = path.join(pkgRoot, '../../../.env');
const localEnv = path.join(pkgRoot, '.env');

if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
}

if (process.env.PRISMA_CLI_KEEP_NODE_OPTIONS !== '1') {
  delete process.env.NODE_OPTIONS;
}

const PLACEHOLDER_DB =
  'postgresql://127.0.0.1:5432/_prisma_placeholder?schema=public';

// argv: [node, prisma/build/index.js, <subcommand>, ...]  (-r is not in argv)
const prismaArgs = process.argv.slice(2);
const sub = prismaArgs[0];

const needsRealDb =
  sub === 'migrate' ||
  sub === 'db' ||
  sub === 'studio' ||
  sub === 'introspect' ||
  sub === 'pull';

if (!process.env.DATABASE_URL) {
  if (sub === 'generate' || sub === 'validate' || sub === 'format') {
    process.env.DATABASE_URL = PLACEHOLDER_DB;
  } else if (needsRealDb) {
    console.error(
      '[load-prisma-env] DATABASE_URL is not set. Add repo root .env (../../../.env) or packages/database/.env'
    );
    process.exit(1);
  } else {
    process.env.DATABASE_URL = PLACEHOLDER_DB;
  }
}
