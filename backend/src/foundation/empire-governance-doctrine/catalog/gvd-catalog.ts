import type { AuthorityMatrixEntry, GovernanceDoctrineArticle } from "../models/governance-doctrine.js";

function doctrine(
  sequence: number,
  doctrineId: string,
  title: string,
  statement: string,
  category: GovernanceDoctrineArticle["category"],
  boundModule: string | null = null,
): GovernanceDoctrineArticle {
  return Object.freeze({
    doctrineId,
    sequence,
    title,
    statement,
    category,
    boundModule,
    immutable: true as const,
    version: "1.0.0" as const,
  });
}

/** GVD-001 → GVD-030 — Immutable Empire Governance Doctrine. NOT runtime logic. */
export const GOVERNANCE_DOCTRINE_CATALOG: readonly GovernanceDoctrineArticle[] = Object.freeze([
  doctrine(1, "GVD-001", "Grand King Platform Owner", "Grand King is the Platform Owner. Ultimate approval authority.", "authority", "grand-king"),
  doctrine(2, "GVD-002", "Founder Is Customer", "Founder is Platform Customer. Never Platform Governor.", "authority", "founder-platform-preparation"),
  doctrine(3, "GVD-003", "Executive Council Debates", "Executive Council debates. Never executes.", "module_boundary", "executive-council"),
  doctrine(4, "GVD-004", "Soul Synthesizes", "Soul synthesizes. Never bypasses Grand King.", "module_boundary", "soul-runtime"),
  doctrine(5, "GVD-005", "Executive Surveillance Observes", "Executive Surveillance observes. Never decides.", "module_boundary", "executive-surveillance"),
  doctrine(6, "GVD-006", "MCL Records", "Master Completion Ledger records. Never recommends authority.", "module_boundary", "master-completion-ledger"),
  doctrine(7, "GVD-007", "Supplier Intelligence Evaluates", "Supplier Intelligence evaluates suppliers. Never launches products.", "module_boundary", "supplier-intelligence"),
  doctrine(8, "GVD-008", "Marketplace Intelligence Evaluates", "Marketplace Intelligence evaluates marketplaces. Never publishes.", "module_boundary", "marketplace-publishing"),
  doctrine(9, "GVD-009", "Commerce Runtime Executes After Approval", "Commerce Runtime executes only after approval.", "module_boundary", "commerce-runtime"),
  doctrine(10, "GVD-010", "Reality Integration Authenticates", "Reality Integration authenticates. Never authorizes commercial strategy.", "module_boundary", "reality-integration"),
  doctrine(11, "GVD-011", "Operational Access Controls Permissions", "Operational Access controls permissions. Not commercial decisions.", "module_boundary", "operational-access"),
  doctrine(12, "GVD-012", "Empire Knowledge Provides Knowledge", "Empire Knowledge provides knowledge. Never final authority.", "module_boundary", "empire-knowledge"),
  doctrine(13, "GVD-013", "Recommendation Originating Module", "Every recommendation must have an originating module.", "recommendation"),
  doctrine(14, "GVD-014", "Recommendation Evidence", "Every recommendation must identify supporting evidence.", "recommendation"),
  doctrine(15, "GVD-015", "Recommendation Business Impact", "Every recommendation must identify business impact.", "recommendation"),
  doctrine(16, "GVD-016", "Recommendation Commercial Risk", "Every recommendation must identify commercial risk.", "recommendation"),
  doctrine(17, "GVD-017", "Recommendation Confidence", "Every recommendation must identify confidence.", "recommendation"),
  doctrine(18, "GVD-018", "Recommendation Expected Profit", "Every recommendation must identify expected profit.", "recommendation"),
  doctrine(19, "GVD-019", "Irreversible Actions Require King Approval", "Irreversible actions always require Grand King approval unless explicitly whitelisted.", "approval", "grand-king"),
  doctrine(20, "GVD-020", "Approval Policy Visible", "Approval policy must be visible to Grand King.", "approval", "empire-governance"),
  doctrine(21, "GVD-021", "Approvals Auditable", "Every approval must be auditable.", "audit", "king-decision-history"),
  doctrine(22, "GVD-022", "Rejections Auditable", "Every rejection must be auditable.", "audit", "king-decision-history"),
  doctrine(23, "GVD-023", "Overrides Auditable", "Every override must be auditable.", "audit", "brain/audit"),
  doctrine(24, "GVD-024", "No Silent Governance Change", "EmpireAI must never silently change governance.", "versioning", "empire-governance"),
  doctrine(25, "GVD-025", "Governance Versioned", "Governance must be versioned.", "versioning", "empire-governance-doctrine"),
  doctrine(26, "GVD-026", "No Self-Granted Authority", "No module may grant itself additional authority.", "boundaries"),
  doctrine(27, "GVD-027", "Declared Interfaces", "Modules communicate through declared interfaces, not hidden dependencies.", "boundaries"),
  doctrine(28, "GVD-028", "Escalation Path Visible", "Escalation path must always be visible.", "escalation", "product-launch-commander"),
  doctrine(29, "GVD-029", "Governance Violations Fail Review", "Governance violations must fail Empire Review.", "review", "empire-self-inspection"),
  doctrine(30, "GVD-030", "Protect Before Speed", "Governance protects the Empire before speed.", "review", "global-risk-command"),
]);

