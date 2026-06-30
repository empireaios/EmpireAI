import { z } from "zod";

export const DEPENDENCY_TYPES = ["REQUIRES", "BLOCKS", "OPTIONAL", "TRIGGERS"] as const;

export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

/** Engine dependency for coordinated execution ordering. */
export type EngineDependency = {
  dependencyId: string;
  sourceEngineId: string;
  targetEngineId: string;
  sourceEngineName: string;
  targetEngineName: string;
  dependencyType: DependencyType;
  satisfied: boolean;
  score: number;
};

export const engineDependencySchema = z.object({
  dependencyId: z.string().min(1),
  sourceEngineId: z.string().min(1),
  targetEngineId: z.string().min(1),
  sourceEngineName: z.string().min(1),
  targetEngineName: z.string().min(1),
  dependencyType: z.enum(DEPENDENCY_TYPES),
  satisfied: z.boolean(),
  score: z.number().min(0).max(100),
});

/** Validates an EngineDependency record shape. */
export function validateEngineDependency(value: unknown): EngineDependency {
  return engineDependencySchema.parse(value);
}
