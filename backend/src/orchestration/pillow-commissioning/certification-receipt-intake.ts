import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env.js";
import { isInMemoryDatabasePath } from "../../brain/sqlite-database.js";
import { getDatabase } from "../../brain/database.js";

const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const certificationReceiptSchema = z.object({
  schemaVersion: z.literal(1),
  receiptId: identifier,
  syllabus: z.object({ name: z.string().min(1).max(128), sha256: hash }).strict(),
  requirementId: identifier,
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  deploymentId: identifier,
  evaluatorId: identifier,
  outcome: z.enum(["PASS", "FAIL", "BLOCKED"]),
  observedAt: z.string().datetime(),
  artifacts: z.array(z.object({ artifactId: identifier, sha256: hash }).strict()).min(1).max(32),
}).strict().superRefine((r, ctx) => {
  if (new Set(r.artifacts.map(a => a.artifactId)).size !== r.artifacts.length)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate artifact identity" });
});
export class ReceiptConflict extends Error {}
const MAX_RECEIPTS = 10000;
const initialized = new WeakSet<ReturnType<typeof getDatabase>>();
const pending = new WeakMap<ReturnType<typeof getDatabase>, Set<string>>();
const receiptKey = (workspace: string, id: string) => JSON.stringify([workspace, id]);
function ensureTables() {
  if (isInMemoryDatabasePath(process.env.DATABASE_PATH ?? env.DATABASE_PATH)) throw new Error("Persistent evidence database required");
  const db = getDatabase();
  if (initialized.has(db)) return db;
  db.exec(`CREATE TABLE IF NOT EXISTS pillow_certification_intake (
    workspace_id TEXT NOT NULL, receipt_id TEXT NOT NULL, content_hash TEXT NOT NULL,
    document TEXT NOT NULL, actor_id TEXT NOT NULL, ingested_at TEXT NOT NULL,
    PRIMARY KEY(workspace_id,receipt_id));
    CREATE TABLE IF NOT EXISTS pillow_certification_intake_audit (
    workspace_id TEXT NOT NULL, receipt_id TEXT NOT NULL, actor_id TEXT NOT NULL,
    content_hash TEXT NOT NULL, ingested_at TEXT NOT NULL,
    PRIMARY KEY(workspace_id,receipt_id));`);
  initialized.add(db);
  pending.set(db, new Set());
  return db;
}
function scope(workspaceId: string, actorId?: string) {
  if (!workspaceId || workspaceId.length > 256 || (actorId !== undefined && (!actorId || actorId.length > 256)))
    throw new Error("Authenticated receipt scope required");
}
function digest(document: string) { return createHash("sha256").update(document).digest("hex"); }
function project(row: Record<string, unknown>) {
  const audit = getDatabase().prepare("SELECT * FROM pillow_certification_intake_audit WHERE workspace_id=@workspaceId AND receipt_id=@receiptId").get({ workspaceId: row.workspace_id, receiptId: row.receipt_id });
  if (!audit || audit.actor_id !== row.actor_id || audit.content_hash !== row.content_hash || audit.ingested_at !== row.ingested_at) throw new Error("Certification audit integrity mismatch");
  if (typeof row.document !== "string" || Buffer.byteLength(row.document) > 16384 ||
      typeof row.actor_id !== "string" || typeof row.ingested_at !== "string" ||
      !Number.isFinite(Date.parse(row.ingested_at))) throw new Error("Corrupt certification evidence");
  const receipt = certificationReceiptSchema.parse(JSON.parse(row.document));
  if (receipt.receiptId !== row.receipt_id || digest(JSON.stringify(receipt)) !== row.content_hash)
    throw new Error("Certification evidence integrity mismatch");
  return { receipt, contentHash: row.content_hash, ingestedBy: row.actor_id, ingestedAt: row.ingested_at,
    status: "INGESTED_UNVERIFIED" as const,
    certificationAccepted: false as const,
    blockers: ["INDEPENDENT_REQUIREMENT_COVERAGE_UNVERIFIED", "REVIEWED_RELEASE_EVIDENCE_UNVERIFIED", "CERTIFICATION_ACCEPTANCE_NOT_IMPLEMENTED"],
    evidenceVerified: false as const, certificationCredit: 0 as const };
}
export async function ingestCertificationReceipt(workspaceId: string, actorId: string, input: unknown) {
  scope(workspaceId, actorId);
  const receipt = certificationReceiptSchema.parse(input);
  const document = JSON.stringify(receipt);
  if (Buffer.byteLength(document) > 16384) throw new Error("Receipt exceeds bounded payload");
  const db = ensureTables();
  const params = { workspaceId, receiptId: receipt.receiptId };
  let row = db.prepare("SELECT * FROM pillow_certification_intake WHERE workspace_id=@workspaceId AND receipt_id=@receiptId").get(params);
  let created = false;
  if (row) {
    project(row);
    if (row.document !== document) throw new ReceiptConflict("Receipt identity already has different content; original retained");
  } else {
    const count = db.prepare("SELECT COUNT(*) AS n FROM pillow_certification_intake").get();
    if (Number(count?.n) >= MAX_RECEIPTS) throw new Error("Evidence capacity reached; history retained");
    const values = { ...params, document, actorId, contentHash: digest(document), ingestedAt: new Date().toISOString() };
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO pillow_certification_intake VALUES (@workspaceId,@receiptId,@contentHash,@document,@actorId,@ingestedAt)").run(values);
      db.prepare("INSERT INTO pillow_certification_intake_audit VALUES (@workspaceId,@receiptId,@actorId,@contentHash,@ingestedAt)").run(values);
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    row = db.prepare("SELECT * FROM pillow_certification_intake WHERE workspace_id=@workspaceId AND receipt_id=@receiptId").get(params);
    created = true;
    pending.get(db)!.add(receiptKey(workspaceId, receipt.receiptId));
  }
  // This barrier is mandatory even for retries after a previous failed export.
  const key = receiptKey(workspaceId, receipt.receiptId);
  if (pending.get(db)!.has(key)) {
    await db.requestCriticalPersist();
    pending.get(db)!.delete(key);
  }
  return { created, ...project(row!) };
}
export async function readCertificationReceipt(workspaceId: string, receiptId: string) {
  scope(workspaceId);
  identifier.parse(receiptId);
  const db = ensureTables();
  const row = db.prepare("SELECT * FROM pillow_certification_intake WHERE workspace_id=@workspaceId AND receipt_id=@receiptId").get({ workspaceId, receiptId });
  if (!row) return null;
  // Do not expose a pending in-memory insert as durable after a failed write.
  const key = receiptKey(workspaceId, receiptId);
  if (pending.get(db)!.has(key)) {
    await db.requestCriticalPersist();
    pending.get(db)!.delete(key);
  }
  return project(row);
}
