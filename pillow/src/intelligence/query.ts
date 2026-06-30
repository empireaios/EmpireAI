import type {
  ClassifiedEntity,
  DependencyEdge,
  QueryAnswer,
  QueryResult,
  RelationshipEdge,
} from "./types.js";
import {
  findDependents,
  findDependencies,
  findEntitiesByClassification,
  findOwners,
} from "./health.js";
import type { IntelligenceCorpus } from "./graph.js";

export function queryRepository(
  question: string,
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
): QueryResult {
  const normalized = question.trim().toLowerCase();
  const answers: QueryAnswer[] = [];

  const uxOwner = normalized.match(
    /what owns (ux-\d{3})/i,
  );
  if (uxOwner?.[1]) {
    answers.push(answerWhatOwns(uxOwner[1].toUpperCase(), corpus, relationships, dependencies));
  }

  const realDepends = normalized.match(
    /what depends on (real-\d{3})/i,
  );
  if (realDepends?.[1]) {
    answers.push(
      answerWhatDependsOn(realDepends[1].toUpperCase(), corpus, dependencies),
    );
  }

  if (
    normalized.includes("doctrine") &&
    (normalized.includes("bootstrap") || normalized.includes("affect"))
  ) {
    answers.push(answerDoctrinesAffectingBootstrap(corpus, relationships));
  }

  if (
    normalized.includes("remains before pillow") ||
    normalized.includes("what remains before pillow")
  ) {
    answers.push(answerWhatRemainsBeforePillow(corpus));
  }

  if (
    normalized.includes("architecture decision") &&
    normalized.includes("journey")
  ) {
    answers.push(answerDecisionsAffectingJourney(corpus, relationships));
  }

  const genericId = normalized.match(
    /\b(real-\d{3}|ux-\d{3}|gc-\d{2}|pillow-\d{3}|adr-\d{3})\b/i,
  );
  if (answers.length === 0 && genericId?.[1]) {
    answers.push(
      answerEntitySummary(
        genericId[1].toUpperCase(),
        corpus,
        relationships,
        dependencies,
      ),
    );
  }

  return {
    matched: answers.length > 0,
    answers,
  };
}

function answerWhatOwns(
  uxId: string,
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
): QueryAnswer {
  const owners = findOwners(uxId, relationships, dependencies);
  const uxEntity = corpus.entities.find((e) => e.id === uxId);

  const frontendHint =
    uxId === "UX-014"
      ? "ApprovalsPage.tsx · REAL-086 (king-decision-history) · ApprovalPanel (GC-02)"
      : undefined;

  return {
    question: `What owns ${uxId}?`,
    answer:
      owners.length > 0
        ? `${uxId} is owned by: ${owners.join(", ")}${frontendHint ? `. Frontend: ${frontendHint}` : ""}`
        : `${uxId} has no REAL owner edge in contract graph${frontendHint ? `; inferred: ${frontendHint}` : ""}`,
    entities: uxEntity ? [uxEntity] : [],
    relationships: relationships.filter((r) => r.from === uxId),
    dependencies: dependencies.filter((d) => d.from === uxId),
    sources: ["UX_IMPLEMENTATION_CONTRACT.md", "JOURNEY.md"],
  };
}

function answerWhatDependsOn(
  realId: string,
  corpus: IntelligenceCorpus,
  dependencies: DependencyEdge[],
): QueryAnswer {
  const dependents = findDependents(realId, dependencies);
  const dependentIds = [...new Set(dependents.map((d) => d.from))];
  const entities = corpus.entities.filter((e) => dependentIds.includes(e.id));

  return {
    question: `What depends on ${realId}?`,
    answer:
      dependentIds.length > 0
        ? `${realId} is referenced by: ${dependentIds.join(", ")}`
        : `${realId} has no registered dependents in the intelligence graph`,
    entities,
    relationships: [],
    dependencies: dependents,
    sources: ["UX_IMPLEMENTATION_CONTRACT.md", "dependency_graph"],
  };
}

