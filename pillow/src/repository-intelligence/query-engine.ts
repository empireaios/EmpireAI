import type {
  RepositoryKnowledgeModel,
  RepositoryKnowledgeQueryAnswer,
  RepositoryKnowledgeQueryResult,
} from "./types.js";
import { findModuleByKeyword, findScreenByKeyword } from "./code-indexer.js";

/**
 * Phase 2 repository question answering — deterministic engineering queries.
 */
export function queryRepositoryKnowledge(
  question: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryResult {
  const normalized = question.trim().toLowerCase();
  const answers: RepositoryKnowledgeQueryAnswer[] = [];

  if (
    normalized.includes("where is") &&
    (normalized.includes("implement") || normalized.includes("defined"))
  ) {
    answers.push(answerWhereImplemented(normalized, model));
  }

  if (normalized.includes("who owns") || normalized.includes("owner of")) {
    answers.push(answerWhoOwns(normalized, model));
  }

  if (
    normalized.includes("which mission") ||
    normalized.includes("which pillow") ||
    normalized.includes("introduced")
  ) {
    answers.push(answerMissionIntroduced(normalized, model));
  }

  if (
    normalized.includes("which file renders") ||
    normalized.includes("what file renders") ||
    normalized.includes("renders this screen")
  ) {
    answers.push(answerScreenRenderer(normalized, model));
  }

  if (normalized.includes("what depends on") || normalized.includes("depends on")) {
    answers.push(answerDependsOn(normalized, model));
  }

  if (
    normalized.includes("what happens if") ||
    normalized.includes("what breaks if")
  ) {
    answers.push(answerChangeImpact(normalized, model));
  }

  if (
    normalized.includes("how does") &&
    (normalized.includes("runtime") ||
      normalized.includes("flow") ||
      normalized.includes("deploy") ||
      normalized.includes("startup") ||
      normalized.includes("request"))
  ) {
    answers.push(answerRuntimeFlow(normalized, model));
  }

  if (
    normalized.includes("architecture") ||
    normalized.includes("system boundary") ||
    normalized.includes("frontend/backend")
  ) {
    answers.push(answerArchitectureOverview(model));
  }

  if (answers.length === 0) {
    const keyword = extractKeyword(normalized);
    if (keyword) {
      answers.push(answerKeywordSearch(keyword, model));
    }
  }

  return {
    matched: answers.length > 0 && answers.some((a) => a.answer.length > 0),
    answers: answers.filter((a) => a.answer.length > 0),
  };
}

export function formatRepositoryKnowledgeAnswer(
  result: RepositoryKnowledgeQueryResult,
): string | null {
  if (!result.matched || result.answers.length === 0) return null;
  return result.answers
    .map((a) => `${a.answer}\nSources: ${a.sources.join(", ")}`)
    .join("\n\n");
}

function answerWhereImplemented(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const keyword = extractKeyword(normalized) ?? "pillow";
  const modules = findModuleByKeyword(model.modules, keyword);
  const boundaries = model.architecture.filter(
    (b) =>
      b.name.toLowerCase().includes(keyword) ||
      b.id.includes(keyword) ||
      b.rootPath.toLowerCase().includes(keyword),
  );

  const paths = [
    ...modules.map((m) => m.rootPath),
    ...boundaries.map((b) => b.rootPath),
  ];

  return {
    question: "Where is this implemented?",
    answer:
      paths.length > 0
        ? `${keyword} is implemented under: ${[...new Set(paths)].join(", ")}. Primary owner: ${modules[0]?.owner ?? boundaries[0]?.owner ?? "see architecture registry"}.`
        : `No indexed module matched "${keyword}". Check backend/src/orchestration/ or empireai-web/lib/.`,
    sources: paths.slice(0, 5),
    confidence: paths.length > 0 ? "high" : "medium",
  };
}

function answerWhoOwns(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const keyword = extractKeyword(normalized) ?? "pillow";
  const boundary = model.architecture.find(
    (b) => b.id.includes(keyword) || b.name.toLowerCase().includes(keyword),
  );
  const module = findModuleByKeyword(model.modules, keyword)[0];

  const owner = boundary?.owner ?? module?.owner ?? "Repository Governance";
  const path = boundary?.rootPath ?? module?.rootPath ?? "unknown";

  return {
    question: "Who owns this module?",
    answer: `${keyword} is owned by ${owner} at ${path}. Responsibilities: ${(boundary?.responsibilities ?? []).slice(0, 2).join("; ") || module?.name || "see EMPIREAI_REPOSITORY_MASTER_INDEX.md"}.`,
    sources: [path, "pillow/src/repository-intelligence/architecture-registry.ts"],
    confidence: boundary || module ? "high" : "medium",
  };
}

function answerMissionIntroduced(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const missionMatch = normalized.match(/pillow-\d{3}|real-\d{3}|ux-\d{3}|scr-\d{3}/i);
  const mission = missionMatch?.[0]?.toUpperCase() ?? "PILLOW-016";

  const hints: Record<string, string> = {
    "PILLOW-002": "Repository Bootstrap — pillow/src/bootstrap/",
    "PILLOW-003": "Repository Intelligence — pillow/src/intelligence/",
    "PILLOW-004": "Context Builder — pillow/src/context/",
    "PILLOW-016": "Pillow Host + OpenAI layer — backend/src/orchestration/pillow-host/",
    "SCR-800": "Development Pillow Chat — empireai-web/components/cockpit/development/",
  };

  const path = hints[mission] ?? "JOURNEY.md and PILLOW_ARCHITECTURE_CONTRACT.md";

  return {
    question: "Which mission introduced this?",
    answer: `${mission} is documented in JOURNEY.md and implemented near ${path}. Cross-reference JOURNEY_AUDIT.md for acceptance history.`,
    sources: ["JOURNEY.md", "JOURNEY_AUDIT.md", path],
    confidence: hints[mission] ? "high" : "medium",
  };
}

function answerScreenRenderer(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const routeMatch = normalized.match(/\/cockpit[\w-/]*/);
  const keyword = routeMatch?.[0] ?? "pillow";
  const screens = findScreenByKeyword(model.screens, keyword.replace("/", ""));

  const screen =
    screens[0] ??
    model.screens.find((s) => s.route.includes("pillow")) ??
    model.screens[0];

  return {
    question: "Which file renders this screen?",
    answer: screen
      ? `Route ${screen.route} is rendered by ${screen.componentPath} (${screen.description}).`
      : "Screen registry not matched — check empireai-web/app/cockpit/ for route files.",
    sources: screen ? [screen.componentPath] : ["empireai-web/app/cockpit/"],
    confidence: screen ? "high" : "medium",
  };
}

function answerDependsOn(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const keyword = extractKeyword(normalized) ?? "brain";
  const deps = model.dependencies.filter(
    (d) => d.from.includes(keyword) || d.to.includes(keyword),
  );

  const targets = deps.map((d) => `${d.from} → ${d.to} (${d.kind}${d.critical ? ", critical" : ""})`);

  return {
    question: "What depends on this service?",
    answer:
      targets.length > 0
        ? `Dependency edges for ${keyword}: ${targets.join("; ")}.`
        : `${keyword} has no explicit edge — check architecture-registry dependsOn fields.`,
    sources: ["pillow/src/repository-intelligence/architecture-registry.ts"],
    confidence: targets.length > 0 ? "high" : "medium",
  };
}

function answerChangeImpact(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const keyword = extractKeyword(normalized) ?? "brain";
  const dependents = model.dependencies.filter((d) => d.to.includes(keyword));
  const critical = dependents.filter((d) => d.critical);

  return {
    question: "What happens if this changes?",
    answer:
      dependents.length > 0
        ? `Changing ${keyword} affects: ${dependents.map((d) => d.from).join(", ")}. Critical paths: ${critical.map((d) => d.from).join(", ") || "none flagged"}. Run backend typecheck and Pillow bootstrap self-assessment after changes.`
        : `Impact of changing ${keyword} requires manual review — check imports and deployment/MANAGED_DEPLOYMENT.md.`,
    sources: ["pillow/src/repository-intelligence/code-indexer.ts", "deployment/MANAGED_DEPLOYMENT.md"],
    confidence: dependents.length > 0 ? "high" : "medium",
  };
}

function answerRuntimeFlow(
  normalized: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  let flow = model.runtimeFlows.find((f) => f.id === "request-flow");
  if (normalized.includes("pillow") || normalized.includes("chat")) {
    flow = model.runtimeFlows.find((f) => f.id === "pillow-chat-flow");
  } else if (normalized.includes("deploy")) {
    flow = model.runtimeFlows.find((f) => f.id === "deploy-flow");
  } else if (normalized.includes("startup") || normalized.includes("bootstrap")) {
    flow = model.runtimeFlows.find((f) => f.id === "startup-flow");
  } else if (normalized.includes("recover")) {
    flow = model.runtimeFlows.find((f) => f.id === "recovery-flow");
  }

  const steps = flow?.steps.map((s) => `${s.order}. ${s.component}: ${s.description}`).join("\n") ?? "";

  return {
    question: "How does this runtime work?",
    answer: flow
      ? `${flow.name}:\n${steps}`
      : "See deployment/MANAGED_DEPLOYMENT.md and PILLOW_ARCHITECTURE_CONTRACT.md for runtime architecture.",
    sources: ["pillow/src/repository-intelligence/runtime-flows.ts"],
    confidence: flow ? "high" : "medium",
  };
}

function answerArchitectureOverview(
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const layers = [...new Set(model.architecture.map((b) => `${b.name} (${b.layer})`))];
  return {
    question: "Architecture overview",
    answer: `EmpireAI layers: ${layers.join("; ")}. Frontend Cockpit (Vercel) → BFF → Brain (Railway) → Pillow in-process → Redis/Workers/SQLite. Governance knowledge lives in root *.md and backend/.pillow-governance-bundle on Railway.`,
    sources: [
      "PILLOW_ARCHITECTURE_CONTRACT.md",
      "pillow/src/repository-intelligence/architecture-registry.ts",
    ],
    confidence: "high",
  };
}

function answerKeywordSearch(
  keyword: string,
  model: RepositoryKnowledgeModel,
): RepositoryKnowledgeQueryAnswer {
  const modules = findModuleByKeyword(model.modules, keyword);
  const screens = findScreenByKeyword(model.screens, keyword);

  return {
    question: `Search: ${keyword}`,
    answer:
      modules.length > 0 || screens.length > 0
        ? `Found modules: ${modules.map((m) => m.rootPath).join(", ") || "none"}. Screens: ${screens.map((s) => s.route).join(", ") || "none"}.`
        : "",
    sources: modules.map((m) => m.rootPath).slice(0, 3),
    confidence: "medium",
  };
}

function extractKeyword(normalized: string): string | null {
  const quoted = normalized.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1].toLowerCase();

  const patterns = [
    /(?:where is|who owns|depends on|what happens if|how does)\s+(?:the\s+)?([a-z0-9/_-]+)/i,
    /\b(pillow-host|pillow|brain|cockpit|redis|worker|railway|vercel|bff|registry|automation)\b/i,
    /\b(development\/pillow|global-assistant|context-builder)\b/i,
  ];

  for (const p of patterns) {
    const m = normalized.match(p);
    if (m?.[1]) return m[1].toLowerCase();
  }

  return null;
}
