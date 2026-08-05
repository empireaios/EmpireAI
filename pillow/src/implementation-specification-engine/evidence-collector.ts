import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { nextSpecificationId } from "./audit-store.js";
import { ISENG_METADATA_VERSION } from "./paths.js";
import type { ImplementationSpecificationEngineDependencies } from "./integrations.js";
import type {
  DependencyDiscoverySummary,
  ImplementationSpecification,
  IsengInput,
  ParsedRoadmapMission,
  PreservationSummary,
  RepositoryArchitectureSummary,
} from "./types.js";

const EVIDENCE_DOC_SUFFIXES = ["CERTIFICATION_PACK.md", "IMPLEMENTATION_REPORT.md", "EXAMPLE"] as const;

export function parseApprovedRoadmapMission(
  input: IsengInput,
  repositoryRoot: string,
): ParsedRoadmapMission {
  const missionId = input.missionId?.trim() || "Q13-01";
  const missionName = input.missionName?.trim() || "Implementation Specification Engine";
  const programme = input.programme?.trim() || "Q-Series";
  const evidenceSources: string[] = [];
  const evidence: string[] = [];

  if (input.missionId?.trim()) evidence.push(`explicit_input:missionId=${input.missionId.trim()}`);
  if (input.missionName?.trim()) evidence.push(`explicit_input:missionName=${input.missionName.trim()}`);
  if (input.programme?.trim()) evidence.push(`explicit_input:programme=${input.programme.trim()}`);

  let repositoryEvidenceFound = false;
  const auditsRoot = join(repositoryRoot, "docs", "audits", "pillow");
  if (existsSync(auditsRoot)) {
    const auditEvidence = scanAuditEvidence(auditsRoot, missionId);
    if (auditEvidence.length > 0) {
      repositoryEvidenceFound = true;
      evidenceSources.push(...auditEvidence.map((e) => e.path));
      evidence.push(...auditEvidence.map((e) => e.ref));
    }
  }

  if (!input.missionId?.trim() && !repositoryEvidenceFound) {
    evidence.push("default_mission_Q13-01_from_engine_scope_only");
  }

  return {
    parsedAt: new Date().toISOString(),
    missionId,
    missionName,
    programme,
    evidenceSources,
    repositoryEvidenceFound,
    evidence,
  };
}

function scanAuditEvidence(
  dir: string,
  missionId: string,
  depth = 0,
): Array<{ path: string; ref: string }> {
  if (depth > 4) return [];
  const found: Array<{ path: string; ref: string }> = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (entry.toLowerCase().includes(missionId.toLowerCase().replace(/-/g, "-"))) {
        found.push(...scanAuditEvidence(full, missionId, depth + 1));
      } else {
        found.push(...scanAuditEvidence(full, missionId, depth + 1));
      }
    } else if (stat.isFile()) {
      const name = entry.toUpperCase();
      if (
        EVIDENCE_DOC_SUFFIXES.some((suffix) => name.includes(suffix.replace(".MD", "").toUpperCase())) ||
        name.endsWith(".JSON")
      ) {
        if (full.includes(missionId.replace(/-/g, "-")) || full.toLowerCase().includes("q13-01")) {
          found.push({ path: full, ref: `audit_evidence:${entry}` });
        }
      }
    }
  }
  return found;
}

