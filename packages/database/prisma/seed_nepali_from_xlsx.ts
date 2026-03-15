/**
 * Seed NepaliDate table from both date_miti.sql and Excel in one run.
 * Merges data from both sources, dedupes by englishDate, then inserts once.
 *
 * - date_miti.sql: prisma/date_miti.sql or workspace root. COPY format, tab-separated.
 * - Excel: AD_to_BS_Master_List_1944_2026.xlsx, columns AD Date, BS Date, Day.
 */

import type { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

type NepaliDateRecord = { englishDate: Date; nepaliDate: string; days: string };

const BATCH_SIZE = 2000;

const XLSX_PATH = path.resolve(
  __dirname,
  '../../config/AD_to_BS_Master_List_1944_2026.xlsx'
);

/** Resolve date_miti.sql: prisma/date_miti.sql then workspace root date_miti.sql */
function getDateMitiSqlPath(): string | null {
  const inPrisma = path.join(__dirname, 'date_miti.sql');
  if (fs.existsSync(inPrisma)) return inPrisma;
  const atRoot = path.join(__dirname, '../../../date_miti.sql');
  if (fs.existsSync(atRoot)) return atRoot;
  return null;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse pg_dump COPY stdin data: tab-separated id, english_date, nepali_date, days, reference_id.
 */
function parseDateMitiSql(content: string): NepaliDateRecord[] {
  const lines = content.split(/\r?\n/);
  const records: NepaliDateRecord[] = [];
  let inCopy = false;
  for (const line of lines) {
    if (line.startsWith('COPY ') && (line.includes('auto_date_miti') || line.includes('NepaliDate'))) {
      inCopy = true;
      continue;
    }
    if (inCopy) {
      if (line.trim() === '\\.') break;
      const parts = line.split('\t');
      if (parts.length < 4) continue;
      const englishDateStr = parts[1];
      const nepaliDateStr = parts[2];
      const daysStr = parts[3];
      if (!englishDateStr || !nepaliDateStr) continue;
      const d = new Date(englishDateStr.trim());
      if (Number.isNaN(d.getTime())) continue;
      const raw = (daysStr?.trim() ?? 'Sun').trim();
      const days = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Sun';
      records.push({
        englishDate: d,
        nepaliDate: nepaliDateStr.trim(),
        days,
      });
    }
  }
  return records;
}

/** Load records from date_miti.sql. Returns [] if file missing or empty. */
function loadRecordsFromSql(): NepaliDateRecord[] {
  const sqlPath = getDateMitiSqlPath();
  if (!sqlPath) return [];
  const content = fs.readFileSync(sqlPath, 'utf-8');
  const records = parseDateMitiSql(content);
  if (records.length > 0) {
    console.log(`📂 Loaded ${records.length} rows from ${path.basename(sqlPath)}`);
  }
  return records;
}

function normalizeDay(day: unknown): string {
  if (typeof day !== 'string') return 'Sun';
  const s = day.trim();
  if (!s) return 'Sun';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parseExcelRow(row: unknown[]): NepaliDateRecord | null {
  const ad = row[0];
  const bs = row[1];
  const day = row[2];
  if (ad == null || bs == null) return null;
  const adStr = String(ad).trim();
  const bsStr = String(bs).trim();
  if (!adStr || !bsStr) return null;
  const d = new Date(adStr);
  if (isNaN(d.getTime())) return null;
  return {
    englishDate: d,
    nepaliDate: bsStr,
    days: normalizeDay(day),
  };
}

/** Load records from Excel. Returns [] if file missing or invalid. */
function loadRecordsFromXlsx(): NepaliDateRecord[] {
  if (!fs.existsSync(XLSX_PATH)) return [];
  const wb = XLSX.readFile(XLSX_PATH);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  if (rows.length < 2) return [];
  const records: NepaliDateRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const parsed = parseExcelRow(rows[i] as unknown[]);
    if (parsed) records.push(parsed);
  }
  if (records.length > 0) {
    console.log(`📂 Loaded ${records.length} rows from ${path.basename(XLSX_PATH)}`);
  }
  return records;
}

/**
 * Merge SQL + Excel records. Key by englishDate (YYYY-MM-DD); later source wins on duplicate date.
 * Order: SQL first, then Excel (so Excel overwrites same date if both have it).
 */
function mergeRecords(sqlRecords: NepaliDateRecord[], xlsxRecords: NepaliDateRecord[]): NepaliDateRecord[] {
  const byKey = new Map<string, NepaliDateRecord>();
  for (const r of sqlRecords) {
    byKey.set(toDateKey(r.englishDate), r);
  }
  for (const r of xlsxRecords) {
    byKey.set(toDateKey(r.englishDate), r);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => a.englishDate.getTime() - b.englishDate.getTime()
  );
}

/**
 * Seed NepaliDate from both date_miti.sql and Excel in one run.
 * Loads both sources, merges (dedupes by englishDate), clears table, then batch inserts.
 * Call from main seed so db:seed does everything once.
 */
export async function seedNepaliDates(prisma: PrismaClient): Promise<void> {
  const sqlRecords = loadRecordsFromSql();
  const xlsxRecords = loadRecordsFromXlsx();

  if (sqlRecords.length === 0 && xlsxRecords.length === 0) {
    console.log('⚠️  No Nepali date data found (no date_miti.sql and no Excel file). Skipping NepaliDate seed.');
    return;
  }

  const merged = mergeRecords(sqlRecords, xlsxRecords);
  console.log(`📋 Merged ${merged.length} unique dates (SQL: ${sqlRecords.length}, Excel: ${xlsxRecords.length})`);

  await prisma.nepaliDate.deleteMany({});
  console.log('🗑️  Cleared existing NepaliDate rows');

  for (let i = 0; i < merged.length; i += BATCH_SIZE) {
    const batch = merged.slice(i, i + BATCH_SIZE);
    await prisma.nepaliDate.createMany({ data: batch });
    console.log(`✅ NepaliDate: seeded ${Math.min(i + BATCH_SIZE, merged.length)} / ${merged.length}`);
  }

  console.log('🎉 Nepali date seed complete (SQL + Excel merged).');
}
