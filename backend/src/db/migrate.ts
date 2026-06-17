import * as fs from 'fs';
import * as path from 'path';
import { getDB } from './index';

export function runMigrations() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const getApplied = db.prepare('SELECT filename FROM _migrations').all() as { filename: string }[];
  const appliedFiles = new Set(getApplied.map(r => r.filename));

  for (const file of files) {
    if (!appliedFiles.has(file)) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.transaction(() => {
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
      })();
      console.log(`Applied migration: ${file}`);
    }
  }
}
