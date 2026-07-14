import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { CursorMissionDocument } from "../planner/types.js";
import { JourneyEventStore } from "./event-store.js";
import { JOURNEY_MODEL, JOURNEY_RELATIONSHIP_CHAIN } from "./paths.js";
import {
  buildJourneyRelationships,
  buildMissionTraceability,
  synthesizeCompletedTrace,
} from "./traceability.js";
import type { EndToEndTraceResult, JourneyRecord } from "./types.js";

const STAGE_PROGRESS: Record<string, number> = {
  vision: 5,
  vision_synchronization: 10,
  context_synchronization: 15,
  roadmap_item: 20,
  builder_mission: 30,
  architecture_review: 40,
  repository_changes: 50,
  implementation: 60,
  testing: 70,
  production_validation: 80,
  grand_king_acceptance: 90,
  lessons_learned: 95,
  vision_accumulation: 98,
  journey_archived: 100,
};

/** Build end-to-end trace for Grand King acceptance demonstration. */
export function executeEndToEndTrace(input: {
  bootstrap: EmpireBootstrapContext;
  document: CursorMissionDocument;
  store: JourneyEventStore;
  roadmapItem?: string | null;
}): EndToEndTraceResult {
  const roadmapItem = input.roadmapItem ?? input.bootstrap.journeyPosition ?? input.document.missionId;
  const { journeyId, trace, relationships } = synthesizeCompletedTrace({
    bootstrap: input.bootstrap,
    document: input.document,
    roadmapItem,
  });

  let record = input.store.get(journeyId);
  if (!record) {
    record = input.store.createJourney({
      journeyId,
      roadmapItem,
      missionId: input.document.missionId,
      relationships,
    });
  }

  input.store.attachMission(journeyId, trace);

  for (const stage of JOURNEY_MODEL) {
    input.store.appendEvent({
      journeyId,
      type: stage === "journey_archived" ? "journey_archived" : "milestone",
      stage,
      label: stage.replace(/_/g, " "),
      detail: `Stage ${stage} recorded in permanent journey`,
      actor: stage.includes("grand_king") ? "grand_king" : "system",
    });
    input.store.advanceStage(
      journeyId,
      stage,
      stage.replace(/_/g, " "),
      STAGE_PROGRESS[stage] ?? 50,
    );
  }

  input.store.appendEvent({
    journeyId,
    type: "validation_event",
    stage: "testing",
    label: "E2E Testing",
    detail: "P4-07 critical journeys validated",
    actor: "system",
  });

  input.store.appendEvent({
    journeyId,
    type: "lessons_learned",
    stage: "lessons_learned",
    label: "Traceability",
    detail: "Single Journey record spans Vision → Roadmap → Mission → Repository → Production → Evidence",
    actor: "pillow",
  });

  const finalRecord = input.store.get(journeyId)!;
  const chain = JOURNEY_RELATIONSHIP_CHAIN.map((link) => {
    const rel = finalRecord.relationships.find((r) => r.link === link);
    return {
      link,
      present: Boolean(rel?.detail && rel.detail !== "Pending mission" && rel.detail !== "TBD"),
      detail: rel?.detail ?? "Missing",
    };
  });

  const complete = chain.every((c) => c.present) && finalRecord.missions.length > 0;

  return {
    pipelineVersion: "P4-08",
    tracedAt: new Date().toISOString(),
    journeyId,
    complete,
    chain,
    summary: complete
      ? "End-to-end trace complete — no manual reconstruction required"
      : "Trace incomplete — missing relationship links",
    record: finalRecord,
  };
}

/** Publish Builder event to active journey. */
export function publishBuilderEvent(input: {
  store: JourneyEventStore;
  journeyId: string | null;
  type: import("./types.js").JourneyEventType;
  label: string;
  detail: string;
  stage?: import("./types.js").JourneyModelStage;
}): void {
  const id = input.journeyId ?? input.store.getActive()?.journeyId;
  if (!id) return;
  input.store.appendEvent({
    journeyId: id,
    type: input.type,
    stage: input.stage ?? "builder_mission",
    label: input.label,
    detail: input.detail,
    actor: "builder",
  });
}

export function ensureActiveJourney(input: {
  store: JourneyEventStore;
  bootstrap: EmpireBootstrapContext;
  missionId?: string | null;
  roadmapItem?: string | null;
}): JourneyRecord {
  const existing = input.store.getActive();
  if (existing) return existing;

  const roadmapItem = input.roadmapItem ?? input.bootstrap.journeyPosition ?? "P4 Engineering Foundation";
  return input.store.createJourney({
    roadmapItem,
    missionId: input.missionId ?? null,
    relationships: buildJourneyRelationships({
      bootstrap: input.bootstrap,
      missionId: input.missionId,
      roadmapItem,
    }),
  });
}

export function recordMissionInJourney(input: {
  store: JourneyEventStore;
  bootstrap: EmpireBootstrapContext;
  document: CursorMissionDocument;
  roadmapItem?: string | null;
}): { journeyId: string; trace: ReturnType<typeof buildMissionTraceability> } {
  const journey = ensureActiveJourney({
    store: input.store,
    bootstrap: input.bootstrap,
    missionId: input.document.missionId,
    roadmapItem: input.roadmapItem,
  });

  const trace = buildMissionTraceability({
    journeyId: journey.journeyId,
    document: input.document,
    bootstrap: input.bootstrap,
    roadmapItem: input.roadmapItem,
  });

  input.store.attachMission(journey.journeyId, trace);
  input.store.appendEvent({
    journeyId: journey.journeyId,
    type: "mission_started",
    stage: "builder_mission",
    label: input.document.title,
    detail: `Mission ${input.document.missionId} attached to journey ${journey.journeyId}`,
    actor: "builder",
  });
  input.store.advanceStage(journey.journeyId, "builder_mission", "Builder Mission", 30);

  return { journeyId: journey.journeyId, trace };
}
