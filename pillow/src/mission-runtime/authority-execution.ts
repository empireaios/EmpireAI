import { createHash } from "node:crypto";
import type { MissionPersistenceScope } from "./mission-persistence.js";
import type { MissionStore } from "./mission-store.js";

/** Only a local read of the authoritative state; this is never a permission grant. */
export const AUTHORITY_MISSION_WORKER = "pillow-authority-reader-v1" as const;
export const AUTHORITY_INTENT_LABEL = "authority.snapshot.v1:dispatch-intent";
export const AUTHORITY_RECEIPT_LABEL = "authority.snapshot.v1:reconciled";
export const authorityHash = (value: string) => createHash("sha256").update(value).digest("hex");
export type AuthorityDispatchBinding = {
  missionId: string; dispatchId: string; workerId: typeof AUTHORITY_MISSION_WORKER;
  action: "authority.snapshot.v1"; scope: MissionPersistenceScope; buildSha: string; inputHash: string;
};
export type AuthorityStoredReceipt = AuthorityDispatchBinding & {
  receiptId: string; jobId: string; status: "completed"; completedAt: string;
  outputHash: string; output: unknown; certificationCredit: false;
};
export type AuthorityAdmission = { acceptedDurably: true; jobId: string };
export type AuthorityMissionAdapter = {
  binding(missionId: string, dispatchId: string): AuthorityDispatchBinding;
  enqueue(binding: AuthorityDispatchBinding): AuthorityAdmission;
  /** Resolves a native-store receipt; never accepts receipt data supplied by a caller. */
  getReceipt(jobId: string): AuthorityStoredReceipt | null;
};
export function validAuthorityBinding(value: unknown): value is AuthorityDispatchBinding {
  const b = value as AuthorityDispatchBinding | null;
  return Boolean(b && Object.keys(b).sort().join() === "action,buildSha,dispatchId,inputHash,missionId,scope,workerId" &&
    typeof b.missionId === "string" && /^[A-Za-z0-9._-]{1,160}$/.test(b.missionId) &&
    typeof b.dispatchId === "string" && /^[A-Za-z0-9._-]{1,240}$/.test(b.dispatchId) &&
    b.action === "authority.snapshot.v1" && b.workerId === AUTHORITY_MISSION_WORKER &&
    typeof b.buildSha === "string" && /^[a-f0-9]{40}$/.test(b.buildSha) && b.inputHash === authorityHash("{}") &&
    b.scope && Object.keys(b.scope).sort().join() === "ownerEmail,workspaceId" && b.scope.workspaceId === "ws_empire_1" &&
    typeof b.scope.ownerEmail === "string" && b.scope.ownerEmail.includes("@") && b.scope.ownerEmail.length <= 254 &&
    b.scope.ownerEmail === b.scope.ownerEmail.trim().toLowerCase());
}
export function authorityBindingIdentity(b: AuthorityDispatchBinding): string {
  return JSON.stringify([b.scope.workspaceId,b.scope.ownerEmail,b.missionId,b.dispatchId,b.workerId,b.action,b.buildSha,b.inputHash]);
}
export function authorityJobId(b: AuthorityDispatchBinding): string {
  return `mae_${authorityHash(JSON.stringify([b.scope.workspaceId,b.scope.ownerEmail,b.missionId,b.workerId]))}`;
}
export function storedAuthorityBinding(store: MissionStore, missionId: string): AuthorityDispatchBinding | null {
  const intents = store.listCheckpoints(missionId).filter(c => c.label === AUTHORITY_INTENT_LABEL);
  if (intents.length !== 1) return null;
  const intent = intents[0]!;
  const binding = intent.payload.binding;
  if (intent.state !== "Running" || !validAuthorityBinding(binding) || binding.missionId !== missionId ||
    !store.listTimeline().some(t => t.entryId === binding.dispatchId && t.label === `dispatch:${missionId}` && t.state === "Running")) return null;
  return structuredClone(binding);
}
