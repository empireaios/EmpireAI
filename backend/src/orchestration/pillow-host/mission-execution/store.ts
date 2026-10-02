import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ExecutionConflict, jobIdFor, requestIdentity, sha256, validateOutput, validateRequest, validateScope,
  type AuthorityOutput, type ExecutionJob, type ExecutionReceipt, type ExecutionRequest, type ExecutionScope } from "./contract.js";

const APP_ID = 0x454d4558;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_JOBS = 1000;
const MAX_ATTEMPTS = 3;
const schema = `CREATE TABLE execution_meta(id INTEGER PRIMARY KEY CHECK(id=1),scope TEXT NOT NULL) STRICT;
CREATE TABLE execution_jobs(job_id TEXT PRIMARY KEY, document TEXT NOT NULL CHECK(length(CAST(document AS BLOB))<=16384)) STRICT;
CREATE TABLE execution_events(seq INTEGER PRIMARY KEY,job_id TEXT NOT NULL,event TEXT NOT NULL,at TEXT NOT NULL) STRICT;
PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;`;

/** Dedicated bounded native SQLite outbox; never shares/adopts the mission snapshot or SQL.js database. */
export class MissionExecutionStore {
  constructor(readonly filename: string, readonly scope: ExecutionScope) {
    validateScope(scope);
    if (!path.isAbsolute(filename) || !filename.endsWith(".mission-execution.sqlite")) throw new Error("Dedicated absolute mission execution database required");
  }
  private database<T>(write: boolean, fn: (db: DatabaseSync) => T): T {
    fs.mkdirSync(path.dirname(this.filename), { recursive: true, mode: 0o700 });
    try { fs.closeSync(fs.openSync(this.filename, "wx", 0o600)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    const stat = fs.lstatSync(this.filename);
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error("Execution database is not a bounded regular file");
    const db = new DatabaseSync(this.filename, { timeout: 0, allowExtension: false });
    let transaction = false;
    try {
      db.exec("PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0; PRAGMA synchronous=EXTRA;");
      if (db.prepare("PRAGMA synchronous").get()?.synchronous !== 3 || db.prepare("PRAGMA journal_mode").get()?.journal_mode !== "delete") throw new Error("Execution database durability mode is unsupported");
      const integrity = db.prepare("PRAGMA quick_check").all();
      if (integrity.length !== 1 || integrity[0]?.quick_check !== "ok") throw new Error("Execution database integrity failed; preserve original history");
      const tables = db.prepare("SELECT name,type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
      const app = db.prepare("PRAGMA application_id").get()?.application_id;
      const version = db.prepare("PRAGMA user_version").get()?.user_version;
      const fresh = tables.length === 0 && app === 0 && version === 0;
      if (!fresh && (app !== APP_ID || version !== 1 || tables.map(t => `${t.type}:${t.name}`).join() !== "table:execution_events,table:execution_jobs,table:execution_meta")) throw new Error("Execution database schema is unsupported");
      if (db.prepare("PRAGMA page_size").get()?.page_size !== 4096) throw new Error("Execution database page size is unsupported");
      db.exec("PRAGMA max_page_count=4096;");
      // Even reads initialize only an empty, dedicated file. Never overwrite existing scope/schema.
      if (fresh || write) { db.exec("BEGIN IMMEDIATE"); transaction = true; }
      if (fresh) { db.exec(schema); db.prepare("INSERT INTO execution_meta VALUES(1,?)").run(JSON.stringify(this.scope)); }
      const meta = db.prepare("SELECT id,scope FROM execution_meta").all();
      if (meta.length !== 1 || meta[0]?.id !== 1 || meta[0]?.scope !== JSON.stringify(this.scope)) throw new Error("Execution scope does not match stored owner");
      const result = fn(db);
      if (transaction) { db.exec("COMMIT"); transaction = false; this.syncDirectory(); }
      return result;
    } finally { if (transaction && db.isTransaction) db.exec("ROLLBACK"); db.close(); }
  }
  private syncDirectory(): void {
    if (process.platform === "win32") return;
    const fd = fs.openSync(path.dirname(this.filename), "r"); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  }
  private parse(raw: unknown): ExecutionJob {
    if (typeof raw !== "string" || Buffer.byteLength(raw) > 16384) throw new Error("Execution job is malformed");
    const j = JSON.parse(raw) as ExecutionJob;
    validateRequest(j);
    if (JSON.stringify(j.scope) !== JSON.stringify(this.scope) || j.jobId !== jobIdFor(j) ||
      !["queued", "leased", "completed", "unknown"].includes(j.status) || !Number.isSafeInteger(j.attempts) || j.attempts < 0 || j.attempts > MAX_ATTEMPTS ||
      !Number.isFinite(Date.parse(j.createdAt)) || typeof j.reconciled !== "boolean" ||
      !(j.lastError === null || (typeof j.lastError === "string" && j.lastError.length <= 100)) ||
      (j.status === "leased" ? (typeof j.leaseToken !== "string" || !Number.isSafeInteger(j.leaseUntil)) : (j.leaseToken !== null || j.leaseUntil !== null))) throw new Error("Execution job state is invalid");
    if (j.status === "completed") {
      const r = j.receipt;
      if (!r || requestIdentity(r) !== requestIdentity(j) || r.jobId !== j.jobId || r.status !== "completed" || r.certificationCredit !== false ||
        !Number.isFinite(Date.parse(r.completedAt)) || r.receiptId !== `maer_${sha256(`${j.jobId}:${r.outputHash}`)}` ||
        r.outputHash !== sha256(JSON.stringify(r.output))) throw new Error("Execution receipt binding is invalid");
      validateOutput(r.output);
    } else if (j.receipt !== null || j.reconciled) throw new Error("Unfinished job cannot carry a completed receipt");
    return j;
  }
  private getRow(db: DatabaseSync, jobId: string): ExecutionJob | null {
    const row = db.prepare("SELECT job_id,document FROM execution_jobs WHERE job_id=?").get(jobId);
    if (!row) return null;
    const job = this.parse(row.document);
    if (row.job_id !== job.jobId || job.jobId !== jobId) throw new Error("Execution row identity is corrupt");
    return job;
  }
  private save(db: DatabaseSync, job: ExecutionJob, event: string, now: number): void {
    this.parse(JSON.stringify(job));
    if ((db.prepare("SELECT COUNT(*) AS n FROM execution_events").get()?.n as number) >= 12000) throw new Error("Execution event capacity exceeded; history retained");
    db.prepare("INSERT INTO execution_jobs(job_id,document) VALUES(?,?) ON CONFLICT(job_id) DO UPDATE SET document=excluded.document").run(job.jobId, JSON.stringify(job));
    db.prepare("INSERT INTO execution_events(job_id,event,at) VALUES(?,?,?)").run(job.jobId, event, new Date(now).toISOString());
  }
  enqueue(request: ExecutionRequest, now = Date.now(), canAdmit?: () => boolean): { job: ExecutionJob; created: boolean } {
    validateRequest(request);
    if (JSON.stringify(request.scope) !== JSON.stringify(this.scope)) throw new ExecutionConflict("Execution scope mismatch");
    return this.database(true, db => {
      const jobId = jobIdFor(request); const existing = this.getRow(db, jobId);
      if (existing) {
        if (requestIdentity(existing) !== requestIdentity(request)) throw new ExecutionConflict("Mission execution content changed; original job retained");
        return { job: existing, created: false };
      }
      if (canAdmit && !canAdmit()) throw new ExecutionConflict("Existing waiting/running readonly mission and its recorded dispatch are required");
      if ((db.prepare("SELECT COUNT(*) AS n FROM execution_jobs").get()?.n as number) >= MAX_JOBS) throw new Error("Execution job capacity exceeded; history retained");
      const job: ExecutionJob = { ...structuredClone(request), jobId, status: "queued", attempts: 0,
        createdAt: new Date(now).toISOString(), leaseToken: null, leaseUntil: null, receipt: null, reconciled: false, lastError: null };
      this.save(db, job, "durably_admitted", now); return { job, created: true };
    });
  }
  get(jobId: string): ExecutionJob | null { return this.database(false, db => this.getRow(db, jobId)); }
  claim(buildSha: string, now = Date.now(), leaseMs = 5000): ExecutionJob | null {
    if (!/^[a-f0-9]{40}$/.test(buildSha) || !Number.isSafeInteger(leaseMs) || leaseMs < 100 || leaseMs > 30000) throw new Error("Invalid execution claim bounds");
    return this.database(true, db => {
      const rows = db.prepare("SELECT job_id,document FROM execution_jobs ORDER BY rowid").all();
      for (const row of rows) {
        const job = this.parse(row.document);
        if (row.job_id !== job.jobId) throw new Error("Execution row identity is corrupt");
        if (job.status === "completed" || job.status === "unknown" || (job.status === "leased" && job.leaseUntil! > now)) continue;
        if (job.buildSha !== buildSha || job.attempts >= MAX_ATTEMPTS) {
          job.status = "unknown"; job.leaseToken = null; job.leaseUntil = null;
          job.lastError = job.buildSha !== buildSha ? "BUILD_CHANGED_REVIEW_REQUIRED" : "READ_ATTEMPTS_EXHAUSTED";
          this.save(db, job, job.lastError, now); continue;
        }
        job.status = "leased"; job.attempts++; job.leaseToken = randomUUID(); job.leaseUntil = now + leaseMs;
        job.lastError = null; this.save(db, job, "readonly_claimed", now); return job;
      }
      return null;
    });
  }
  complete(claim: ExecutionJob, output: AuthorityOutput, now = Date.now()): ExecutionReceipt {
    validateOutput(output);
    return this.database(true, db => {
      const job = this.getRow(db, claim.jobId);
      if (!job || job.status !== "leased" || !claim.leaseToken || job.leaseToken !== claim.leaseToken || job.leaseUntil! < now || requestIdentity(job) !== requestIdentity(claim)) throw new ExecutionConflict("Execution lease lost; stale output not accepted");
      const outputHash = sha256(JSON.stringify(output));
      const receipt: ExecutionReceipt = { missionId: job.missionId, dispatchId: job.dispatchId, workerId: job.workerId,
        action: job.action, scope: job.scope, buildSha: job.buildSha, inputHash: job.inputHash,
        receiptId: `maer_${sha256(`${job.jobId}:${outputHash}`)}`, jobId: job.jobId, status: "completed",
        completedAt: new Date(now).toISOString(), outputHash, output: structuredClone(output), certificationCredit: false };
      job.status = "completed"; job.leaseToken = null; job.leaseUntil = null; job.receipt = receipt;
      this.save(db, job, "readonly_output_and_receipt_committed", now); return receipt;
    });
  }
  markUnknown(claim: ExecutionJob, now = Date.now()): void {
    this.database(true, db => { const job = this.getRow(db, claim.jobId);
      if (!job || job.status !== "leased" || job.leaseToken !== claim.leaseToken) throw new ExecutionConflict("Execution lease changed");
      job.status = "unknown"; job.leaseToken = null; job.leaseUntil = null; job.lastError = "AUTHORITY_INSPECTION_FAILED";
      this.save(db, job, "inspection_failed_no_completion", now);
    });
  }
  pendingReceipts(): ExecutionReceipt[] {
    return this.database(false, db => db.prepare("SELECT job_id,document FROM execution_jobs ORDER BY rowid").all()
      .map(row => { const job = this.parse(row.document);
        if (row.job_id !== job.jobId) throw new Error("Execution row identity is corrupt"); return job; }).filter(j => j.status === "completed" && !j.reconciled).map(j => j.receipt!));
  }
  markReconciled(receipt: ExecutionReceipt): void {
    this.database(true, db => { const job = this.getRow(db, receipt.jobId);
      if (!job?.receipt || JSON.stringify(job.receipt) !== JSON.stringify(receipt)) throw new ExecutionConflict("Reconciliation receipt mismatch");
      if (!job.reconciled) { job.reconciled = true; this.save(db, job, "mission_receipt_reconciled", Date.now()); }
    });
  }
}
