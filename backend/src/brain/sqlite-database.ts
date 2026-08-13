import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type BindParams } from "sql.js";
import {
  clearEventLoopLagAfterKnownBlock,
  getRecentEventLoopLagMs,
  getSmoothedEventLoopLagMs,
  waitForEventLoopCapacity,
} from "../runtime/event-loop-cooperative.js";
/** Non-critical force-flush only when smoothed lag is idle — never during sticky saturation. */
const FORCE_FLUSH_IDLE_LAG_MS = Number(process.env.SQLITE_FORCE_FLUSH_IDLE_LAG_MS ?? 100);

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
type SqlJsDatabase = InstanceType<SqlJsStatic["Database"]>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wasmDirectory = path.resolve(__dirname, "../../node_modules/sql.js/dist");

const SQL: SqlJsStatic = await initSqlJs({
  locateFile: (file: string) => path.join(wasmDirectory, file),
});

const PERSIST_DEBOUNCE_MS = Number(process.env.SQLITE_PERSIST_DEBOUNCE_MS ?? 30_000);
/** Floor between successful flushes — prevents write-storm export thrash that blocks auth. */
const MIN_FLUSH_INTERVAL_MS = Number(process.env.SQLITE_MIN_FLUSH_INTERVAL_MS ?? 120_000);
/** Skip sync export while the loop is already saturated (auth/health first). */
const FLUSH_LAG_SKIP_MS = Number(process.env.SQLITE_FLUSH_LAG_SKIP_MS ?? 80);
/** Hard ceiling — never export more often than this even if dirty+idle. */
const MAX_FLUSH_INTERVAL_MS = Number(process.env.SQLITE_MAX_FLUSH_INTERVAL_MS ?? 300_000);
/**
 * Delay the first sql.js export after process start.
 * Large DBs block the event loop for minutes during export — login/health must win first.
 */
const FIRST_FLUSH_DELAY_MS = Number(process.env.SQLITE_FIRST_FLUSH_DELAY_MS ?? 600_000);
const processStartedAtMs = Date.now();

type RunResult = { changes: number; lastInsertRowid: number | bigint };

type PersistStats = {
  pending: boolean;
  flushCount: number;
  lastFlushMs: number | null;
  lastFlushDurationMs: number | null;
  /** True while synchronous db.export() is running (watchdog must not stall-exit). */
  flushInFlight: boolean;
  /** Last flush failure message (ENOSPC, etc.) — null after a successful flush. */
  lastFlushError: string | null;
  lastFlushErrorAt: string | null;
  criticalFlushRequested: number;
  criticalFlushSucceeded: number;
};

let persistStats: PersistStats = {
  pending: false,
  flushCount: 0,
  lastFlushMs: null,
  lastFlushDurationMs: null,
  flushInFlight: false,
  lastFlushError: null,
  lastFlushErrorAt: null,
  criticalFlushRequested: 0,
  criticalFlushSucceeded: 0,
};

/** Optional SharedArrayBuffer slot: main sets 1 during sync export so HA worker ignores stalls. */
let flushGuardView: Int32Array | null = null;

export function getSqlitePersistStats(): Readonly<PersistStats> {
  return persistStats;
}

/** Wire HA watchdog SharedArrayBuffer index 1 as flush-in-flight guard. */
export function bindSqliteFlushGuard(view: Int32Array): void {
  flushGuardView = view;
  Atomics.store(flushGuardView, 1, persistStats.flushInFlight ? 1 : 0);
}

function setFlushInFlight(active: boolean): void {
  persistStats = { ...persistStats, flushInFlight: active };
  if (flushGuardView) {
    Atomics.store(flushGuardView, 1, active ? 1 : 0);
  }
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

export type SqliteOpenRecovery = {
  recovered: boolean;
  quarantinedPath: string | null;
  reason: string | null;
};

let lastOpenRecovery: SqliteOpenRecovery = {
  recovered: false,
  quarantinedPath: null,
  reason: null,
};

export function getLastSqliteOpenRecovery(): Readonly<SqliteOpenRecovery> {
  return lastOpenRecovery;
}

/**
 * Quarantine a corrupted SQLite file (never silent delete).
 * Returns the quarantine path, or null if rename failed.
 */
export function quarantineSqliteFile(filePath: string, reason: string): string | null {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const quarantinePath = `${filePath}.corrupt-${stamp}`;
  try {
    fs.renameSync(filePath, quarantinePath);
    return quarantinePath;
  } catch {
    try {
      fs.copyFileSync(filePath, quarantinePath);
      fs.unlinkSync(filePath);
      return quarantinePath;
    } catch {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "Failed to quarantine corrupted SQLite file",
          filePath,
          reason,
        }),
      );
      return null;
    }
  }
}

