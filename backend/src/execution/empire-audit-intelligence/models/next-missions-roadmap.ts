import { z } from "zod";

export const MISSION_PHASES = [
  "FOUNDATION",
  "INTELLIGENCE",
  "EXECUTION",
  "AUTONOMY",
  "SCALE",
] as const;

export type MissionPhase = (typeof MISSION_PHASES)[number];

/** Roadmap entry for a future mission. */
export type MissionRoadmapEntry = {
  missionNumber: number;
  missionTitle: string;
  phase: MissionPhase;
  description: string;
  dependencies: number[];
  priority: number;
};

export const missionRoadmapEntrySchema = z.object({
  missionNumber: z.number().int().min(101).max(200),
  missionTitle: z.string().min(1),
  phase: z.enum(MISSION_PHASES),
  description: z.string().min(1),
  dependencies: z.array(z.number().int().min(1)),
  priority: z.number().int().min(1),
});

/** Next 100 missions roadmap (101–200). */
export type NextMissionsRoadmap = {
  roadmapId: string;
  startMission: number;
  endMission: number;
  missions: MissionRoadmapEntry[];
  summary: string;
};

export const nextMissionsRoadmapSchema = z.object({
  roadmapId: z.string().min(1),
  startMission: z.literal(101),
  endMission: z.literal(200),
  missions: z.array(missionRoadmapEntrySchema).length(100),
  summary: z.string().min(1),
});

/** Validates a MissionRoadmapEntry record shape. */
export function validateMissionRoadmapEntry(value: unknown): MissionRoadmapEntry {
  return missionRoadmapEntrySchema.parse(value);
}

/** Validates a NextMissionsRoadmap record shape. */
export function validateNextMissionsRoadmap(value: unknown): NextMissionsRoadmap {
  return nextMissionsRoadmapSchema.parse(value);
}
