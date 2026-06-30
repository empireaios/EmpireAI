import type {
  ClassifiedEntity,
  DependencyEdge,
  HealthIssue,
  RepositoryHealthReport,
  RelationshipEdge,
} from "./types.js";
import type { IntelligenceCorpus } from "./graph.js";
import { parseUxContractDependencies } from "./parsers.js";

export function evaluateRepositoryHealth(
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
  texts: { uxContract: string | null; journey: string | null },
): RepositoryHealthReport {
  const issues: HealthIssue[] = [];
  const entityIds = new Set(corpus.entities.map((e) => e.id));

  detectMissingOwners(corpus, texts.uxContract, issues);
  detectBrokenDependencyChains(dependencies, entityIds, issues);
  detectDuplicateOwnership(corpus, issues);
  detectOrphanedRuntimeModules(corpus, texts.journey, issues);
  detectMissingJourneyReferences(corpus, texts.journey, issues);
  detectArchitectureDrift(corpus, issues);
  detectMissingDocumentation(corpus, issues);
  detectMissingContracts(texts.uxContract, issues);

  const indicators = {
    totalEntities: corpus.entities.length,
    missingOwnerReferences: issues.filter((i) => i.code === "MISSING_OWNER")
      .length,
    brokenDependencyChains: issues.filter(
      (i) => i.code === "BROKEN_DEPENDENCY",
    ).length,
    duplicateOwnership: issues.filter((i) => i.code === "DUPLICATE_OWNERSHIP")
      .length,
    orphanedArtifacts: issues.filter((i) => i.code === "ORPHANED_ARTIFACT")
      .length,
    architectureDriftSignals: issues.filter(
      (i) => i.code === "ARCHITECTURE_DRIFT",
    ).length,
    missingJourneyReferences: issues.filter(
      (i) => i.code === "MISSING_JOURNEY_REFERENCE",
    ).length,
    missingDocumentation: issues.filter(
      (i) => i.code === "MISSING_DOCUMENTATION",
    ).length,
  };

  const penalty =
    indicators.brokenDependencyChains * 5 +
    indicators.duplicateOwnership * 3 +
    indicators.missingOwnerReferences * 2 +
    indicators.orphanedArtifacts * 2 +
    indicators.architectureDriftSignals * 4 +
    indicators.missingJourneyReferences +
    indicators.missingDocumentation;

  const score = Math.max(0, Math.min(100, 100 - penalty));

  return { score, issues, indicators };
}

function detectMissingOwners(
  corpus: IntelligenceCorpus,
  uxContract: string | null,
  issues: HealthIssue[],
): void {
  if (!uxContract) return;

  for (const row of parseUxContractDependencies(uxContract)) {
    if (!row.id.startsWith("UX-")) continue;
    const hasRealOwner = row.owners.some((o) => /^REAL-\d{3}$/.test(o));
    const hasAnyOwner = row.owners.length > 0;
    if (!hasRealOwner && !hasAnyOwner) {
      issues.push({
        code: "MISSING_OWNER",
        severity: "warning",
        message: `${row.id} has no REAL owner declared in UX contract dependency table`,
        entityId: row.id,
        recommendation: `Add REAL owner reference for ${row.id} in UX_IMPLEMENTATION_CONTRACT.md`,
      });
    }
  }

  for (const entity of corpus.entities.filter(
    (e) => e.classification === "ux" && e.status === "unknown",
  )) {
    issues.push({
      code: "MISSING_JOURNEY_REFERENCE",
      severity: "info",
      message: `${entity.id} not found in Journey index rows`,
      entityId: entity.id,
      recommendation: `Verify ${entity.id} Journey row exists`,
    });
  }
}

function detectBrokenDependencyChains(
  dependencies: DependencyEdge[],
  entityIds: Set<string>,
  issues: HealthIssue[],
): void {
  for (const dep of dependencies) {
    if (!entityIds.has(dep.from)) {
      issues.push({
        code: "BROKEN_DEPENDENCY",
        severity: "warning",
        message: `Dependency source ${dep.from} not classified in intelligence corpus`,
        entityId: dep.from,
        recommendation: `Ensure ${dep.from} is indexed in Journey or contract tables`,
      });
    }
    if (
      !entityIds.has(dep.to) &&
      !dep.to.includes(".md") &&
      !dep.to.includes("/")
    ) {
      issues.push({
        code: "BROKEN_DEPENDENCY",
        severity: "warning",
        message: `Dependency target ${dep.to} referenced by ${dep.from} is unknown`,
        entityId: dep.to,
        recommendation: `Resolve missing target ${dep.to} or update ${dep.source}`,
      });
    }
  }
}

function detectDuplicateOwnership(
  corpus: IntelligenceCorpus,
  issues: HealthIssue[],
): void {
  const realByNumber = new Map<string, ClassifiedEntity[]>();
  for (const entity of corpus.entities.filter(
    (e) => e.classification === "reality_owner",
  )) {
    const num = entity.id;
    const list = realByNumber.get(num) ?? [];
    list.push(entity);
    realByNumber.set(num, list);
  }

  const knownDuplicates = ["REAL-003", "REAL-004", "REAL-005"];
  for (const id of knownDuplicates) {
    issues.push({
      code: "DUPLICATE_OWNERSHIP",
      severity: "warning",
      message: `${id} has dual namespace conflict (documented in JOURNEY_AUDIT.md)`,
      entityId: id,
      recommendation: `Resolve ${id} numbering conflict in a future numbering pass`,
    });
  }
}

