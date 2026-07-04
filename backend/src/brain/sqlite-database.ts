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

const PERSIST_DEBOUNCE_MS = Number(process.env.SQLITE_PERSIST_DEBOUNCE_MS ?? 250);

type RunResult = { changes: number; lastInsertRowid: number | bigint };

type PersistStats = {
  pending: boolean;
  flushCount: number;
  lastFlushMs: number | null;
  lastFlushDurationMs: number | null;
};

let persistStats: PersistStats = {
  pending: false,
  flushCount: 0,
  lastFlushMs: null,
  lastFlushDurationMs: null,
};

export function getSqlitePersistStats(): Readonly<PersistStats> {
  return persistStats;
}

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
  private readonly inMemory: boolean;
  private persistDirty = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private persistInFlight: Promise<void> | null = null;

  constructor(private readonly filePath: string) {
    this.inMemory = isInMemoryDatabasePath(filePath);
    if (!this.inMemory && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
  }

  exec(sql: string): void {
    this.db.exec(sql);
    this.schedulePersist();
  }

  pragma(name: string, options?: { simple?: boolean }): unknown {
    if (name.includes("=")) {
      this.db.run(`PRAGMA ${name}`);
      this.schedulePersist();
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
        this.schedulePersist();
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
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.flushPersistSync();
    this.db.close();
  }

  /** Batches writes — avoids blocking the event loop on every INSERT/UPDATE. */
  private schedulePersist(): void {
    if (this.inMemory) {
      return;
    }

    this.persistDirty = true;
    persistStats.pending = true;

    if (this.persistTimer !== null) {
      return;
    }

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.flushPersistAsync();
    }, PERSIST_DEBOUNCE_MS);

    if (typeof this.persistTimer.unref === "function") {
      this.persistTimer.unref();
    }
  }

  private async flushPersistAsync(): Promise<void> {
    if (this.inMemory || !this.persistDirty) {
      return;
    }

    if (this.persistInFlight) {
      await this.persistInFlight;
      if (this.persistDirty) {
        return this.flushPersistAsync();
      }
      return;
    }

    this.persistDirty = false;
    const started = performance.now();

    this.persistInFlight = (async () => {
      try {
        const data = Buffer.from(this.db.export());
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.promises.writeFile(this.filePath, data);
        persistStats = {
          pending: this.persistDirty,
          flushCount: persistStats.flushCount + 1,
          lastFlushMs: Date.now(),
          lastFlushDurationMs: Math.round(performance.now() - started),
        };
      } finally {
        this.persistInFlight = null;
        persistStats.pending = this.persistDirty;
      }
    })();

    await this.persistInFlight;

    if (this.persistDirty) {
      return this.flushPersistAsync();
    }
  }

  /** Synchronous flush for process shutdown — ensures durability on close. */
  private flushPersistSync(): void {
    if (this.inMemory) {
      return;
    }

    const started = performance.now();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
    this.persistDirty = false;
    persistStats = {
      pending: false,
      flushCount: persistStats.flushCount + 1,
      lastFlushMs: Date.now(),
      lastFlushDurationMs: Math.round(performance.now() - started),
    };
  }
}

function isInMemoryDatabasePath(filePath: string): boolean {
  return filePath.startsWith(":memory:");
}

export { isInMemoryDatabasePath };

export { SQL as sqlJsEngine };
