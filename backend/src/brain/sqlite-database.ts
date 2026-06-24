import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type BindParams } from "sql.js";

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
type SqlJsDatabase = InstanceType<SqlJsStatic["Database"]>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wasmDirectory = path.resolve(__dirname, "../../node_modules/sql.js/dist");

const SQL: SqlJsStatic = await initSqlJs({
  locateFile: (file: string) => path.join(wasmDirectory, file),
});

type RunResult = { changes: number; lastInsertRowid: number | bigint };
function normalizeParams(params: Record<string, unknown>): BindParams {
  const normalized: BindParams = {};
  for (const [key, value] of Object.entries(params)) {
    const bindKey = key.startsWith("@") || key.startsWith(":") || key.startsWith("$") ? key : `@${key}`;
    if (value === undefined || value === null) {
      normalized[bindKey] = null;
    } else if (typeof value === "number" || typeof value === "string" || value instanceof Uint8Array) {
      normalized[bindKey] = value;
    } else if (typeof value === "bigint") {
      normalized[bindKey] = Number(value);
    } else if (typeof value === "boolean") {
      normalized[bindKey] = value ? 1 : 0;
    } else {
      normalized[bindKey] = JSON.stringify(value);
    }
  }
  return normalized;
}

function rowToObject(columns: string[], values: unknown[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  columns.forEach((column, index) => {
    row[column] = values[index];
  });
  return row;
}

/** Pure-JS SQLite (sql.js) with a better-sqlite3-compatible surface for EmpireAI. */
export class EmpireDatabase {
  private readonly db: SqlJsDatabase;

  constructor(private readonly filePath: string) {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
  }

  exec(sql: string): void {
    this.db.exec(sql);
    this.persist();
  }

  pragma(name: string, options?: { simple?: boolean }): unknown {
    if (name.includes("=")) {
      this.db.run(`PRAGMA ${name}`);
      this.persist();
      return undefined;
    }

    const stmt = this.db.prepare(`PRAGMA ${name}`);
    const hasRow = stmt.step();
    const value = hasRow ? stmt.get()[0] : undefined;
    stmt.free();

    if (options?.simple) return value;
    return value;
  }

  prepare(sql: string) {
    return {
      run: (params?: Record<string, unknown>): RunResult => {
        const stmt = this.db.prepare(sql);
        if (params) stmt.bind(normalizeParams(params));
        stmt.step();
        stmt.free();
        const changes = this.db.getRowsModified();
        this.persist();
        return { changes, lastInsertRowid: 0 };
      },
      get: (params?: Record<string, unknown>): Record<string, unknown> | undefined => {
        const stmt = this.db.prepare(sql);
        if (params) stmt.bind(normalizeParams(params));
        const hasRow = stmt.step();
        if (!hasRow) {
          stmt.free();
          return undefined;
        }
        const row = rowToObject(stmt.getColumnNames(), stmt.get());
        stmt.free();
        return row;
      },
      all: (params?: Record<string, unknown>): Record<string, unknown>[] => {
        const stmt = this.db.prepare(sql);
        if (params) stmt.bind(normalizeParams(params));
        const rows: Record<string, unknown>[] = [];
        while (stmt.step()) {
          rows.push(rowToObject(stmt.getColumnNames(), stmt.get()));
        }
        stmt.free();
        return rows;
      },
    };
  }

  close(): void {
    this.persist();
    this.db.close();
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }
}

export { SQL as sqlJsEngine };
