/** Offline primitive only: no provider calls, pricing, owner approval or router activation.
 * Trusted callers supply reviewed identity and worst-case integer micro-USD amounts.
 * A reservation authorizes at most ONE dispatch. Existing IDs never authorize replay.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type HeldBudgetIdentity = {
  campaignId: string; approvalReference: string; workspaceId: string; serviceId: string;
  sourceCommit: string; caseSetSha256: string; provider: string; model: string;
};
export type HeldBudgetCampaign = { identity: HeldBudgetIdentity; capMicroUsd: number; expiresAt: string };
type Attempt = { attempt_id: string; upper_micro_usd: number; charge_micro_usd: number; state: string; receipt_sha256: string | null; uncertainty: string | null };
const APP_ID = 0x48424331;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,255}$/;
const SHA = /^[a-f0-9]{64}$/;
const requireThat = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
function money(value: unknown): asserts value is number {
  requireThat(typeof value === "number" && Number.isSafeInteger(value) && value >= 0, "INVALID_MICRO_USD");
}
function identityJson(identity: HeldBudgetIdentity): string {
  const keys = ["campaignId", "approvalReference", "workspaceId", "serviceId", "sourceCommit", "caseSetSha256", "provider", "model"] as const;
  requireThat(identity && Object.keys(identity).length === keys.length && keys.every(k => typeof identity[k] === "string" && ID.test(identity[k])), "INVALID_CAMPAIGN_IDENTITY");
  requireThat(/^[a-f0-9]{40}$/.test(identity.sourceCommit) && SHA.test(identity.caseSetSha256), "INVALID_SOURCE_OR_CASE_HASH");
  return JSON.stringify(Object.fromEntries(keys.map(k => [k, identity[k]])));
}

export class HeldCaseBudgetLedger {
  private db: DatabaseSync;
  constructor(filename: string) {
    requireThat(path.isAbsolute(filename), "ABSOLUTE_LEDGER_PATH_REQUIRED");
    let component = path.parse(filename).root;
    for (const part of path.relative(component, path.dirname(filename)).split(path.sep).filter(Boolean)) {
      component = path.join(component, part);
      requireThat(!fs.lstatSync(component).isSymbolicLink(), "SYMLINK_LEDGER_PARENT");
    }
    let stat: fs.Stats | undefined;
    try { stat = fs.lstatSync(filename); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (stat) {
      requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, "UNSAFE_LEDGER_FILE");
    }
    this.db = new DatabaseSync(filename, { allowExtension: false });
    try {
      this.db.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA synchronous=FULL;");
      this.transaction(() => {
        const app = this.db.prepare("PRAGMA application_id").get()!.application_id;
        const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        requireThat(app === APP_ID || (app === 0 && tables.length === 0), "FOREIGN_DATABASE_REFUSED");
        if (app === APP_ID) requireThat(this.db.prepare("PRAGMA user_version").get()!.user_version === 1, "UNSUPPORTED_LEDGER_SCHEMA");
        this.db.exec(`CREATE TABLE IF NOT EXISTS campaigns (
          campaign_id TEXT PRIMARY KEY, identity_json TEXT NOT NULL, cap_micro_usd INTEGER NOT NULL CHECK(cap_micro_usd>0),
          expires_at TEXT NOT NULL, halted INTEGER NOT NULL DEFAULT 0 CHECK(halted IN(0,1)));
          CREATE TABLE IF NOT EXISTS attempts (
          campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id), attempt_id TEXT NOT NULL,
          upper_micro_usd INTEGER NOT NULL CHECK(upper_micro_usd>0), charge_micro_usd INTEGER NOT NULL CHECK(charge_micro_usd>=0),
          state TEXT NOT NULL CHECK(state IN('RESERVED','UNCERTAIN','FINAL')), receipt_sha256 TEXT, uncertainty TEXT,
          PRIMARY KEY(campaign_id,attempt_id)); PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;`);
      });
      this.db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;");
      fs.chmodSync(filename, 0o600);
      if (process.platform !== "win32") {
        const parent = fs.openSync(path.dirname(filename), "r");
        try { fs.fsyncSync(parent); } finally { fs.closeSync(parent); }
      }
    } catch (error) { this.db.close(); throw error; }
  }
  close(): void { this.db.close(); }
  private transaction<T>(action: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const result = action(); this.db.exec("COMMIT"); return result; }
    catch (error) { try { this.db.exec("ROLLBACK"); } catch { /* Preserve original error. */ } throw error; }
  }
  private campaign(identity: HeldBudgetIdentity) {
    const canonical = identityJson(identity);
    const row = this.db.prepare("SELECT * FROM campaigns WHERE campaign_id=?").get(identity.campaignId) as
      { identity_json: string; cap_micro_usd: number; expires_at: string; halted: number } | undefined;
    requireThat(row && row.identity_json === canonical, "UNKNOWN_OR_MISMATCHED_CAMPAIGN");
    return row!;
  }
  private attempts(campaignId: string): Attempt[] {
    return this.db.prepare("SELECT * FROM attempts WHERE campaign_id=? ORDER BY attempt_id").all(campaignId) as unknown as Attempt[];
  }
  private total(campaignId: string): bigint {
    return this.attempts(campaignId).reduce((sum, r) => { money(r.charge_micro_usd); return sum + BigInt(r.charge_micro_usd); }, 0n);
  }
  createCampaign(config: HeldBudgetCampaign): void {
    const canonical = identityJson(config.identity); money(config.capMicroUsd);
    requireThat(config.capMicroUsd > 0 && typeof config.expiresAt === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(config.expiresAt) &&
      Number.isFinite(Date.parse(config.expiresAt)) && new Date(config.expiresAt).toISOString() === config.expiresAt, "INVALID_CAMPAIGN_BOUNDS");
    this.transaction(() => {
      const prior = this.db.prepare("SELECT * FROM campaigns WHERE campaign_id=?").get(config.identity.campaignId);
      if (prior) {
        requireThat(prior.identity_json === canonical && prior.cap_micro_usd === config.capMicroUsd && prior.expires_at === config.expiresAt, "CAMPAIGN_IMMUTABLE"); return;
      }
      requireThat(Date.parse(config.expiresAt) > Date.now(), "CAMPAIGN_EXPIRED");
      this.db.prepare("INSERT INTO campaigns(campaign_id,identity_json,cap_micro_usd,expires_at) VALUES(?,?,?,?)")
        .run(config.identity.campaignId, canonical, config.capMicroUsd, config.expiresAt);
    });
  }
  reserve(identity: HeldBudgetIdentity, attemptId: string, upperMicroUsd: number): { authorizedToStart: boolean; disposition: "NEW" | "EXISTING" } {
    requireThat(typeof attemptId === "string" && ID.test(attemptId), "INVALID_ATTEMPT_ID"); money(upperMicroUsd); requireThat(upperMicroUsd > 0, "POSITIVE_RESERVATION_REQUIRED");
    return this.transaction(() => {
      const campaign = this.campaign(identity);
      const existing = this.db.prepare("SELECT * FROM attempts WHERE campaign_id=? AND attempt_id=?").get(identity.campaignId, attemptId);
      if (existing) {
        requireThat(existing.upper_micro_usd === upperMicroUsd, "ATTEMPT_CONFLICT");
        return { authorizedToStart: false, disposition: "EXISTING" };
      }
      requireThat(campaign.halted === 0, "CAMPAIGN_HALTED");
      requireThat(Date.now() < Date.parse(campaign.expires_at), "CAMPAIGN_EXPIRED");
      requireThat(this.total(identity.campaignId) + BigInt(upperMicroUsd) <= BigInt(campaign.cap_micro_usd), "CAP_EXCEEDED");
      this.db.prepare("INSERT INTO attempts(campaign_id,attempt_id,upper_micro_usd,charge_micro_usd,state) VALUES(?,?,?,?, 'RESERVED')")
        .run(identity.campaignId, attemptId, upperMicroUsd, upperMicroUsd);
      return { authorizedToStart: true, disposition: "NEW" };
    });
  }
  markUncertain(identity: HeldBudgetIdentity, attemptId: string, reason: "TIMEOUT" | "INTERRUPTED" | "PROVIDER_ERROR"): void {
    requireThat(["TIMEOUT", "INTERRUPTED", "PROVIDER_ERROR"].includes(reason), "INVALID_UNCERTAINTY_REASON");
    this.transaction(() => {
      this.campaign(identity);
      const existing = this.db.prepare("SELECT state FROM attempts WHERE campaign_id=? AND attempt_id=?").get(identity.campaignId, attemptId);
      requireThat(existing, "ATTEMPT_NOT_RESERVED"); requireThat(existing!.state !== "FINAL", "FINAL_ATTEMPT_IMMUTABLE");
      this.db.prepare("UPDATE attempts SET state='UNCERTAIN',uncertainty=? WHERE campaign_id=? AND attempt_id=?").run(reason, identity.campaignId, attemptId);
    });
  }
  /** Only a trusted, reconciled FINAL provider receipt can release unused funds.
   * This primitive validates binding/amount consistency; it cannot authenticate a bill.
   */
  settleFinal(identity: HeldBudgetIdentity, attemptId: string, input: { actualMicroUsd: number; receiptSha256: string; finality: "PROVIDER_FINAL" }): { boundExceeded: boolean; campaignHalted: boolean } {
    money(input.actualMicroUsd); requireThat(input.finality === "PROVIDER_FINAL" && typeof input.receiptSha256 === "string" && SHA.test(input.receiptSha256), "FINAL_PROVIDER_RECEIPT_REQUIRED");
    return this.transaction(() => {
      const campaign = this.campaign(identity);
      const attempt = this.db.prepare("SELECT * FROM attempts WHERE campaign_id=? AND attempt_id=?").get(identity.campaignId, attemptId) as unknown as Attempt | undefined;
      requireThat(attempt, "ATTEMPT_NOT_RESERVED");
      if (attempt!.state === "FINAL") requireThat(attempt!.charge_micro_usd === input.actualMicroUsd && attempt!.receipt_sha256 === input.receiptSha256, "FINAL_ATTEMPT_IMMUTABLE");
      const boundExceeded = input.actualMicroUsd > attempt!.upper_micro_usd;
      this.db.prepare("UPDATE attempts SET state='FINAL',charge_micro_usd=?,receipt_sha256=? WHERE campaign_id=? AND attempt_id=?")
        .run(input.actualMicroUsd, input.receiptSha256, identity.campaignId, attemptId);
      const halted = campaign.halted === 1 || boundExceeded || this.total(identity.campaignId) > BigInt(campaign.cap_micro_usd);
      if (halted) this.db.prepare("UPDATE campaigns SET halted=1 WHERE campaign_id=?").run(identity.campaignId);
      return { boundExceeded, campaignHalted: halted };
    });
  }
  snapshot(identity: HeldBudgetIdentity) {
    return this.transaction(() => {
      const campaign = this.campaign(identity);
      // Decimal string avoids losing precision if externally reconciled overruns
      // make the aggregate exceed JS's safe integer range.
      return { capMicroUsd: campaign.cap_micro_usd, chargedOrReservedMicroUsd: this.total(identity.campaignId).toString(),
        expiresAt: campaign.expires_at, halted: campaign.halted === 1, attempts: this.attempts(identity.campaignId),
        providerEnforcementProven: false as const, ownerApprovalVerified: false as const };
    });
  }
}
