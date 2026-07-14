import { randomUUID } from "node:crypto";
import type {
  JourneyRecord,
  JourneyTimelineEvent,
  MissionTraceabilityRecord,
} from "./types.js";
import type { JourneyEventType, JourneyModelStage } from "./types.js";

/** In-session permanent journey store — nothing loses its history. */
export class JourneyEventStore {
  private records = new Map<string, JourneyRecord>();
  private activeId: string | null = null;

  createJourney(input: {
    roadmapItem: string;
    missionId?: string | null;
    relationships: JourneyRecord["relationships"];
    journeyId?: string;
  }): JourneyRecord {
    const journeyId = input.journeyId ?? `JR-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const record: JourneyRecord = {
      journeyId,
      createdAt: now,
      archivedAt: null,
      status: "active",
      currentStage: "vision",
      currentRoadmapItem: input.roadmapItem,
      currentMissionId: input.missionId ?? null,
      currentStep: "Vision",
      progress: 0,
      eta: null,
      relationships: input.relationships,
      timeline: [],
      missions: [],
      milestones: [],
      recoveryEvents: [],
      validationEvents: [],
      productionEvents: [],
      grandKingDecisions: [],
      pillowDecisions: [],
      supervisorEvents: [],
      lessonsLearned: [],
      evidence: [],
    };
    this.records.set(journeyId, record);
    this.activeId = journeyId;
    return record;
  }

  getActive(): JourneyRecord | null {
    if (!this.activeId) return null;
    return this.records.get(this.activeId) ?? null;
  }

  get(journeyId: string): JourneyRecord | undefined {
    return this.records.get(journeyId);
  }

  list(): JourneyRecord[] {
    return [...this.records.values()];
  }

  appendEvent(input: {
    journeyId: string;
    type: JourneyEventType;
    stage: JourneyModelStage | "timeline";
    label: string;
    detail: string;
    actor: JourneyTimelineEvent["actor"];
  }): JourneyTimelineEvent {
    const record = this.records.get(input.journeyId);
    if (!record) throw new Error(`Journey not found: ${input.journeyId}`);

    const event: JourneyTimelineEvent = {
      id: `EVT-${randomUUID().slice(0, 8)}`,
      at: new Date().toISOString(),
      type: input.type,
      stage: input.stage,
      label: input.label,
      detail: input.detail,
      actor: input.actor,
    };
    record.timeline.push(event);

    if (input.type === "recovery_event") record.recoveryEvents.push(input.detail);
    if (input.type === "validation_event") record.validationEvents.push(input.detail);
    if (input.type === "deployment_event") record.productionEvents.push(input.detail);
    if (input.type === "grand_king_decision") record.grandKingDecisions.push(input.detail);
    if (input.type === "pillow_decision") record.pillowDecisions.push(input.detail);
    if (input.type === "supervisor_event") record.supervisorEvents.push(input.detail);
    if (input.type === "lessons_learned") record.lessonsLearned.push(input.detail);
    if (input.type === "milestone") record.milestones.push(input.detail);

    return event;
  }

  attachMission(journeyId: string, trace: MissionTraceabilityRecord): void {
    const record = this.records.get(journeyId);
    if (!record) throw new Error(`Journey not found: ${journeyId}`);
    record.missions.push(trace);
    record.currentMissionId = trace.missionId;
    record.evidence.push(...trace.evidence);
  }

  advanceStage(journeyId: string, stage: JourneyModelStage, step: string, progress: number): void {
    const record = this.records.get(journeyId);
    if (!record) return;
    record.currentStage = stage;
    record.currentStep = step;
    record.progress = Math.min(100, progress);
  }

  archive(journeyId: string): void {
    const record = this.records.get(journeyId);
    if (!record) return;
    record.status = "archived";
    record.archivedAt = new Date().toISOString();
    record.currentStage = "journey_archived";
    if (this.activeId === journeyId) this.activeId = null;
  }
}
