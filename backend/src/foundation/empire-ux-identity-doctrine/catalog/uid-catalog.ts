import type { UxIdentityDoctrineArticle } from "../models/ux-identity-doctrine.js";

function doctrine(
  sequence: number,
  doctrineId: string,
  title: string,
  statement: string,
  category: UxIdentityDoctrineArticle["category"],
  boundSurface: string | null = null,
): UxIdentityDoctrineArticle {
  return Object.freeze({
    doctrineId,
    sequence,
    title,
    statement,
    category,
    boundSurface,
    immutable: true as const,
    version: "1.0.0" as const,
  });
}

/** UID-001 → UID-020 — Immutable UX & Identity Doctrine. NOT runtime logic. */
export const UX_IDENTITY_DOCTRINE_CATALOG: readonly UxIdentityDoctrineArticle[] = Object.freeze([
  doctrine(1, "UID-001", "Grand King Platform Owner", "Grand King is the Platform Owner. Not a selectable role. Logs in through Founder authentication with Grand King credentials and is automatically recognized.", "identity", "auth"),
  doctrine(2, "UID-002", "Founder Is Tenant", "Founder is a tenant. Founder never sees Grand King capabilities.", "identity", "founder-platform-preparation"),
  doctrine(3, "UID-003", "No Role Selection", "No role-selection screen. Authentication determines destination.", "identity", "frontend/login"),
  doctrine(4, "UID-004", "Separate Dashboards", "Grand King dashboard must always be completely separate from Founder dashboard.", "dashboard", "mission-home"),
  doctrine(5, "UID-005", "What Should I Do Next", "Every dashboard must answer: What should I do next?", "dashboard", "mission-panel"),
  doctrine(6, "UID-006", "Business Decisions", "Every page must contribute to business decisions.", "dashboard"),
  doctrine(7, "UID-007", "No Display-Only Dashboards", "No dashboard exists only to display data.", "dashboard"),
  doctrine(8, "UID-008", "Mission Home Headquarters", "Mission Home is Empire Headquarters. Everything important begins here.", "navigation", "mission-home"),
  doctrine(9, "UID-009", "Executive Headquarters", "Executive Headquarters must present the Empire, not individual modules.", "navigation", "mission-home"),
  doctrine(10, "UID-010", "Standard Navigation Model", "Country → Marketplace → Products → Performance → Executive Recommendation is the standard navigation model.", "navigation", "country-marketplace-tabs"),
  doctrine(11, "UID-011", "Instant Global Health", "Grand King must immediately understand global business health within seconds of login.", "visual_hierarchy", "global-command-center"),
  doctrine(12, "UID-012", "Visual Executive Debates", "Executive debates must be visual. Not logs. Not chat.", "executive_ux", "executive-visual-debate"),
  doctrine(13, "UID-013", "Soul After Debate", "Soul recommendations must always appear after Executive debate.", "executive_ux", "executive-visual-debate"),
  doctrine(14, "UID-014", "King Actions Visible", "Grand King actions Approve, Reject, Request Investigation must always be visible.", "executive_ux", "global-marketplace-operations"),
  doctrine(15, "UID-015", "Business Over Technical", "Business health must take priority over technical health.", "visual_hierarchy"),
  doctrine(16, "UID-016", "Revenue Profit Risk Priority", "Visual hierarchy must prioritize Revenue, Profit, Risk, Opportunities before secondary metrics.", "visual_hierarchy", "grand-king-financial-command-center"),
  doctrine(17, "UID-017", "Minimize Clicks", "Navigation must minimize the number of clicks to reach critical decisions.", "navigation"),
  doctrine(18, "UID-018", "Explain Why", "Every important visual must explain WHY not only WHAT.", "visual_hierarchy", "mission-engine"),
  doctrine(19, "UID-019", "Simple Professional UX", "Version 1 UX must remain simple, professional, and operational. Avoid unnecessary animations, decorations, or novelty.", "simplicity"),
  doctrine(20, "UID-020", "SUCCESS-001 UX Goal", "Every UX decision must increase Grand King's ability to operate EmpireAI towards SUCCESS-001 USD 100,000 net profit.", "success_mission", "success-001"),
]);

export function getUxIdentityDoctrine(doctrineId: string): UxIdentityDoctrineArticle | undefined {
  return UX_IDENTITY_DOCTRINE_CATALOG.find((d) => d.doctrineId === doctrineId);
}

export function listUxIdentityDoctrines(): UxIdentityDoctrineArticle[] {
  return [...UX_IDENTITY_DOCTRINE_CATALOG];
}

export function listIdentityDoctrines(): UxIdentityDoctrineArticle[] {
  return UX_IDENTITY_DOCTRINE_CATALOG.filter((d) => d.category === "identity");
}

export function listUxDoctrines(): UxIdentityDoctrineArticle[] {
  return UX_IDENTITY_DOCTRINE_CATALOG.filter((d) => d.category !== "identity");
}
