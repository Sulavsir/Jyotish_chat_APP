import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = { migration_name: string; started_at: Date | null; finished_at: Date | null };

async function main() {
  // One row per name (keeps latest `started_at` if the table ever has duplicates).
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT DISTINCT ON ("migration_name") "migration_name", "started_at", "finished_at"
    FROM "_prisma_migrations"
    ORDER BY "migration_name" ASC, "started_at" DESC
  `;
  console.log(`${rows.length} migration name(s) recorded on this database:\n`);
  for (const r of rows) {
    const done = r.finished_at ? 'applied' : 'incomplete';
    console.log(`  ${r.migration_name}  (${done})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
