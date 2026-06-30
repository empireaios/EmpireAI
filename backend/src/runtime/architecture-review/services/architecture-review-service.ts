import path from "node:path";
import {
  BACKEND_SRC,
  listDirectories,
} from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { ArchitectureReview } from "../models/architecture-review.js";

type ReviewItem = ArchitectureReview["items"][number];

const DUPLICATE_INTELLIGENCE_PAIRS = [
  { canonical: "supplier-intelligence", duplicate: "intelligence/supplier-intelligence", label: "Supplier intelligence dual tree" },
  { canonical: "global-commerce-intelligence", duplicate: "runtime/global-commerce-intelligence", label: "GCI runtime vs intelligence split" },
  { canonical: "commerce-intelligence-studio", duplicate: "runtime/commerce-intelligence-studio", label: "CIS module placement" },
];

const INTELLIGENCE_SUFFIXES = ["-intelligence", "-engine", "-command"];

function isIntelligenceModule(name: string): boolean {
  return INTELLIGENCE_SUFFIXES.some((s) => name.includes(s));
}

function findCatalogDrift(
  runtimeModules: string[],
  ownerModules: string[],
): { orphanRuntime: string[]; missingRuntime: string[] } {
  const ownerSet = new Set(ownerModules);
  const runtimeSet = new Set(runtimeModules);
  const orphanRuntime = runtimeModules.filter(
    (m) => isIntelligenceModule(m) && !ownerSet.has(m),
  ).slice(0, 10);
  const missingRuntime = ownerModules.filter(
    (m) => !runtimeSet.has(m) && !m.includes("/") && m !== "frontend",
  ).slice(0, 10);
  return { orphanRuntime, missingRuntime };
}

/** REAL-095 — Architecture drift review: runtime modules vs PROGRAM_CATALOG ownerModules. */
export function buildArchitectureReview(
  workspaceId: string,
  companyId: string,
): ArchitectureReview {
  const runtimeDir = path.join(BACKEND_SRC, "runtime");
  const runtimeModules = listDirectories(runtimeDir);
  const ownerModules = [...new Set(PROGRAM_CATALOG.flatMap((p) => p.ownerModules))].sort();
  const { orphanRuntime, missingRuntime } = findCatalogDrift(runtimeModules, ownerModules);
  const intelligenceModules = runtimeModules.filter(isIntelligenceModule);

  const items: ReviewItem[] = [];

  items.push({
    itemId: "runtime-inventory",
    label: "Runtime module inventory",
    score: runtimeModules.length >= 80 ? 85 : 70,
    status: "READY",
    recommendation: "Maintain one runtime folder per mission module — register in index.ts",
    evidence: `${runtimeModules.length} runtime directories · ${ownerModules.length} catalog ownerModules`,
    why: "Accurate inventory prevents duplicate intelligence implementations",
  });

  for (const pair of DUPLICATE_INTELLIGENCE_PAIRS) {
    const canonicalExists = listDirectories(BACKEND_SRC).includes(pair.canonical.split("/")[0]!)
      || runtimeModules.includes(pair.canonical);
    const dupPath = pair.duplicate.startsWith("runtime/")
      ? runtimeModules.includes(pair.duplicate.replace("runtime/", ""))
      : listDirectories(path.join(BACKEND_SRC, "intelligence")).includes("supplier-intelligence");
    items.push({
      itemId: `dup-${pair.canonical}`,
      label: pair.label,
      score: dupPath && canonicalExists ? 55 : 80,
      status: dupPath && canonicalExists ? "PENDING" : "READY",
      recommendation: dupPath && canonicalExists
        ? `Consolidate into canonical ${pair.canonical} — mark duplicate as adapter-only`
        : "No duplicate detected — maintain single source of truth",
      evidence: `canonical=${pair.canonical} · duplicatePath=${pair.duplicate}`,
      why: "Duplicate intelligence modules cause drift in scoring, debates, and Mission Home cards",
    });
  }

  if (orphanRuntime.length > 0) {
    items.push({
      itemId: "orphan-intelligence",
      label: "Orphan intelligence modules (not in PROGRAM_CATALOG ownerModules)",
      score: Math.max(40, 90 - orphanRuntime.length * 5),
      status: orphanRuntime.length >= 5 ? "BLOCKED" : "PENDING",
      recommendation: "Add orphan modules to PROGRAM_CATALOG ownerModules or merge into parent program",
      evidence: orphanRuntime.join(", "),
      why: "Unowned modules escape MCL completion tracking and SUCCESS-001 blocker visibility",
    });
  }

  if (missingRuntime.length > 0) {
    items.push({
      itemId: "missing-runtime",
      label: "Catalog ownerModules without runtime folder",
      score: Math.max(45, 85 - missingRuntime.length * 4),
      status: "PENDING",
      recommendation: "Expected for foundation/orchestration modules — document non-runtime placement",
      evidence: missingRuntime.join(", "),
      why: "Distinguishes intentional foundation modules from missing implementations",
    });
  }

  for (const program of PROGRAM_CATALOG.slice(0, 8)) {
    const ownedInRuntime = program.ownerModules.filter((m) => runtimeModules.includes(m));
    const coverage = program.ownerModules.length > 0
      ? Math.round((ownedInRuntime.length / program.ownerModules.length) * 100)
      : 100;
    items.push({
      itemId: `program-${program.programId}`,
      label: `${program.name} — ownerModule runtime coverage`,
      score: coverage,
      status: coverage >= 80 ? "READY" : coverage >= 50 ? "PENDING" : "BLOCKED",
      recommendation: coverage < 80
        ? `Implement or relocate missing ownerModules for ${program.name}`
        : "Runtime coverage aligns with PROGRAM_CATALOG",
      evidence: `${ownedInRuntime.length}/${program.ownerModules.length} in runtime · ${program.dashboardSurface}`,
      why: `${program.name} at ${program.baseCompletionPercent}% — drift blocks accurate freeze assessment`,
    });
  }

  items.push({
    itemId: "intelligence-density",
    label: "Intelligence module density",
    score: intelligenceModules.length > 40 ? 55 : 78,
    status: intelligenceModules.length > 40 ? "PENDING" : "READY",
    recommendation: "Group *-intelligence modules under shared ESIS inspection contracts",
    evidence: `${intelligenceModules.length} intelligence/engine/command modules in runtime`,
    why: "High intelligence module count increases cross-module dependency complexity",
  });

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);

  return {
    moduleId: "architecture-review",
    missionId: "REAL-095",
    workspaceId,
    companyId,
    summary: `REAL-095 — ${runtimeModules.length} runtime modules · ${intelligenceModules.length} intelligence modules · ${orphanRuntime.length} orphans · catalog drift review`,
    items,
    reusedModules: ["empire-self-inspection", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