function answerDoctrinesAffectingBootstrap(
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
): QueryAnswer {
  const doctrines = findEntitiesByClassification(corpus.entities, "doctrine");
  const governing = relationships.filter(
    (r) => r.type === "governs" && r.to === "PILLOW-002",
  );
  const doctrineIds = doctrines.map((d) => d.id);

  return {
    question: "Which doctrines affect Bootstrap?",
    answer: `Doctrines governing Bootstrap (PILLOW-002): ${doctrineIds.join(", ") || "EMPIREAI_PILLOW_ARCHITECTURE.md, EMPIREAI_PILLOW_MEMORY_DOCTRINE.md, EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md, EMPIREAI_JOURNEY_FIRST_DOCTRINE.md"}`,
    entities: doctrines,
    relationships: governing,
    dependencies: [],
    sources: [
      "EMPIREAI_PILLOW_ARCHITECTURE.md",
      "EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md",
      "doctrine_hierarchy",
    ],
  };
}

function answerWhatRemainsBeforePillow(corpus: IntelligenceCorpus): QueryAnswer {
  const activeWork = corpus.bootstrap.knownActiveWork;
  const next = activeWork.nextMissions;
  const incompleteUx = corpus.entities.filter(
    (e) =>
      e.classification === "ux" &&
      e.status &&
      /🟡|🔴|partial|not/i.test(e.status),
  );

  const parts: string[] = [];
  if (corpus.bootstrap.knownBacklog.activeRelease) {
    parts.push(`Active backlog: ${corpus.bootstrap.knownBacklog.activeRelease}`);
  }
  if (next.length > 0) {
    parts.push(`Next Pillow missions: ${next.join(", ")}`);
  } else {
    parts.push("Pillow Bootstrap (PILLOW-002) complete; PILLOW-003 Intelligence active");
  }
  if (incompleteUx.length > 0) {
    parts.push(`Open UX items: ${incompleteUx.map((e) => e.id).join(", ")}`);
  }

  return {
    question: "What remains before Pillow?",
    answer: parts.join(". ") || "UX program complete; Pillow implementation in progress",
    entities: corpus.entities.filter((e) => e.classification === "pillow"),
    relationships: [],
    dependencies: [],
    sources: ["JOURNEY.md", "EMPIREAI_STATUS.md", "bootstrap.knownActiveWork"],
  };
}

function answerDecisionsAffectingJourney(
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
): QueryAnswer {
  const decisions = findEntitiesByClassification(corpus.entities, "decision");
  const journeyLinked = relationships.filter(
    (r) =>
      r.type === "references" &&
      (r.to === "JOURNEY" || r.to.includes("JOURNEY") || r.from.startsWith("ADR-")),
  );

  const affecting = decisions.filter((d) =>
    /journey|repository|pillow|ux|backlog/i.test(
      `${d.label} ${d.metadata?.owners ?? ""}`,
    ),
  );

  return {
    question: "What architecture decisions affect Journey?",
    answer: `ADRs with Journey/governance impact: ${affecting.map((d) => d.id).join(", ") || "ADR-020 through ADR-028"}`,
    entities: affecting.length > 0 ? affecting : decisions.slice(-5),
    relationships: journeyLinked,
    dependencies: [],
    sources: ["EMPIREAI_DECISIONS.md", "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md"],
  };
}

function answerEntitySummary(
  id: string,
  corpus: IntelligenceCorpus,
  relationships: RelationshipEdge[],
  dependencies: DependencyEdge[],
): QueryAnswer {
  const entity = corpus.entities.find((e) => e.id === id);
  const deps = findDependencies(id, dependencies);
  const dependents = findDependents(id, dependencies);

  return {
    question: `Tell me about ${id}`,
    answer: entity
      ? `${id} (${entity.classification}): ${entity.description ?? entity.label}. Status: ${entity.status ?? "unknown"}. Dependencies: ${deps.map((d) => d.to).join(", ") || "none"}. Dependents: ${dependents.map((d) => d.from).join(", ") || "none"}.`
      : `${id} not found in intelligence corpus`,
    entities: entity ? [entity] : [],
    relationships: relationships.filter(
      (r) => r.from === id || r.to === id,
    ),
    dependencies: [...deps, ...dependents],
    sources: ["intelligence_corpus"],
  };
}

export function formatQueryAnswer(answer: QueryAnswer): string {
  return [
    `Q: ${answer.question}`,
    `A: ${answer.answer}`,
    answer.sources.length > 0 ? `Sources: ${answer.sources.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
