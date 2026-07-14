import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { CursorMissionDocument } from "../planner/types.js";
import type { MissionTraceabilityRecord, JourneyRelationship } from "./types.js";
import { JOURNEY_RELATIONSHIP_CHAIN } from "./paths.js";

export function buildMissionTraceability(input: {
  journeyId: string;
  document: CursorMissionDocument;
  bootstrap: EmpireBootstrapContext;
  roadmapItem?: string | null;
  phase?: string | null;
  why?: string | null;
  what?: string | null;
  how?: string | null;
  proof?: string | null;
}): MissionTraceabilityRecord {
  const { document, bootstrap, journeyId } = input;
  const now = new Date().toISOString();

  return {
    journeyId,
    missionId: document.missionId,
    roadmapItem: input.roadmapItem ?? bootstrap.journeyPosition ?? document.missionId,
    phase: input.phase ?? "P4 Engineering Foundation",
    purpose: document.objective,
    why: input.why ?? `Constitutional execution for ${document.title}`,
    what: input.what ?? document.title,
    how: input.how ?? (document.implementationRules.slice(0, 3).join(" · ") || "Cursor Protocol mission"),
    proof: input.proof ?? (document.acceptanceCriteria.slice(0, 3).join(" · ") || "Validation pipeline"),
    missionState: "preparing",
    owner: "Builder",
    startTime: now,
    finishTime: null,
    elapsedTime: null,
    eta: null,
    dependencies: document.dependencies.map((d) => d.id),
    repositoryChanges: [],
    architectureChanges: [],
    productionChanges: [],
    evidence: document.evidence.map((e) => `${e.source}: ${e.detail}`),
    lessonsLearned: [],
    recoveryEvents: [],
  };
}

export function buildJourneyRelationships(input: {
  bootstrap: EmpireBootstrapContext;
  missionId?: string | null;
  roadmapItem?: string | null;
}): JourneyRelationship[] {
  const { bootstrap, missionId, roadmapItem } = input;
  const position = bootstrap.journeyPosition ?? roadmapItem ?? "Unscoped";

  return JOURNEY_RELATIONSHIP_CHAIN.map((link) => {
    switch (link) {
      case "vision":
        return { link, artifact: "EMPIREAI_VISION.md", detail: "Grand King vision — constitutional north star" };
      case "soul":
        return { link, artifact: "EMPIREAI_SOUL.md", detail: "Empire identity and operating character" };
      case "ctd":
        return { link, artifact: "EMPIREAI_CTD.md", detail: "Constitutional Technical Doctrine" };
      case "constitution_hierarchy":
        return { link, artifact: "EMPIREAI_CONSTITUTION_HIERARCHY.md", detail: "Tier 1–4 governance stack" };
      case "roadmap_item":
        return { link, artifact: "JOURNEY.md", detail: position };
      case "architecture":
        return { link, artifact: "EMPIREAI_BUILDER_ARCHITECTURE.md", detail: "Canonical subsystem architecture" };
      case "builder_mission":
        return { link, artifact: "Cursor Protocol mission", detail: missionId ?? "Pending mission" };
      case "real_mission":
        return { link, artifact: missionId ?? "TBD", detail: "REAL/UX/PILLOW mission identifier" };
      case "repository_commit":
        return { link, artifact: "git", detail: bootstrap.repositoryVersion ?? "local" };
      case "production_deployment":
        return { link, artifact: "Production Truth", detail: "empire-ai.co deployment surface" };
      case "evidence":
        return { link, artifact: "Browser Truth + E2E Testing", detail: "P4-06 · P4-07 acceptance evidence" };
      default:
        return { link, artifact: link, detail: "Linked" };
    }
  });
}

export function synthesizeCompletedTrace(input: {
  bootstrap: EmpireBootstrapContext;
  document: CursorMissionDocument;
  roadmapItem: string;
}): { journeyId: string; trace: MissionTraceabilityRecord; relationships: JourneyRelationship[] } {
  const journeyId = `JR-DEMO-${randomUUID().slice(0, 6).toUpperCase()}`;
  const relationships = buildJourneyRelationships({
    bootstrap: input.bootstrap,
    missionId: input.document.missionId,
    roadmapItem: input.roadmapItem,
  });
  const trace = buildMissionTraceability({
    journeyId,
    document: input.document,
    bootstrap: input.bootstrap,
    roadmapItem: input.roadmapItem,
    phase: "P4 Engineering Foundation",
    why: "Permanent constitutional traceability from Vision through Production",
    what: input.document.title,
    how: "Vision Sync → Context Sync → Cursor Protocol → Builder → Testing → Browser Truth",
    proof: "Repository PASS · Production PASS · Grand King PASS",
  });
  trace.missionState = "completed";
  trace.finishTime = new Date().toISOString();
  trace.elapsedTime = "simulated";
  trace.repositoryChanges = [`Mission ${input.document.missionId} implementation`];
  trace.lessonsLearned = ["Journey traceability eliminates manual reconstruction"];
  trace.evidence.push(
    "Vision alignment verified",
    "Repository changes recorded",
    "Production validation pending Browser Truth sign-off",
  );
  return { journeyId, trace, relationships };
}
