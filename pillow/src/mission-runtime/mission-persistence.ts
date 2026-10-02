import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { AUDIT_STATUSES, MISSION_LIFECYCLE_STATES, MISSION_TYPES } from "./paths.js";
import type { Checkpoint, ExecutionTimelineEntry, LifecycleTransition, MissionInstance, MissionRuntimeReport, RecoveryRecord, RetryRecord } from "./types.js";

export type MissionStoreSnapshot = {
  missions: MissionInstance[];
  transitions: LifecycleTransition[];
  checkpoints: Checkpoint[];
  retries: RetryRecord[];
  recoveries: RecoveryRecord[];
  timeline: ExecutionTimelineEntry[];
  reports: MissionRuntimeReport[];
  auditTrail: string[];
};

const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024;
const fingerprint = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

export function resolveMissionPersistenceFile(databasePath: string | undefined, production: boolean): string | undefined {
  if (!databasePath || databasePath.startsWith(":memory:")) {
    if (production) throw new Error("Production mission runtime requires persistent DATABASE_PATH");
    return undefined;
  }
  let resolved = path.resolve(databasePath);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, "empireai-brain.db");
  return `${resolved}.missions.sqlite`;
}

export type MissionPersistenceScope = { ownerEmail: string; workspaceId: "ws_empire_1" };

/** Hosted mission runtime is one canonical organization, shared by its configured founder/admin. */
export function canonicalMissionScope(founderEmail = "founder@empireai.com"): MissionPersistenceScope {
  const ownerEmail = founderEmail.trim().toLowerCase();
  if (!ownerEmail || !ownerEmail.includes("@")) throw new Error("Mission owner identity is invalid");
  return { ownerEmail, workspaceId: "ws_empire_1" };
}

type RecordValue = Record<string, unknown>;
type Check = (value: unknown) => boolean;
const record = (value: unknown): value is RecordValue => value !== null && typeof value === "object" && !Array.isArray(value);
const string: Check = value => typeof value === "string";
const nullableString: Check = value => value === null || string(value);
const boolean: Check = value => typeof value === "boolean";
const finite: Check = value => typeof value === "number" && Number.isFinite(value);
const counter: Check = value => finite(value) && Number.isInteger(value) && (value as number) >= 0;
const percent: Check = value => finite(value) && (value as number) >= 0 && (value as number) <= 100;
const member = (values: readonly string[]): Check => value => typeof value === "string" && values.includes(value);
const array = (check: Check): Check => value => Array.isArray(value) && value.every(check);
const fields = (schema: Record<string, Check>): Check => value => record(value) && Object.entries(schema).every(([key, check]) => check(value[key]));
const jsonValue = (value: unknown, depth = 0): boolean => {
  if (depth > 50) return false;
  if (value === null || string(value) || boolean(value) || finite(value)) return true;
  if (Array.isArray(value)) return value.every(item => jsonValue(item, depth + 1));
  return record(value) && Object.values(value).every(item => jsonValue(item, depth + 1));
};
const lifecycle = member(MISSION_LIFECYCLE_STATES);
const transition = fields({ transitionId: string, missionId: string, fromState: lifecycle, toState: lifecycle,
  timestamp: string, reason: string, fabricated: value => value === false, metadataVersion: string });
const checkpoint = fields({ checkpointId: string, missionId: string, label: string, state: lifecycle,
  timestamp: string, payload: value => record(value) && jsonValue(value), metadataVersion: string });
const retry = fields({ retryId: string, missionId: string, attempt: counter, timestamp: string,
  fromState: lifecycle, toState: lifecycle, reason: string, metadataVersion: string });
const recovery = fields({ recoveryId: string, missionId: string, timestamp: string, fromState: lifecycle,
  toState: lifecycle, checkpointId: nullableString, reason: string, metadataVersion: string });