export function analyseRepositoryArchitecture(
  repositoryRoot: string,
  deps: ImplementationSpecificationEngineDependencies,
  scanRoots: string[],
): RepositoryArchitectureSummary {
  const engineModules: string[] = [];
  const runtimeModules: string[] = [];
  let moduleCount = 0;

  for (const root of scanRoots) {
    const abs = join(repositoryRoot, root);
    if (!existsSync(abs)) continue;
    const modules = listModuleDirs(abs, root);
    moduleCount += modules.length;
    for (const mod of modules) {
      if (mod.includes("-engine") || mod.includes("-factory") || mod.includes("runtime")) {
        if (mod.includes("runtime") || mod.includes("-runtime")) {
          runtimeModules.push(mod);
        } else {
          engineModules.push(mod);
        }
      }
    }
  }

  const intelligence = deps.intelligenceContext;
  const injectedIntelligenceAvailable = Boolean(intelligence?.getSnapshot || intelligence?.getState);

  const factories = deps.sharedRuntimeCore?.listFactories?.() ?? [];
  const workers = deps.workerRegistry?.listWorkers?.() ?? deps.workerRegistry?.getWorkers?.() ?? [];
  const topology = deps.pillowOrchestrationRuntime?.getTopology?.() as { workflows?: unknown[] } | undefined;
  const orchestrationWorkflows = topology?.workflows?.length ?? 0;

  const evidence = [
    `read_only_scan:moduleCount=${moduleCount}`,
    `read_only_scan:engineModules=${engineModules.length}`,
    `read_only_scan:runtimeModules=${runtimeModules.length}`,
    injectedIntelligenceAvailable ? "intelligenceContext_injected" : "intelligenceContext_not_injected",
    `sharedRuntimeCore_factories=${factories.length}`,
    `workerRegistry_workers=${workers.length}`,
    `pillowOrchestrationRuntime_workflows=${orchestrationWorkflows}`,
    "never_fabricate_repository_state=true",
  ];

  return {
    computedAt: new Date().toISOString(),
    scannedRoots: scanRoots.filter((r) => existsSync(join(repositoryRoot, r))),
    moduleCount,
    engineModules: engineModules.slice(0, 20),
    runtimeModules: runtimeModules.slice(0, 20),
    injectedIntelligenceAvailable,
    sharedRuntimeFactories: factories.length,
    workerCount: workers.length,
    orchestrationWorkflows,
    evidence,
  };
}

function listModuleDirs(absRoot: string, relRoot: string, depth = 0): string[] {
  if (depth > 2) return [];
  const modules: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(absRoot);
  } catch {
    return modules;
  }
  for (const entry of entries) {
    const full = join(absRoot, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules" && entry !== "validation") {
      modules.push(`${relRoot}/${entry}`);
      if (depth < 1) {
        modules.push(...listModuleDirs(full, `${relRoot}/${entry}`, depth + 1));
      }
    }
  }
  return modules;
}

export function discoverImplementationDependencies(
  repositoryRoot: string,
  mission: ParsedRoadmapMission,
  architecture: RepositoryArchitectureSummary,
  deps: ImplementationSpecificationEngineDependencies,
): DependencyDiscoverySummary {
  const dependencies: Array<{ dependency: string; source: string; evidence: string }> = [];
  const sessionWiringPatterns: string[] = [];
  const injectedHandles: string[] = [];

  if (deps.aiInnovationFactory) {
    injectedHandles.push("aiInnovationFactory");
    dependencies.push({
      dependency: "aiInnovationFactory.getQ1301ConsumableContract",
      source: "session_wiring",
      evidence: "Q13-01 consumes Q1301 innovation prerequisite from Q12-01",
    });
  }
  if (deps.qSeriesCompletion) {
    injectedHandles.push("qSeriesCompletion");
    sessionWiringPatterns.push("qSeriesCompletion→implementationSpecificationEngine");
  }
  if (deps.sharedRuntimeCore) {
    injectedHandles.push("sharedRuntimeCore");
    dependencies.push({
      dependency: "sharedRuntimeCore.listFactories",
      source: "integration_inventory",
      evidence: `factories=${architecture.sharedRuntimeFactories}`,
    });
  }
  if (deps.workerRegistry) {
    injectedHandles.push("workerRegistry");
    dependencies.push({
      dependency: "workerRegistry.listWorkers",
      source: "integration_inventory",
      evidence: `workers=${architecture.workerCount}`,
    });
  }
  if (deps.pillowOrchestrationRuntime) {
    injectedHandles.push("pillowOrchestrationRuntime");
    sessionWiringPatterns.push("pillowOrchestrationRuntime→topology");
  }
  if (deps.executiveReportingRuntime) {
    injectedHandles.push("executiveReportingRuntime");
    dependencies.push({
      dependency: "executiveReportingRuntime.submitWorkerReport",
      source: "session_wiring",
      evidence: "report submission path",
    });
  }

  const configPath = join(repositoryRoot, "config", "implementation-specification-engine.config.json");
  if (existsSync(configPath)) {
    dependencies.push({
      dependency: "config/implementation-specification-engine.config.json",
      source: "repository_scan",
      evidence: "configuration file present",
    });
  }

  const enginePath = join(repositoryRoot, "pillow/src/implementation-specification-engine");
  if (existsSync(enginePath)) {
    dependencies.push({
      dependency: "pillow/src/implementation-specification-engine",
      source: "repository_scan",
      evidence: `mission=${mission.missionId} self-module present`,
    });
  }

  const evidence = [
    `dependency_count=${dependencies.length}`,
    `session_wiring_patterns=${sessionWiringPatterns.length}`,
    `injected_handles=${injectedHandles.length}`,
    "import_pattern_analysis=read_only",
  ];

  return {
    computedAt: new Date().toISOString(),
    dependencies,
    sessionWiringPatterns,
    injectedHandles,
    evidence,
  };
}

