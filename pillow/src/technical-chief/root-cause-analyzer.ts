import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import { queryRepositoryKnowledge } from "../repository-intelligence/query-engine.js";
import type { RootCauseAnalysis, SystemDiagnosis } from "./types.js";

export function analyzeRootCause(
  problemDescription: string,
  diagnosis: SystemDiagnosis,
  intelligence: RepositoryIntelligenceContext,
): RootCauseAnalysis {
  const normalized = problemDescription.toLowerCase();
  const model = intelligence.knowledgeModel;

  let rootCause = "Symptom requires deeper trace — visible failure may not be origin.";
  let confidenceScore = 0.55;
  const upstreamCauses: string[] = [];
  const downstreamConsequences: string[] = [];

  if (/failed to fetch/i.test(normalized)) {
    rootCause =
      "Browser fetch failed before HTTP response — typically BFF proxy misconfiguration, auth race before session cookie, missing retry on transient Vercel/Railway cold start, or upstream timeout.";
    upstreamCauses.push(
      "GlobalAiAssistantProvider mounted before auth guard",
      "BRAIN_API_URL pointing at localhost on Vercel",
      "Single-attempt fetch without retry on /api/pillow/session",
    );
    downstreamConsequences.push(
      "Pillow chat unavailable",
      "connectionError banner in Operating Shell",
      "Brain context still loads via separate dispatch path",
    );
    confidenceScore = 0.92;
  } else if (/502|504|timeout|proxy/i.test(normalized)) {
    rootCause =
      "BFF proxy or upstream Brain API timeout — Vercel serverless fetch to Railway exceeded limit or Railway cold start.";
    upstreamCauses.push("Vercel maxDuration", "Railway container cold start", "Missing upstream timeout guard");
    downstreamConsequences.push("All /api/* routes fail from browser", "Pillow and Brain dispatch hang");
    confidenceScore = 0.88;
  } else if (/401|403|auth|session/i.test(normalized)) {
    rootCause = "Authentication or authorization failure — session cookie not forwarded or founder role missing.";
    upstreamCauses.push("Auth middleware", "Cookie SameSite/domain mismatch", "Session created before auth verified");
    downstreamConsequences.push("Pillow session 401", "Protected cockpit routes blocked");
    confidenceScore = 0.85;
  } else if (/503|bootstrap|self-assessment/i.test(normalized)) {
    rootCause =
      "PillowHost bootstrap or executive self-assessment failed — governance bundle incomplete on Railway.";
    upstreamCauses.push("Missing governance artifacts in backend/.pillow-governance-bundle", "sync-pillow-governance not run in build");
    downstreamConsequences.push("Pillow lifecycle not running", "Session creation 503");
    confidenceScore = 0.9;
  } else if (/deploy|build fail|ts2307/i.test(normalized)) {
    rootCause =
      "Deployment/build failure — uncommitted modules, missing governance sync, or TypeScript import to files not in repository.";
    upstreamCauses.push("Local-only files not pushed", "Railway clean checkout missing orchestration modules");
    downstreamConsequences.push("Production stuck on old container", "Feature regression in production");
    confidenceScore = 0.87;
  } else if (/drift|missing owner|health score/i.test(normalized)) {
    rootCause = "Repository architecture or governance drift detected by intelligence health scan.";
    upstreamCauses.push("Incomplete JOURNEY references", "Duplicate ownership in UX contract");
    downstreamConsequences.push("Mission planning uncertainty", "Incorrect dependency analysis");
    confidenceScore = 0.7;
  }

  const riQuery = queryRepositoryKnowledge(
    `Where is ${diagnosis.affectedModules[0] ?? "pillow-host"} implemented?`,
    model,
  );
  if (riQuery.matched && confidenceScore < 0.8) {
    const hint = riQuery.answers[0]?.answer;
    if (hint) {
      rootCause = `${rootCause} Repository intelligence locates primary module: ${hint.split(".")[0]}.`;
      confidenceScore = Math.min(confidenceScore + 0.1, 0.95);
    }
  }

  const businessImpact =
    diagnosis.severity === "critical"
      ? "Grand King operating environment impaired — executive decisions blocked."
      : diagnosis.severity === "high"
        ? "Pillow or Cockpit degraded — engineering velocity reduced."
        : "Localized engineering friction — production may remain operational.";

  const technicalImpact = `Affects layers: ${diagnosis.affectedLayers.join(", ") || "unknown"}. Modules: ${diagnosis.affectedModules.slice(0, 4).join(", ") || "TBD"}.`;

  const recurrenceLikelihood =
    /race|retry|localhost|cold start/i.test(rootCause) ? "medium" : diagnosis.severity === "critical" ? "high" : "low";

  return {
    rootCause,
    upstreamCauses,
    downstreamConsequences,
    businessImpact,
    technicalImpact,
    recurrenceLikelihood,
    confidenceScore,
    affectedModules: diagnosis.affectedModules,
  };
}
