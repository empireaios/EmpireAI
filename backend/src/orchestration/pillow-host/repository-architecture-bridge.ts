import type { RepositoryArchitectureCockpitSnapshot } from "@empireai/pillow";

/** Collect live Repository Architecture Intelligence snapshot. */
export function collectRepositoryArchitectureSnapshot(input: {
  snapshot: RepositoryArchitectureCockpitSnapshot;
}): {
  capturedAt: string;
  version: string;
  componentCount: number;
  flowCount: number;
} {
  return {
    capturedAt: input.snapshot.computedAt,
    version: input.snapshot.version,
    componentCount: input.snapshot.componentCount,
    flowCount: input.snapshot.flowCount,
  };
}