export function detectExistingImplementationsToPreserve(
  repositoryRoot: string,
  mission: ParsedRoadmapMission,
  architecture: RepositoryArchitectureSummary,
): PreservationSummary {
  const preservedImplementations: Array<{ module: string; reason: string; evidence: string }> = [];

  for (const mod of architecture.engineModules) {
    if (mod.includes("implementation-specification-engine")) continue;
    if (mod.includes("-engine") || mod.includes("-factory")) {
      preservedImplementations.push({
        module: mod,
        reason: "verified_engine_module",
        evidence: "read_only_scan:existing_engine_never_overwrite",
      });
    }
  }

  for (const mod of architecture.runtimeModules) {
    preservedImplementations.push({
      module: mod,
      reason: "verified_runtime_module",
      evidence: "read_only_scan:existing_runtime_never_overwrite",
    });
  }

  if (existsSync(join(repositoryRoot, "pillow/src/repository-intelligence-engine"))) {
    preservedImplementations.push({
      module: "pillow/src/repository-intelligence-engine",
      reason: "q1302_downstream_module_preserve",
      evidence: "Q13-02 RIENG present — ISENG never implements or overwrites",
    });
  }

  if (existsSync(join(repositoryRoot, "pillow/src/ai-innovation-factory"))) {
    preservedImplementations.push({
      module: "pillow/src/ai-innovation-factory",
      reason: "q1301_prerequisite_module_preserve",
      evidence: `mission=${mission.missionId} consumes AIFRT Q1301 contract only`,
    });
  }

  return {
    computedAt: new Date().toISOString(),
    preservedImplementations: preservedImplementations.slice(0, 30),
    neverOverwrite: true,
    evidence: [
      `preserved_count=${preservedImplementations.length}`,
      "neverOverwriteVerifiedImplementations=true",
      "never_execute_implementations=true",
    ],
  };
}

