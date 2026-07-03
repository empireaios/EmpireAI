import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryKnowledgeModel } from "../repository-intelligence/types.js";
import { findModuleByKeyword } from "../repository-intelligence/code-indexer.js";
import { classifySymptoms } from "./symptom-classifier.js";
import type { SystemDiagnosis } from "./types.js";

export function diagnoseSystemIssue(
  problemDescription: string,
  intelligence: RepositoryIntelligenceContext,
): SystemDiagnosis {
  const classified = classifySymptoms(problemDescription);
  const model = intelligence.knowledgeModel;
  const keywords = extractKeywords(problemDescription);

  const affectedModules = new Set<string>();
  const affectedLayers = new Set<string>();

  for (const keyword of keywords) {
    for (const mod of findModuleByKeyword(model.modules, keyword)) {
      affectedModules.add(mod.rootPath);
      affectedLayers.add(mod.layer);
    }
    for (const boundary of model.architecture) {
      if (
        boundary.id.includes(keyword) ||
        boundary.name.toLowerCase().includes(keyword) ||
        boundary.rootPath.toLowerCase().includes(keyword)
      ) {
        affectedModules.add(boundary.rootPath);
        affectedLayers.add(boundary.layer);
      }
    }
  }

  if (classified.categories.includes("frontend") || classified.categories.includes("api")) {
    affectedModules.add("empireai-web/lib/pillow/client.ts");
    affectedModules.add("empireai-web/app/api/pillow");
    affectedLayers.add("bff");
    affectedLayers.add("frontend");
  }
  if (classified.categories.includes("backend") || classified.categories.includes("runtime")) {
    affectedModules.add("backend/src/orchestration/pillow-host");
    affectedLayers.add("brain");
    affectedLayers.add("pillow");
  }
  if (classified.categories.includes("deployment")) {
    affectedModules.add("deployment/MANAGED_DEPLOYMENT.md");
    affectedModules.add("empireai-web/lib/brain/server-proxy.ts");
    affectedLayers.add("deployment");
  }

  const healthIssues = intelligence.health.issues
    .filter((i) => i.severity === "error" || i.severity === "warning")
    .slice(0, 3)
    .map((i) => i.message);

  const summary = [
    `Detected: ${classified.categories.join(", ")}`,
    `Severity: ${classified.severity}`,
    affectedModules.size > 0
      ? `Likely modules: ${[...affectedModules].slice(0, 5).join(", ")}`
      : null,
    healthIssues.length > 0 ? `Repository health signals: ${healthIssues.join("; ")}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    categories: classified.categories,
    symptoms: classified.symptoms,
    affectedModules: [...affectedModules],
    affectedLayers: [...affectedLayers],
    severity: classified.severity,
    summary,
  };
}

function extractKeywords(text: string): string[] {
  const found = text.toLowerCase().match(
    /\b(pillow|brain|bff|vercel|railway|redis|worker|auth|session|fetch|proxy|cockpit|deploy|sqlite|frontend|backend|api)\b/g,
  );
  return [...new Set(found ?? [])];
}

export function mapCategoriesToKnowledge(
  categories: SystemDiagnosis["categories"],
  model: RepositoryKnowledgeModel,
): string[] {
  const hints: string[] = [];
  if (categories.includes("frontend")) hints.push(model.architecture.find((b) => b.id === "cockpit")?.rootPath ?? "empireai-web");
  if (categories.includes("api")) hints.push(model.architecture.find((b) => b.id === "bff")?.rootPath ?? "empireai-web/app/api");
  if (categories.includes("backend")) hints.push(model.architecture.find((b) => b.id === "brain")?.rootPath ?? "backend/src/brain");
  return hints;
}
