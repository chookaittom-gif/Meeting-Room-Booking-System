import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function applyAllMigrations(db: D1Database) {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = [
    '0001_initial_schema.sql',
    '0002_system_settings.sql',
    '0003_admin_roles.sql',
    '0004_update_admin_names.sql',
    '0005_add_equipment_and_update_capacities.sql',
    '0006_add_room_fee_deposit.sql',
    '0007_add_staff_role.sql',
  ];
  for (const f of files) {
    const fullPath = path.join(migrationsDir, f);
    if (fs.existsSync(fullPath)) {
      const sql = fs.readFileSync(fullPath, 'utf8');
      db.exec(sql);
    }
  }
}

export function createMemoryD1Database(): D1Database {
  const db = new DatabaseSync(':memory:');

  class SQLiteD1PreparedStatement {
    private query: string;
    private bindings: any[];

    constructor(query: string, bindings: any[] = []) {
      this.query = query;
      this.bindings = bindings;
    }

    bind(...values: any[]) {
      return new SQLiteD1PreparedStatement(this.query, values);
    }

    async first<T = unknown>(colName?: string): Promise<T | null> {
      const stmt = db.prepare(this.query);
      const row = stmt.get(...this.bindings) as Record<string, any> | undefined;
      if (!row) return null;
      if (colName) return (row[colName] ?? null) as T;
      return row as T;
    }

    async all<T = unknown>(): Promise<any> {
      const stmt = db.prepare(this.query);
      const results = stmt.all(...this.bindings);
      return {
        results,
        success: true,
        meta: { duration: 0, changes: 0, last_row_id: 0, rows_read: results.length, rows_written: 0 },
      };
    }

    async run<T = unknown>(): Promise<any> {
      const stmt = db.prepare(this.query);
      const result = stmt.run(...this.bindings);
      return {
        success: true,
        meta: {
          duration: 0,
          changes: result.changes,
          last_row_id: Number(result.lastInsertRowid),
          rows_read: 0,
          rows_written: result.changes,
        },
      };
    }

    async raw<T = unknown>(): Promise<T[]> {
      const stmt = db.prepare(this.query);
      const rows = stmt.all(...this.bindings) as any[];
      return rows.map((r) => Object.values(r)) as T[];
    }
  }

  const d1Obj: any = {
    prepare(query: string) {
      return new SQLiteD1PreparedStatement(query);
    },
    async batch(statements: any[]) {
      // In SQLite, wrap in transaction
      db.exec('BEGIN TRANSACTION');
      try {
        const results = [];
        for (const s of statements) {
          const res = await s.run();
          results.push(res);
        }
        db.exec('COMMIT');
        return results;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    async exec(query: string) {
      db.exec(query);
      return { count: 1, duration: 0 };
    },
  };

  return d1Obj as D1Database;
}