const timeline = fields({ entryId: string, timestamp: string, label: string, state: string, notes: array(string) });
const mission = fields({ missionId: value => string(value) && (value as string).length > 0,
  missionType: member(MISSION_TYPES), missionName: string, parentMissionId: nullableString,
  dependencyMissionIds: array(string), mode: member(["sequential", "parallel", "standalone"]), currentStatus: lifecycle,
  createdAt: string, updatedAt: string, workers: array(string), highRisk: boolean, pillowConfirmed: boolean,
  grandKingApproved: boolean, retryCount: counter, progress: percent, traceabilityRefs: array(string),
  metadataVersion: string, structuralSignalOnly: value => value === true, fabricated: value => value === false });
const reportFlags = ["neverReplaceWorkerLogic", "neverReplaceOrchestrationLogic", "neverExecuteUnauthorisedMissions",
  "neverFabricateMissionState", "neverBypassPillowGovernance", "neverBypassGrandKingApproval", "neverOverrideApprovedArchitecture",
  "neverOverridePillow", "neverOverrideGrandKing", "neverImplementQ1004OrLater", "preserveCompleteTraceability",
  "preserveMissionHistory", "preserveAuditHistory", "neverExposeCredentials", "structuralSignalOnly", "maskSensitiveValues"];
const report = fields({ reportId: string, timestamp: string, runtimeVersion: string, missionId: string,
  missionType: member(MISSION_TYPES), currentStatus: lifecycle, executionTimeline: array(timeline), progress: percent,
  activeWorkers: array(string), dependencies: array(fields({ missionId: string,
    mode: member(["parent", "sequential", "parallel"]), satisfied: boolean })), checkpoints: array(checkpoint),
  retryHistory: array(retry), recoveryHistory: array(recovery), failureSummary: nullableString,
  supportingEvidence: array(string), auditStatus: member(AUDIT_STATUSES), outstandingIssues: array(string),
  confidenceScore: percent, metadataVersion: string, reportVersion: string, workerId: string, consumableByQ1004: boolean,
  ...Object.fromEntries(reportFlags.map(key => [key, (value: unknown) => value === true])) });

function validateSnapshot(value: unknown): asserts value is MissionStoreSnapshot {
  if (!fields({ missions: array(mission), transitions: array(transition), checkpoints: array(checkpoint),
    retries: array(retry), recoveries: array(recovery), timeline: array(timeline), reports: array(report),
    auditTrail: array(string) })(value)) throw new Error("Mission snapshot contains invalid state or history");
  const state = value as MissionStoreSnapshot;
  const ids = new Set(state.missions.map(item => item.missionId));
  if (ids.size !== state.missions.length) throw new Error("Mission snapshot contains duplicate mission identifiers");
  for (const item of [...state.transitions, ...state.checkpoints, ...state.retries, ...state.recoveries, ...state.reports]) {
    if (!ids.has(item.missionId)) throw new Error("Mission history references an unknown mission");
  }
}

const APPLICATION_ID = 0x454d5352; // EMSR: never adopt another SQLite database.
const MAX_DATABASE_BYTES = 64 * 1024 * 1024;
type SnapshotRow = { revision: number; envelope: string; legacy_sha256: string | null };

function readBoundedFile(filename: string, maximum: number): Buffer | null {
  let initial: fs.Stats;
  try { initial = fs.lstatSync(filename); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  if (!initial.isFile() || initial.size > maximum) throw new Error("Mission snapshot is not a bounded regular file");
  let fd: number;
  try { fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > maximum || stat.ino !== initial.ino || stat.dev !== initial.dev) throw new Error("Mission snapshot is not a bounded unchanged regular file");
    const bytes = fs.readFileSync(fd);
    if (bytes.length > maximum) throw new Error("Mission snapshot capacity exceeded; history was not discarded");
    return bytes;
  } finally { fs.closeSync(fd); }
}

function decodeEnvelope(raw: string, version: number, scope: MissionPersistenceScope | null): MissionStoreSnapshot {
  if (Buffer.byteLength(raw) > MAX_SNAPSHOT_BYTES) throw new Error("Mission snapshot capacity exceeded; history was not discarded");
  const envelope = JSON.parse(raw) as { version?: unknown; scope?: unknown; state?: unknown };
  if (envelope.version !== version) throw new Error("Mission snapshot version is unsupported");
  if (JSON.stringify(envelope.scope) !== JSON.stringify(scope)) {
    throw new Error("Mission snapshot organization identity does not match this host");
  }
  validateSnapshot(envelope.state);
  return structuredClone(envelope.state);
}