/** Authority matrix — module roles under GVD doctrine. */
export const GOVERNANCE_AUTHORITY_MATRIX: readonly AuthorityMatrixEntry[] = Object.freeze([
  { moduleId: "grand-king", role: "Platform Owner — ultimate approval", mayExecute: true, mayDecide: true, mayRecommend: true, escalationTarget: null, gvdArticles: ["GVD-001", "GVD-019"] },
  { moduleId: "founder-platform-preparation", role: "Platform Customer — tenant only", mayExecute: false, mayDecide: false, mayRecommend: false, escalationTarget: "grand-king", gvdArticles: ["GVD-002"] },
  { moduleId: "executive-council", role: "Debates — never executes", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "grand-king", gvdArticles: ["GVD-003"] },
  { moduleId: "soul-runtime", role: "Synthesizes — never bypasses King", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "grand-king", gvdArticles: ["GVD-004"] },
  { moduleId: "executive-surveillance", role: "Observes — never decides", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "executive-council", gvdArticles: ["GVD-005"] },
  { moduleId: "master-completion-ledger", role: "Records — never recommends authority", mayExecute: false, mayDecide: false, mayRecommend: false, escalationTarget: null, gvdArticles: ["GVD-006"] },
  { moduleId: "supplier-intelligence", role: "Evaluates suppliers — never launches", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "grand-king", gvdArticles: ["GVD-007"] },
  { moduleId: "marketplace-publishing", role: "Evaluates marketplaces — never publishes without approval", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "grand-king", gvdArticles: ["GVD-008"] },
  { moduleId: "commerce-runtime", role: "Executes only after approval", mayExecute: true, mayDecide: false, mayRecommend: false, escalationTarget: "grand-king", gvdArticles: ["GVD-009"] },
  { moduleId: "reality-integration", role: "Authenticates — not commercial strategy", mayExecute: false, mayDecide: false, mayRecommend: false, escalationTarget: null, gvdArticles: ["GVD-010"] },
  { moduleId: "operational-access", role: "Controls permissions — not commercial decisions", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: null, gvdArticles: ["GVD-011"] },
  { moduleId: "empire-knowledge", role: "Knowledge — never final authority", mayExecute: false, mayDecide: false, mayRecommend: true, escalationTarget: "executive-council", gvdArticles: ["GVD-012"] },
]);

export function getGovernanceDoctrine(doctrineId: string): GovernanceDoctrineArticle | undefined {
  return GOVERNANCE_DOCTRINE_CATALOG.find((d) => d.doctrineId === doctrineId);
}

export function listGovernanceDoctrines(): GovernanceDoctrineArticle[] {
  return [...GOVERNANCE_DOCTRINE_CATALOG];
}

export function listAuthorityMatrix(): AuthorityMatrixEntry[] {
  return [...GOVERNANCE_AUTHORITY_MATRIX];
}