function tryOpenExistingDatabase(filePath: string): SqlJsDatabase {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 16) {
    throw new Error("SQLite file too small / truncated");
  }
  const header = buffer.subarray(0, 15).toString("utf8");
  if (header !== "SQLite format 3") {
    throw new Error("SQLite header magic mismatch (not a SQLite database)");
  }
  const db = new SQL.Database(buffer);
  // Fail closed on integrity failure before migrations touch the file.
  const check = db.exec("PRAGMA integrity_check");
  const result =
    check[0]?.values?.[0]?.[0] !== undefined ? String(check[0].values[0][0]) : "unknown";
  if (result !== "ok") {
    db.close();
    throw new Error(`PRAGMA integrity_check failed: ${result}`);
  }
  return db;
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
    lastOpenRecovery = { recovered: false, quarantinedPath: null, reason: null };

    if (!this.inMemory && fs.existsSync(filePath)) {
      try {
        this.db = tryOpenExistingDatabase(filePath);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const quarantinedPath = quarantineSqliteFile(filePath, reason);
        lastOpenRecovery = {
          recovered: true,
          quarantinedPath,
          reason,
        };
        console.error(
          JSON.stringify({
            level: "error",
            msg: "SQLite database corrupted — quarantined and recreating empty database",
            filePath,
            quarantinedPath,
            reason,
            note: "Quarantined file preserved for manual restore; business data was not silently deleted",
          }),
        );
        this.db = new SQL.Database();
      }
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

  /**
   * Critical durability path (commissioning / birth gates).
   * Bypasses the first-flush delay and lag-skip so a Railway restart before the
   * default 10-minute window cannot erase in-memory SQL that was never exported.
   * Still yields briefly so /health/live can run before sync export.
   */
  requestCriticalPersist(): void {
    if (this.inMemory) {
      return;
    }
    persistStats = {
      ...persistStats,
      criticalFlushRequested: persistStats.criticalFlushRequested + 1,
    };
    this.persistDirty = true;
    persistStats.pending = true;
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    if (this.persistInFlight) {
      return;
    }
    // Immediate critical flush — commissioning must hit disk before a restart window.
    void this.flushPersistAsync({ critical: true });
  }

  /** Batches writes — avoids blocking the event loop on every INSERT/UPDATE. */
  private schedulePersist(): void {
    if (this.inMemory) {
      return;
    }

    this.persistDirty = true;
    persistStats.pending = true;

    if (this.persistTimer !== null || this.persistInFlight) {
      return;
    }

    const sinceLastFlush =
      persistStats.lastFlushMs === null ? Number.POSITIVE_INFINITY : Date.now() - persistStats.lastFlushMs;
    const sinceStart = Date.now() - processStartedAtMs;
    const firstFlushWait =
      persistStats.flushCount === 0 && sinceStart < FIRST_FLUSH_DELAY_MS
        ? FIRST_FLUSH_DELAY_MS - sinceStart
        : 0;
    const delay = Math.max(
      PERSIST_DEBOUNCE_MS,
      firstFlushWait,
      sinceLastFlush < MIN_FLUSH_INTERVAL_MS ? MIN_FLUSH_INTERVAL_MS - sinceLastFlush : 0,
    );

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.flushPersistAsync({ critical: false });
    }, delay);

    if (typeof this.persistTimer.unref === "function") {
      this.persistTimer.unref();
    }
  }

  private async flushPersistAsync(opts: { critical: boolean }): Promise<void> {
    if (this.inMemory || !this.persistDirty) {
      return;
    }

    // Coalesce concurrent writers — never tight-loop recurse under write storms.
    if (this.persistInFlight) {
      this.persistDirty = true;
      persistStats.pending = true;
      return;
    }

    const critical = opts.critical;

    this.persistInFlight = (async () => {
      try {
        // Prefer auth/health responsiveness over durability timing under lag (non-critical).
        await waitForEventLoopCapacity(critical ? 1_500 : 5_000);

        const sinceLastFlush =
          persistStats.lastFlushMs === null
            ? Number.POSITIVE_INFINITY
            : Date.now() - persistStats.lastFlushMs;
        // Overdue durability may force a flush ONLY when the loop is idle.
        // Forcing under sticky lag caused a 283s main-thread export and locked out
        // Grand King login (trust triple-proof T1 failure 2026-08-13).
        const overdueByMaxInterval = !critical && sinceLastFlush >= MAX_FLUSH_INTERVAL_MS;
        const idleForForce =
          getSmoothedEventLoopLagMs() < FORCE_FLUSH_IDLE_LAG_MS &&
          getRecentEventLoopLagMs() < FORCE_FLUSH_IDLE_LAG_MS * 2;
        const forceByMaxInterval = overdueByMaxInterval && idleForForce;

        if (!critical && overdueByMaxInterval && !idleForForce) {
          this.persistDirty = true;
          persistStats.pending = true;
          this.schedulePersist();
          return;
        }

        if (
          !critical &&
          !forceByMaxInterval &&
          getRecentEventLoopLagMs() >= FLUSH_LAG_SKIP_MS
        ) {
          this.persistDirty = true;
          persistStats.pending = true;
          this.schedulePersist();
          return;
        }

        // Non-critical export needs ~2× DB bytes briefly; skip when volume cannot absorb it.
        if (!critical) {
          try {
            const { getVolumeDiskStats } = await import(
              "../runtime/volume-disk-reclaim.js"
            );
            const disk = getVolumeDiskStats(this.filePath);
            if (disk.canFlushFullDb === false) {
              this.persistDirty = true;
              persistStats.pending = true;
              this.schedulePersist();
              return;
            }
          } catch {
            // Disk stats unavailable — proceed; critical path still has reclaim helpers.
          }
        }

        // Under residual lag, stretch flushes toward the hard ceiling (non-critical).
        if (
          !critical &&
          !forceByMaxInterval &&
          sinceLastFlush < MAX_FLUSH_INTERVAL_MS &&
          getRecentEventLoopLagMs() >= Math.floor(FLUSH_LAG_SKIP_MS / 2)
        ) {
          this.persistDirty = true;
          persistStats.pending = true;
          this.schedulePersist();
          return;
        }

        if (!this.persistDirty) {
          return;
        }

        this.persistDirty = false;
        const started = performance.now();

        // Yield so auth / health HTTP can run before synchronous sql.js export.
        await new Promise<void>((resolve) => setImmediate(resolve));
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        // Sync export blocks the loop; guard tells HA watchdog not to stall-exit mid-flush.
        setFlushInFlight(true);
        let data: Buffer;
        try {
          data = Buffer.from(this.db.export());
        } finally {
          setFlushInFlight(false);
          // Drop the single giant lag sample from export so auth/admission recover immediately.
          clearEventLoopLagAfterKnownBlock("sql.js-db.export");
        }
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
        const tempPath = `${this.filePath}.tmp-${process.pid}`;
        await fs.promises.writeFile(tempPath, data);
        await fs.promises.rename(tempPath, this.filePath);

        const durationMs = Math.round(performance.now() - started);
        persistStats = {
          pending: this.persistDirty,
          flushCount: persistStats.flushCount + 1,
          lastFlushMs: Date.now(),
          lastFlushDurationMs: durationMs,
          flushInFlight: false,
          lastFlushError: null,
          lastFlushErrorAt: null,
          criticalFlushRequested: persistStats.criticalFlushRequested,
          criticalFlushSucceeded:
            persistStats.criticalFlushSucceeded + (critical ? 1 : 0),
        };
      } catch (error) {
        // Keep dirty so a later schedule retries; do not crash the process.
        this.persistDirty = true;
        persistStats.pending = true;
        persistStats = {
          ...persistStats,
          pending: true,
          lastFlushError: error instanceof Error ? error.message : String(error),
          lastFlushErrorAt: new Date().toISOString(),
        };
        setFlushInFlight(false);
        throw error;
      } finally {
        this.persistInFlight = null;
        persistStats.pending = this.persistDirty;
        if (this.persistDirty) {
          if (critical) {
            // Avoid tight ENOSPC spin — backoff before critical retry.
            if (this.persistTimer !== null) {
              clearTimeout(this.persistTimer);
            }
            this.persistTimer = setTimeout(() => {
              this.persistTimer = null;
              void this.flushPersistAsync({ critical: true });
            }, 5_000);
            if (typeof this.persistTimer.unref === "function") {
              this.persistTimer.unref();
            }
          } else {
            this.schedulePersist();
          }
        }
      }
    })();

    try {
      await this.persistInFlight;
    } catch {
      // Logged by caller paths via unhandled rejection avoidance — schedulePersist retries.
    }
  }

  /** Synchronous flush for process shutdown — ensures durability on close. */
  private flushPersistSync(): void {
    if (this.inMemory) {
      return;
    }

    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    const started = performance.now();
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    setFlushInFlight(true);
    let data: Uint8Array;
    try {
      data = this.db.export();
    } finally {
      setFlushInFlight(false);
      clearEventLoopLagAfterKnownBlock("sql.js-db.export-sync-shutdown");
    }
    const tempPath = `${this.filePath}.tmp-shutdown`;
    fs.writeFileSync(tempPath, Buffer.from(data));
    fs.renameSync(tempPath, this.filePath);
    this.persistDirty = false;
    persistStats = {
      pending: false,
      flushCount: persistStats.flushCount + 1,
      lastFlushMs: Date.now(),
      lastFlushDurationMs: Math.round(performance.now() - started),
      flushInFlight: false,
      lastFlushError: null,
      lastFlushErrorAt: null,
      criticalFlushRequested: persistStats.criticalFlushRequested,
      criticalFlushSucceeded: persistStats.criticalFlushSucceeded,
    };
  }
}

function isInMemoryDatabasePath(filePath: string): boolean {
  return filePath.startsWith(":memory:");
}

export { isInMemoryDatabasePath };

export { SQL as sqlJsEngine };