export function generateImplementationSpecification(
  mission: ParsedRoadmapMission,
  architecture: RepositoryArchitectureSummary,
  dependencies: DependencyDiscoverySummary,
  preservation: PreservationSummary,
  q1301Fields: string[],
): ImplementationSpecification {
  const now = new Date().toISOString();
  const specificationId = nextSpecificationId();

  const repositoryFindings = [
    ...architecture.evidence,
    ...mission.evidence,
  ];

  const dependencyList = dependencies.dependencies.map((d) => d.dependency);

  const architectureSummary = [
    `Scanned ${architecture.scannedRoots.length} roots with ${architecture.moduleCount} modules`,
    `${architecture.engineModules.length} engine modules, ${architecture.runtimeModules.length} runtime modules`,
    `Shared runtime factories: ${architecture.sharedRuntimeFactories}, workers: ${architecture.workerCount}`,
  ].join("; ");

  const filesExpected = [
    "pillow/src/implementation-specification-engine/",
    "config/implementation-specification-engine.config.json",
    "docs/governance/EMPIREAI_IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM.md",
    "docs/audits/pillow/q13-01-implementation-specification-engine/",
    "pillow/src/validation/tests/implementation-specification-engine.test.ts",
  ];

  const requiredCapabilities = [
    "parse_approved_roadmap_mission",
    "analyse_repository_architecture",
    "discover_implementation_dependencies",
    "detect_existing_implementations_to_preserve",
    "generate_implementation_specification",
    "produce_implementation_specification_report",
    "consume_q1301_consumable_contract",
    "expose_q1302_consumable_contract",
  ];

  const validationPlan = [
    "Run implementation-specification-engine.test.ts (12 tests)",
    "Regression: ai-innovation-factory.test.ts unchanged",
    "Verify neverExecuteImplementations boundary",
    "Verify Q1302 contract without implementing Q13-02",
  ];

  const integrationPlan = [
    "Wire session after aiInnovationFactory",
    "Bind aiInnovationFactory, qSeriesCompletion, executiveReportingRuntime, auditRuntime, pillowOrchestrationRuntime",
    "Optional: intelligenceContext, sharedRuntimeCore, workerRegistry",
    "Expose /api/pillow/implementation-specification-engine/* routes",
  ];

  const risks = [
    { risk: "Fabricated repository state", level: "critical", mitigation: "neverFabricateRepositoryState=true; read-only scans only" },
    { risk: "Overwrite verified implementations", level: "critical", mitigation: "preservation detection + neverOverwriteVerifiedImplementations" },
    { risk: "Premature Q13-02 implementation", level: "high", mitigation: "neverImplementQ1302OrLater=true; contract only" },
  ];

  const constraints = [
    "Specification only — never execute implementations",
    "Never auto-deploy",
    "Never bypass Pillow/Grand King governance",
    "Immutable specification history",
  ];

  const governanceRequirements = [
    "Pillow command confirmation required for report production",
    "Grand King locks preserved",
    `Q1301 innovation prerequisite fields consumed: ${q1301Fields.length}`,
    "Q1302 contract emitted without implementing Repository Intelligence Engine",
  ];

  return {
    specificationId,
    programme: mission.programme,
    missionId: mission.missionId,
    missionName: mission.missionName,
    repositoryFindings,
    dependencies: dependencyList,
    architectureSummary,
    filesExpected,
    requiredCapabilities,
    validationPlan,
    integrationPlan,
    risks,
    constraints,
    governanceRequirements,
    version: ISENG_METADATA_VERSION,
    timestamp: now,
  };
}

export function buildRiskSummary(
  preservation: PreservationSummary,
  validationDecision: "pass" | "partial" | "fail",
): Array<{ risk: string; level: string; mitigation: string }> {
  const risks = [
    { risk: "Fabricated repository state", level: "critical", mitigation: "read-only evidence only" },
    { risk: "Overwrite verified implementations", level: "critical", mitigation: `${preservation.preservedImplementations.length} modules marked preserve` },
  ];
  if (validationDecision === "fail") {
    risks.push({ risk: "Boundary violation", level: "critical", mitigation: "report rejected" });
  }
  return risks;
}

export function computeConfidenceScore(
  q1301Consumed: boolean,
  specificationCount: number,
  validationDecision: "pass" | "partial" | "fail",
): number {
  if (validationDecision === "fail") return 0;
  let score = 0.4;
  if (q1301Consumed) score += 0.25;
  if (specificationCount > 0) score += 0.2;
  if (validationDecision === "pass") score += 0.15;
  return Math.min(1, Math.round(score * 100) / 100);
}

export function readConfigEvidence(repositoryRoot: string): string[] {
  const path = join(repositoryRoot, "config", "implementation-specification-engine.config.json");
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf8");
    return [`config_evidence:${raw.length}_bytes`];
  } catch {
    return [];
  }
}
