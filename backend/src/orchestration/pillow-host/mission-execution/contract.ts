import { createHash } from "node:crypto";
import type { PillowAuthority } from "../../pillow-commissioning/pillow-authority.js";

export const AUTHORITY_ACTION = "authority.snapshot.v1" as const;
export const AUTHORITY_WORKER = "pillow-authority-reader-v1" as const;
export const EMPTY_INPUT_HASH = sha256("{}");
export type ExecutionScope = { workspaceId: "ws_empire_1"; ownerEmail: string };
export type ExecutionRequest = {
  missionId: string; dispatchId: string; workerId: typeof AUTHORITY_WORKER;
  action: typeof AUTHORITY_ACTION; scope: ExecutionScope; buildSha: string; inputHash: string;
};
export type AuthorityOutput = { kind: "actual_readonly_authority_inspection"; observedAt: string; authority: PillowAuthority };
export type ExecutionReceipt = ExecutionRequest & {
  receiptId: string; jobId: string; status: "completed"; completedAt: string;
  outputHash: string; output: AuthorityOutput; certificationCredit: false;
};
export type ExecutionStatus = "queued" | "leased" | "completed" | "unknown";
export type ExecutionJob = ExecutionRequest & { jobId: string; status: ExecutionStatus; attempts: number; createdAt: string;
  leaseToken: string | null; leaseUntil: number | null; receipt: ExecutionReceipt | null; reconciled: boolean; lastError: string | null };
export class ExecutionConflict extends Error {}
export function sha256(text: string): string { return createHash("sha256").update(text).digest("hex"); }
export function validateScope(value: ExecutionScope): void {
  if (!value || value.workspaceId !== "ws_empire_1" || typeof value.ownerEmail !== "string" ||
    value.ownerEmail.length > 254 || !value.ownerEmail.includes("@") || value.ownerEmail !== value.ownerEmail.trim().toLowerCase()) throw new Error("Invalid execution owner scope");
}
export function validateRequest(value: ExecutionRequest): void {
  validateScope(value.scope);
  if (!/^[a-zA-Z0-9._-]{1,160}$/.test(value.missionId) || !/^[a-zA-Z0-9._-]{1,240}$/.test(value.dispatchId) ||
    value.workerId !== AUTHORITY_WORKER || value.action !== AUTHORITY_ACTION || !/^[a-f0-9]{40}$/.test(value.buildSha) ||
    value.inputHash !== EMPTY_INPUT_HASH) throw new Error("Unsupported or invalid authority execution request");
}
/** One read operation per mission and worker. Changed dispatch/build/action is a conflict, never a fresh execution. */
export function jobIdFor(value: ExecutionRequest): string {
  return `mae_${sha256(JSON.stringify([value.scope.workspaceId, value.scope.ownerEmail, value.missionId, value.workerId]))}`;
}
export function requestIdentity(value: ExecutionRequest): string {
  return JSON.stringify([value.scope.workspaceId, value.scope.ownerEmail, value.missionId, value.dispatchId, value.workerId, value.action, value.buildSha, value.inputHash]);
}
// Historical immutable receipts retain their observed intake status; neither status grants authority.
export function validateOutput(value: unknown): asserts value is AuthorityOutput {
  const output = value as AuthorityOutput | null;
  const a = output?.authority;
  if (!output || output.kind !== "actual_readonly_authority_inspection" || !Number.isFinite(Date.parse(output.observedAt)) ||
    !a || a.birthStatus !== "NOT_BORN" || a.technicallyReady !== false || a.commerceStatus !== "LOCKED" ||
    a.realCommerceAuthorized !== false || a.waveCredit !== 0 || a.independentCertification !== "UNVERIFIED" ||
    !["NOT_IMPLEMENTED", "IMPLEMENTED_UNVERIFIED_ONLY"].includes(a.certificationReceiptIngestion) || typeof a.reason !== "string" || a.reason.length > 4096 ||
    Object.keys(output).sort().join() !== "authority,kind,observedAt" ||
    Object.keys(a).sort().join() !== "birthStatus,certificationReceiptIngestion,commerceStatus,independentCertification,realCommerceAuthorized,reason,technicallyReady,waveCredit") {
    throw new Error("Canonical authority output is invalid or changed; execution requires review");
  }
}
