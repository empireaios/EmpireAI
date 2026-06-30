import fs from "node:fs";
import path from "node:path";
import { BACKEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { ROLE_PERMISSIONS, type UserRole } from "../../../auth/permissions.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { SecurityReview } from "../models/security-review.js";

type ReviewItem = SecurityReview["items"][number];

function moduleExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

function countRoleModules(): Record<UserRole, number> {
  return {
    founder: ROLE_PERMISSIONS.founder.length,
    operator: ROLE_PERMISSIONS.operator.length,
    admin: ROLE_PERMISSIONS.admin.length,
  };
}

function modulesMissingFromPermissions(): string[] {
  const catalogModules = new Set(PROGRAM_CATALOG.flatMap((p) => p.ownerModules));
  const permitted = new Set(ROLE_PERMISSIONS.founder);
  return [...catalogModules].filter((m) => !permitted.has(m)).slice(0, 8);
}

/** REAL-094 — Security review: permissions, auth, credential vault, approval flows. */
export function buildSecurityReview(
  workspaceId: string,
  companyId: string,
): SecurityReview {
  const items: ReviewItem[] = [];
  const roleCounts = countRoleModules();
  const missingModules = modulesMissingFromPermissions();

  items.push({
    itemId: "permissions-module-list",
    label: "permissions.ts ROLE_PERMISSIONS coverage",
    score: missingModules.length === 0 ? 90 : 65,
    status: missingModules.length === 0 ? "READY" : "PENDING",
    recommendation: missingModules.length > 0
      ? `Add missing ownerModules to founder/operator permissions: ${missingModules.join(", ")}`
      : "All PROGRAM_CATALOG ownerModules present in founder permissions",
    evidence: `founder=${roleCounts.founder} · operator=${roleCounts.operator} · admin=${roleCounts.admin} modules`,
    why: "Incomplete permission lists allow unauthorized module access or block legitimate Founder workflows",
  });

  const authMiddlewarePath = path.join(BACKEND_SRC, "auth", "middleware.ts");
  const authContent = fs.existsSync(authMiddlewarePath) ? fs.readFileSync(authMiddlewarePath, "utf8") : "";
  const hasBearer = authContent.includes("Bearer ");
  const hasCookie = authContent.includes("empireai_session");
  const hasModuleGate = authContent.includes("canAccessModule");
  items.push({
    itemId: "auth-middleware",
    label: "Auth middleware — session + module gate",
    score: hasBearer && hasCookie && hasModuleGate ? 92 : 55,
    status: hasBearer && hasCookie && hasModuleGate ? "READY" : "BLOCKED",
    recommendation: "Maintain Bearer + cookie dual auth; enforce requireModuleAccess on sensitive routes",
    evidence: `Bearer=${hasBearer} · cookie=${hasCookie} · canAccessModule=${hasModuleGate}`,
    why: "Grand King and Founder sessions must not share bypass paths to commerce execution",
  });

  const vaultPaths = [
    "orchestration/reality-integration/repositories/sqlite-credential-vault-repository.ts",
    "orchestration/reality-integration/models/reality-integration.ts",
    "orchestration/reality-integration/services/connector-runtime.ts",
  ];
  const vaultPresent = vaultPaths.every((p) => moduleExists(p));
  items.push({
    itemId: "credential-vault",
    label: "Reality-integration credential vault",
    score: vaultPresent ? 88 : 40,
    status: vaultPresent ? "READY" : "BLOCKED",
    recommendation: vaultPresent
      ? "Ensure all live connectors use vault credentialsRef — never inline secrets"
      : "Restore credential vault repository before any live OAR connection",
    evidence: vaultPaths.map((p) => `${p}: ${moduleExists(p) ? "OK" : "MISSING"}`).join(" · "),
    why: "CONSTITUTION-021 — credentials must never appear in logs, debates, or client payloads",
  });

  const approvalModules = [
    { id: "grand-king", path: "grand-king", label: "Grand King approval gate" },
    { id: "executive-council", path: "executive-council", label: "Executive Council debate registry" },
    { id: "grand-king-revenue-pipeline", path: "grand-king-revenue-pipeline", label: "GKR KING_APPROVAL pipeline" },
    { id: "executive-visual-debate", path: "runtime/executive-visual-debate", label: "Executive Visual Debate (no auto-execute)" },
  ];
  for (const mod of approvalModules) {
    const exists = moduleExists(mod.path);
    items.push({
      itemId: `approval-${mod.id}`,
      label: mod.label,
      score: exists ? 85 : 35,
      status: exists ? "READY" : "BLOCKED",
      recommendation: exists
        ? "Verify classifyAction blocks EXECUTE without Founder/Grand King approval"
        : "Restore approval module before commerce publish path goes live",
      evidence: `backend/src/${mod.path} — ${exists ? "present" : "missing"}`,
      why: "Soul never bypasses Grand King — approval chain is compliance-critical for Version 1",
    });
  }

  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k && p.programId === "operational-access");
  if (blockingPrograms.length > 0) {
    items.push({
      itemId: "compliance-oar-live",
      label: "Compliance — live credential verification (REAL-002B)",
      score: 45,
      status: "BLOCKED",
      recommendation: blockingPrograms[0]!.nextCursorMission,
      evidence: "operational-access blocksUsd100k=true — live credentials not verified",
      why: "Unverified credentials create security and revenue integrity risk before go-live",
    });
  }

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  const blockedCount = items.filter((i) => i.status === "BLOCKED").length;

  return {
    moduleId: "security-review",
    missionId: "REAL-094",
    workspaceId,
    companyId,
    summary: `REAL-094 — ${items.length} compliance checks · ${blockedCount} blocked · permissions + vault + approval chain reviewed`,
    items,
    reusedModules: ["auth", "reality-integration", "executive-council", "grand-king", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