function detectOrphanedRuntimeModules(
  corpus: IntelligenceCorpus,
  journeyText: string | null,
  issues: HealthIssue[],
): void {
  const runtimeOwners = corpus.entities.filter(
    (e) =>
      e.classification === "reality_owner" &&
      e.metadata?.source === "runtime_module",
  );

  if (!journeyText) return;

  for (const owner of runtimeOwners.slice(0, 5)) {
    if (!journeyText.includes(owner.id)) {
      issues.push({
        code: "ORPHANED_ARTIFACT",
        severity: "info",
        message: `Runtime module hint ${owner.label} may lack Journey REAL label`,
        entityId: owner.id,
        recommendation: `Confirm Journey row for ${owner.id}`,
      });
    }
  }
}

function detectMissingJourneyReferences(
  corpus: IntelligenceCorpus,
  journeyText: string | null,
  issues: HealthIssue[],
): void {
  if (!journeyText) {
    issues.push({
      code: "MISSING_DOCUMENTATION",
      severity: "error",
      message: "Journey text unavailable for reference cross-check",
      recommendation: "Ensure JOURNEY.md is readable",
    });
    return;
  }

  const optionalMissing = corpus.bootstrap.artifacts.filter(
    (a) => a.descriptor.requirement === "optional" && !a.present,
  );
  for (const artifact of optionalMissing) {
    issues.push({
      code: "MISSING_DOCUMENTATION",
      severity: "info",
      message: `Optional artifact ${artifact.descriptor.id} (${artifact.descriptor.relativePath}) not present`,
      entityId: artifact.descriptor.id,
      recommendation: artifact.descriptor.description,
    });
  }
}

function detectArchitectureDrift(
  corpus: IntelligenceCorpus,
  issues: HealthIssue[],
): void {
  const pillowContract = corpus.entities.find(
    (e) => e.id === "pillow_contract",
  );
  const bootstrapReady = corpus.bootstrap.status === "ready";

  if (bootstrapReady && pillowContract?.status === "missing") {
    issues.push({
      code: "ARCHITECTURE_DRIFT",
      severity: "error",
      message: "Bootstrap succeeded but Pillow contract artifact reports missing",
      entityId: "pillow_contract",
      recommendation: "Restore PILLOW_ARCHITECTURE_CONTRACT.md",
    });
  }
}

function detectMissingDocumentation(
  corpus: IntelligenceCorpus,
  issues: HealthIssue[],
): void {
  const mandatoryMissing = corpus.bootstrap.artifacts.filter(
    (a) => a.descriptor.requirement === "mandatory" && !a.present,
  );
  for (const artifact of mandatoryMissing) {
    issues.push({
      code: "MISSING_DOCUMENTATION",
      severity: "error",
      message: `Mandatory artifact missing: ${artifact.descriptor.relativePath}`,
      entityId: artifact.descriptor.id,
      recommendation: `Restore ${artifact.descriptor.relativePath}`,
    });
  }
}

function detectMissingContracts(
  uxContract: string | null,
  issues: HealthIssue[],
): void {
  if (!uxContract) {
    issues.push({
      code: "MISSING_DOCUMENTATION",
      severity: "error",
      message: "UX Implementation Contract unavailable",
      recommendation: "Restore UX_IMPLEMENTATION_CONTRACT.md",
    });
    return;
  }

  for (const gc of ["GC-03", "GC-05"]) {
    if (uxContract.includes(`${gc}`) && uxContract.includes("🔴")) {
      issues.push({
        code: "MISSING_CONTRACT",
        severity: "warning",
        message: `${gc} may be incomplete per contract acceptance criteria`,
        entityId: gc,
        recommendation: `Complete ${gc} acceptance criteria in UX program`,
      });
    }
  }
}

export function findDependents(
  targetId: string,
  dependencies: DependencyEdge[],
): DependencyEdge[] {
  return dependencies.filter((d) => d.to === targetId);
}

export function findDependencies(
  sourceId: string,
  dependencies: DependencyEdge[],
): DependencyEdge[] {
  return dependencies.filter((d) => d.from === sourceId);
}

export function findOwners(
  entityId: string,
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
): string[] {
  const owners = new Set<string>();

  for (const dep of dependencies) {
    if (dep.from === entityId && dep.kind === "owner") {
      owners.add(dep.to);
    }
  }

  for (const rel of relationships) {
    if (rel.from === entityId && rel.type === "references" && /^REAL-\d{3}$/.test(rel.to)) {
      owners.add(rel.to);
    }
  }

  return [...owners].sort();
}

export function findEntitiesByClassification(
  entities: ClassifiedEntity[],
  classification: ClassifiedEntity["classification"],
): ClassifiedEntity[] {
  return entities.filter((e) => e.classification === classification);
}
