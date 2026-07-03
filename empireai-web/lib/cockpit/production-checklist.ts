/**
 * G4-10 — Version 1 Cockpit production readiness checklist.
 * Used by executive audit and deployment gates.
 */

export type CockpitProductionChecklistItem = {
  id: string;
  category: "auth" | "navigation" | "data" | "ux" | "accessibility" | "deploy";
  label: string;
  required: boolean;
  status: "pass" | "partial" | "fail" | "manual";
  notes?: string;
};

export const COCKPIT_V1_PRODUCTION_CHECKLIST: readonly CockpitProductionChecklistItem[] = [
  { id: "PR-001", category: "auth", label: "Login → session → /cockpit redirect (G4-05A)", required: true, status: "pass" },
  { id: "PR-002", category: "auth", label: "Stale session guard via /api/auth/me", required: true, status: "pass" },
  { id: "PR-003", category: "auth", label: "Role-based sidebar navigation gating", required: true, status: "pass" },
  { id: "PR-004", category: "navigation", label: "44 routable screens registered in navigation.ts", required: true, status: "pass" },
  { id: "PR-005", category: "navigation", label: "Mobile nav includes Relationship Graph (G4-10)", required: true, status: "pass" },
  { id: "PR-006", category: "navigation", label: "Department tab role filtering on all surfaces", required: false, status: "partial", notes: "Sidebar/mobile filtered; top bar tabs not yet filtered" },
  { id: "PR-007", category: "data", label: "Executive Home live Brain widgets (G4-06)", required: true, status: "pass" },
  { id: "PR-008", category: "data", label: "Engine Centers eight-section contract (G4-04)", required: true, status: "pass" },
  { id: "PR-009", category: "data", label: "AI Interaction Layer on all pages (G4-07)", required: true, status: "pass" },
  { id: "PR-010", category: "data", label: "Global AI Assistant persistent overlay (G4-09)", required: true, status: "pass" },
  { id: "PR-011", category: "ux", label: "Shared loading / empty / error states (G4-10)", required: true, status: "partial", notes: "Standardised on executive surfaces; department panels migrating" },
  { id: "PR-012", category: "ux", label: "Unified health badge mapping (G4-10)", required: true, status: "pass" },
  { id: "PR-013", category: "ux", label: "Panel naming collision resolved (CockpitSectionPanel)", required: true, status: "pass" },
  { id: "PR-014", category: "accessibility", label: "Shell landmarks (nav, main, aria-current)", required: true, status: "partial", notes: "G4-10 shell pass; focus trap on drawers pending" },
  { id: "PR-015", category: "accessibility", label: "Skip link to main content", required: false, status: "fail" },
  { id: "PR-016", category: "deploy", label: "Production Vercel deploy with G4-05A+ changes", required: true, status: "manual", notes: "Verify post-deploy screenshots" },
  { id: "PR-017", category: "deploy", label: "Backend Brain dispatch health on production", required: true, status: "manual" },
  { id: "PR-018", category: "deploy", label: "End-to-end executive daily workflow smoke test", required: true, status: "manual" },
];

export function cockpitProductionReadinessScore(): {
  score: number;
  passed: number;
  partial: number;
  failed: number;
  manual: number;
  total: number;
} {
  const total = COCKPIT_V1_PRODUCTION_CHECKLIST.length;
  const passed = COCKPIT_V1_PRODUCTION_CHECKLIST.filter((i) => i.status === "pass").length;
  const partial = COCKPIT_V1_PRODUCTION_CHECKLIST.filter((i) => i.status === "partial").length;
  const failed = COCKPIT_V1_PRODUCTION_CHECKLIST.filter((i) => i.status === "fail").length;
  const manual = COCKPIT_V1_PRODUCTION_CHECKLIST.filter((i) => i.status === "manual").length;
  const score = Math.round(((passed + partial * 0.5) / total) * 100);
  return { score, passed, partial, failed, manual, total };
}
