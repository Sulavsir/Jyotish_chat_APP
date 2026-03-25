#!/usr/bin/env bash
# Baseline: mark every migration up to and including
# 20260324120000_nepal_geography_unique_province_name as already applied.
#
# Run ONLY when the database already reflects all of that SQL (e.g. you used db:push
# or applied changes manually). Wrong baselines break future migrate deploy.
#
# After this, apply newer migrations with:
#   pnpm db:migrate:deploy && pnpm db:generate
# (On servers, prefer deploy — it applies all pending migrations in order.)
#
# `pnpm db:migrate` runs `migrate dev` (interactive, dev-oriented). For “just run
# pending migrations” without prompts, use `pnpm db:migrate:deploy`.

set -euo pipefail

MIGRATIONS=(
  20260324120000_astrologer_commission_split
  20260324120000_nepal_geography_unique_province_name
)

for name in "${MIGRATIONS[@]}"; do
  echo "→ prisma migrate resolve --applied $name"
  pnpm exec prisma migrate resolve --applied "$name"
done

echo ""
echo "Baseline complete through nepal_geography_unique_province_name."
echo "Next: pnpm db:migrate:deploy && pnpm db:generate   (applies all newer migrations, e.g. broadcast expires_at)"