/** OS-backed SQLite transactions release locks after a killed writer; no stale .lock guessing. */
export class MissionSnapshotFile {
  private expectedRevision: number | null = null;
  private expectedFingerprint: string | null = null;
  private readonly legacyFilename: string;

  constructor(private readonly filename: string, private readonly scope: MissionPersistenceScope | null = null) {
    if (!filename.endsWith(".missions.sqlite")) throw new Error("Mission persistence requires a dedicated .missions.sqlite file; legacy JSON needs explicit migration");
    this.legacyFilename = filename.replace(/\.sqlite$/, ".json");
    if (scope && (scope.workspaceId !== "ws_empire_1" || scope.ownerEmail !== canonicalMissionScope(scope.ownerEmail).ownerEmail)) {
      throw new Error("Mission persistence scope is invalid");
    }
  }

  private withDatabase<T>(create: boolean, operation: (db: DatabaseSync) => T): T | null {
    const directory = path.dirname(this.filename);
    const exists = fs.existsSync(this.filename);
    if (!exists && !create) return null;
    if (!exists) {
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      try { fs.closeSync(fs.openSync(this.filename, "wx", 0o600)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    }
    const stat = fs.lstatSync(this.filename);
    if (!stat.isFile() || stat.size > MAX_DATABASE_BYTES) throw new Error("Mission database is not a bounded regular file");
    const db = new DatabaseSync(this.filename, { timeout: 0, allowExtension: false });
    try {
      // DELETE + EXTRA syncs the rollback journal, database and journal-removal directory.
      // No custom lock file or WAL checkpoint is needed for crash recovery.
      db.exec("PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0; PRAGMA synchronous=EXTRA;");
      if (db.prepare("PRAGMA synchronous").get()?.synchronous !== 3) throw new Error("Mission database EXTRA durability is unavailable");
      const integrity = db.prepare("PRAGMA quick_check").all();
      if (integrity.length !== 1 || integrity[0]?.quick_check !== "ok") throw new Error("Mission database integrity check failed; original bytes preserved");
      const appId = db.prepare("PRAGMA application_id").get()?.application_id;
      const version = db.prepare("PRAGMA user_version").get()?.user_version;
      const tables = db.prepare("SELECT name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all();
      const uninitialized = appId === 0 && version === 0 && tables.length === 0;
      if (!uninitialized && (appId !== APPLICATION_ID || version !== 3 || tables.length !== 1 || tables[0]?.name !== "mission_snapshot")) {
        throw new Error("Mission database schema is unsupported; original history preserved");
      }
      const journalMode = db.prepare("PRAGMA journal_mode").get()?.journal_mode;
      if (journalMode !== "delete") throw new Error("Mission database requires rollback journal mode; no implicit format conversion");
      if (db.prepare("PRAGMA page_size").get()?.page_size !== 4096) throw new Error("Mission database page size is unsupported");
      db.exec("PRAGMA max_page_count=16384;");
      return operation(db);
    } finally { db.close(); }
  }

  private readRow(db: DatabaseSync): SnapshotRow | null {
    const table = db.prepare("SELECT name FROM sqlite_schema WHERE name='mission_snapshot'").get();
    if (!table) return null;
    const rows = db.prepare("SELECT id,revision,envelope,legacy_sha256 FROM mission_snapshot").all();
    if (rows.length > 1) throw new Error("Mission snapshot contains multiple authoritative records");
    if (!rows.length) throw new Error("Mission snapshot authoritative record is missing; history was not reset");
    const row = rows[0]!;
    if (row.id !== 1 || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.envelope !== "string" ||
      !(row.legacy_sha256 === null || (typeof row.legacy_sha256 === "string" && /^[a-f0-9]{64}$/.test(row.legacy_sha256)))) {
      throw new Error("Mission snapshot contains invalid revision or migration history");
    }
    decodeEnvelope(row.envelope, 3, this.scope);
    return row as SnapshotRow;
  }

  private assertLegacyLineage(row: SnapshotRow | null, migratingDigest?: string): void {
    const legacy = readBoundedFile(this.legacyFilename, MAX_SNAPSHOT_BYTES);
    if (!legacy) {
      if (row?.legacy_sha256 || migratingDigest) throw new Error("Preserved legacy mission history is missing");
      return;
    }
    if (fs.existsSync(`${this.legacyFilename}.lock`)) throw new Error("Legacy mission writer lock requires engineering reconciliation before migration or continuation");
    const actual = fingerprint(legacy);
    if (actual !== (migratingDigest ?? row?.legacy_sha256)) {
      throw new Error("Legacy mission snapshot requires explicit migration or has changed; history was not discarded");
    }
  }

  load(): MissionStoreSnapshot | null {
    const recovered = this.withDatabase(false, db => {
      const row = this.readRow(db);
      this.assertLegacyLineage(row);
      if (!row) return null;
      this.expectedRevision = row.revision;
      this.expectedFingerprint = fingerprint(Buffer.from(row.envelope));
      return decodeEnvelope(row.envelope, 3, this.scope);
    });
    if (!recovered) this.assertLegacyLineage(null);
    return recovered;
  }

  save(state: MissionStoreSnapshot): void { this.saveSnapshot(state); }

  private saveSnapshot(state: MissionStoreSnapshot, migratingDigest?: string): void {
    validateSnapshot(state);
    const envelope = JSON.stringify({ version: 3, scope: this.scope, state });
    if (Buffer.byteLength(envelope) > MAX_SNAPSHOT_BYTES) throw new Error("Mission snapshot capacity exceeded; history was not discarded");
    this.withDatabase(true, db => {
      db.exec("BEGIN IMMEDIATE");
      let committed = false;
      try {
        const current = this.readRow(db);
        this.assertLegacyLineage(current, migratingDigest);
        if ((current?.revision ?? null) !== this.expectedRevision ||
          (current ? fingerprint(Buffer.from(current.envelope)) : null) !== this.expectedFingerprint) {
          throw new Error("Mission snapshot changed in another writer; reload before retrying");
        }
        if (migratingDigest && current) throw new Error("Migration refuses to overwrite existing mission history");
        const revision = (current?.revision ?? 0) + 1;
        if (!Number.isSafeInteger(revision)) throw new Error("Mission snapshot revision capacity exceeded");
        db.exec(`CREATE TABLE IF NOT EXISTS mission_snapshot (
          id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL CHECK(revision>0),
          envelope TEXT NOT NULL CHECK(length(CAST(envelope AS BLOB))<=${MAX_SNAPSHOT_BYTES}),
          legacy_sha256 TEXT
        ) STRICT;
        PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=3;`);
        db.prepare("INSERT INTO mission_snapshot(id,revision,envelope,legacy_sha256) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,envelope=excluded.envelope,legacy_sha256=excluded.legacy_sha256")
          .run(revision, envelope, migratingDigest ?? current?.legacy_sha256 ?? null);
        // Re-read the migration source before committing; never alter/delete it.
        this.assertLegacyLineage(current, migratingDigest);
        db.exec("COMMIT");
        committed = true;
        if (process.platform !== "win32") {
          const fd = fs.openSync(path.dirname(this.filename), "r");
          try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
        }
        this.expectedRevision = revision;
        this.expectedFingerprint = fingerprint(Buffer.from(envelope));
      } finally {
        if (!committed && db.isTransaction) db.exec("ROLLBACK");
      }
    });
  }

  /** Explicit, offline engineering migration. Never silently replace or remove legacy JSON. */
  migrateLegacy(): { source: string; sha256: string; destination: string } {
    const legacy = readBoundedFile(this.legacyFilename, MAX_SNAPSHOT_BYTES);
    if (!legacy) throw new Error("Legacy mission snapshot is missing");
    const state = decodeEnvelope(legacy.toString("utf8"), 2, this.scope);
    const digest = fingerprint(legacy);
    this.saveSnapshot(state, digest);
    return { source: this.legacyFilename, sha256: digest, destination: this.filename };
  }
}

export function migrateLegacyMissionSnapshot(filename: string, scope: MissionPersistenceScope | null = null) {
  return new MissionSnapshotFile(filename, scope).migrateLegacy();
}
