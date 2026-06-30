import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { DASHBOARD_SOURCES, FRONTEND_PAGE_REGISTRY } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import type { CommandCenterPolish } from "../models/command-center-polish.js";

type ReviewItem = CommandCenterPolish["items"][number];

function parseDashboardSurfaces(): Array<{ programId: string; name: string; surfaces: string[] }> {
  return PROGRAM_CATALOG.map((p) => ({
    programId: p.programId,
    name: p.name,
    surfaces: p.dashboardSurface.split("·").map((s) => s.trim()).filter(Boolean),
  }));
}

function findDuplicateSurfaces(
  parsed: ReturnType<typeof parseDashboardSurfaces>,
): Array<{ label: string; programs: string[]; count: number }> {
  const counts = new Map<string, string[]>();
  for (const entry of parsed) {
    for (const surface of entry.surfaces) {
      const key = surface.toLowerCase();
      const list = counts.get(key) ?? [];
      list.push(entry.programId);
      counts.set(key, list);
    }
  }
  return [...counts.entries()]
    .filter(([, programs]) => programs.length > 1)
    .map(([label, programs]) => ({
      label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      programs,
      count: programs.length,
    }))
    .sort((a, b) => b.count - a.count);
}

/** REAL-091 — Mission Home dashboard duplication review via PROGRAM_CATALOG surfaces. */
export function buildCommandCenterPolish(
  workspaceId: string,
  companyId: string,
): CommandCenterPolish {
  const parsed = parseDashboardSurfaces();
  const duplicates = findDuplicateSurfaces(parsed);
  const missionHomePrograms = parsed.filter((p) =>
    p.surfaces.some((s) => s.toLowerCase().includes("mission home")),
  );

  const items: ReviewItem[] = [];

  for (const dup of duplicates.slice(0, 8)) {
    const isMissionHome = dup.label.toLowerCase().includes("mission home");
    items.push({
      itemId: `dup-${dup.label.replace(/\s+/g, "-").toLowerCase()}`,
      label: isMissionHome ? "Nav hierarchy — Mission Home anchor" : `Duplicate card: ${dup.label}`,
      score: isMissionHome ? 55 : Math.max(40, 100 - dup.count * 8),
      status: isMissionHome ? "PENDING" : dup.count >= 4 ? "BLOCKED" : "PENDING",
      recommendation: isMissionHome
        ? "Keep Mission Home as single entry — nest program dashboards under collapsible sections"
        : `Consolidate "${dup.label}" into one canonical surface; link from Mission Home`,
      evidence: `Appears in ${dup.count} programs: ${dup.programs.join(", ")}`,
      why: "Duplicate cards confuse Founder daily workflow and slow Grand King operational triage",
    });
  }

  const commandCenterOverlap = FRONTEND_PAGE_REGISTRY.filter(
    (p) => p.route.includes("command") || p.title.toLowerCase().includes("command"),
  );
  items.push({
    itemId: "nav-command-centers",
    label: "Nav improvement — command center routes",
    score: commandCenterOverlap.length > 2 ? 50 : 75,
    status: commandCenterOverlap.length > 2 ? "PENDING" : "READY",
    recommendation: "Merge /dashboard and /dashboard/command under Mission Home with tab hierarchy",
    evidence: `${commandCenterOverlap.length} command routes: ${commandCenterOverlap.map((p) => p.route).join(", ")}`,
    why: "Multiple command surfaces fragment CEO visibility before SUCCESS-001",
  });

  const backendDashboardCount = DASHBOARD_SOURCES.length;
  const frontendPageCount = FRONTEND_PAGE_REGISTRY.filter((p) => p.navSection !== "public").length;
  items.push({
    itemId: "hierarchy-backend-frontend",
    label: "Hierarchy fix — backend vs frontend dashboard count",
    score: backendDashboardCount > frontendPageCount + 5 ? 45 : 70,
    status: backendDashboardCount > frontendPageCount + 5 ? "PENDING" : "READY",
    recommendation: "Map each DASHBOARD_SOURCES entry to a Mission Home card or deprecate orphan API dashboards",
    evidence: `${backendDashboardCount} backend dashboards vs ${frontendPageCount} routed frontend pages`,
    why: "Orphan backend dashboards inflate perceived completeness without Founder-facing UX",
  });

  for (const entry of parsed.slice(0, 6)) {
    items.push({
      itemId: `surface-${entry.programId}`,
      label: `${entry.name} — dashboard surface audit`,
      score: entry.surfaces.length > 3 ? 60 : 85,
      status: entry.surfaces.length > 3 ? "PENDING" : "READY",
      recommendation: entry.surfaces.length > 3
        ? `Reduce ${entry.name} to ≤2 surfaces linked from Mission Home`
        : "Surface count acceptable — maintain single canonical entry",
      evidence: entry.surfaces.join(" · "),
      why: "PROGRAM_CATALOG dashboardSurface defines Mission Home card inventory for Founder navigation",
    });
  }

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  const blockedCount = items.filter((i) => i.status === "BLOCKED").length;

  return {
    moduleId: "command-center-polish",
    missionId: "REAL-091",
    workspaceId,
    companyId,
    summary: `REAL-091 — ${missionHomePrograms.length}/${PROGRAM_CATALOG.length} programs anchor Mission Home · ${duplicates.length} duplicate surfaces · ${blockedCount} blocked polish items`,
    items,
    reusedModules: ["master-completion-ledger", "empire-self-inspection"],
    architectureComplete: blockedCount === 0 && avgScore >= 70,
    computedAt: new Date().toISOString(),
  };
}
