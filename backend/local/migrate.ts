import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LocalDatabase } from "./database";

/** Split our SQLite migration scripts while retaining complete trigger bodies. */
export function splitSqlScript(sql: string): string[] {
  const statements: string[] = [];
  let start = 0,
    index = 0,
    depth = 0;
  let trigger = false,
    prefix = "";
  while (index < sql.length) {
    const char = sql[index];
    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      index++;
      while (index < sql.length) {
        if (sql[index] === quote) {
          if (sql[index + 1] === quote) {
            index += 2;
            continue;
          }
          index++;
          break;
        }
        index++;
      }
      continue;
    }
    if (char === "-" && sql[index + 1] === "-") {
      while (index < sql.length && sql[index] !== "\n") index++;
      continue;
    }
    if (char === "/" && sql[index + 1] === "*") {
      const end = sql.indexOf("*/", index + 2);
      if (end < 0) throw new Error("Unclosed migration comment");
      index = end + 2;
      continue;
    }
    if (char && /[a-zA-Z_]/.test(char)) {
      const tokenStart = index++;
      while (index < sql.length && /[a-zA-Z_0-9]/.test(sql[index] ?? ""))
        index++;
      const token = sql.slice(tokenStart, index).toUpperCase();
      if (prefix.length < 100) prefix += `${token} `;
      if (/^CREATE\s+(TEMP\s+)?TRIGGER\s/.test(prefix)) trigger = true;
      if (trigger && (token === "BEGIN" || token === "CASE")) depth++;
      if (trigger && token === "END") depth--;
      continue;
    }
    if (char === ";" && depth === 0) {
      const statement = sql.slice(start, index + 1).trim();
      if (statement) statements.push(statement);
      start = index + 1;
      prefix = "";
      trigger = false;
    }
    index++;
  }
  if (depth !== 0) throw new Error("Unclosed migration trigger");
  const remaining = sql.slice(start).trim();
  if (remaining) statements.push(remaining);
  return statements;
}
export function migrationScripts() {
  return [
    "0001_intake.sql",
    "0002_pharmacy.sql",
    "0002_ayusetu_her.sql",
    "0003_ayusetu_vitalis.sql",
    "0005_clinic_token_sequences.sql",
  ]
    .map((name) => {
      try {
        return readFileSync(join("backend/migrations", name), "utf8");
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .concat(readFileSync("backend/cbc-migrations/0006_cbc.sql", "utf8"));
}
export function migrateLocal(db: LocalDatabase) {
  // Current scripts are additive/idempotent. Keep the schema files in order.
  for (const script of migrationScripts()) {
    try {
      db.raw.exec(script);
    } catch {
      for (const statement of splitSqlScript(script)) {
        try {
          db.raw.exec(statement);
        } catch {}
      }
    }
  }

  // Ensure clinic_token_sequences table and required columns always exist
  try {
    db.raw.exec(`
      CREATE TABLE IF NOT EXISTS clinic_token_sequences (
        org_id TEXT NOT NULL,
        clinic_id TEXT NOT NULL,
        service_date TEXT NOT NULL,
        last_value INTEGER NOT NULL CHECK (last_value > 0),
        PRIMARY KEY (org_id, clinic_id, service_date)
      );
    `);
  } catch {}
  try { db.raw.exec("ALTER TABLE encounters ADD COLUMN tier INTEGER DEFAULT 0;"); } catch {}
  try { db.raw.exec("ALTER TABLE encounters ADD COLUMN token_number INTEGER;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN phone_hash TEXT;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN dob TEXT;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN sex TEXT;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN preferred_lang TEXT;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN abha_number TEXT;"); } catch {}
  try { db.raw.exec("ALTER TABLE patients ADD COLUMN abha_address TEXT;"); } catch {}
  try {
    db.raw.exec(`
      INSERT OR IGNORE INTO clinics (org_id, id, name) VALUES 
        ('org-jeevika-primary', 'clinic-delhi-01', 'JEEVIKA Primary Health Centre'),
        ('org-jeevika-primary', 'clinic-delhi-02', 'JEEVIKA Urban Clinic'),
        ('org-jeevika-primary', 'north', 'North Clinic'),
        ('org-jeevika-primary', 'east', 'East Clinic');
    `);
  } catch {}
}
