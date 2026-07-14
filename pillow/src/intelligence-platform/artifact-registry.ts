import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  ArtifactRegistrySnapshot,
  EmpireAIArtifact,
  EmpireAIArtifactType,
  RegisterArtifactInput,
} from "./types.js";

const REGISTRY_DIR = ".pillow/artifact-registry";
const REGISTRY_FILE = "artifacts.json";

/** Persistent Artifact Registry (Part G). */
export class ArtifactRegistry {
  private artifacts: EmpireAIArtifact[] = [];
  private readonly registryPath: string;

  constructor(repositoryRoot: string) {
    this.registryPath = path.join(repositoryRoot, REGISTRY_DIR, REGISTRY_FILE);
    this.load();
  }

  register(input: RegisterArtifactInput): EmpireAIArtifact {
    const artifact: EmpireAIArtifact = {
      artifactId: `art_${randomUUID().slice(0, 12)}`,
      artifactType: input.artifactType,
      sourceTool: input.sourceTool,
      missionId: input.missionId ?? null,
      timestamp: new Date().toISOString(),
      owner: input.owner,
      status: input.status ?? "complete",
      destinationEngine: input.destinationEngine ?? null,
      relatedBusinessEngine: input.relatedBusinessEngine ?? null,
      approvalStatus: input.approvalStatus ?? "none",
      title: input.title,
      content: input.content,
      metadata: input.metadata ?? {},
    };
    this.artifacts.push(artifact);
    this.persist();
    return artifact;
  }

  list(limit = 50): EmpireAIArtifact[] {
    return [...this.artifacts]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  getById(artifactId: string): EmpireAIArtifact | undefined {
    return this.artifacts.find((a) => a.artifactId === artifactId);
  }

  listByMission(missionId: string): EmpireAIArtifact[] {
    return this.artifacts.filter((a) => a.missionId === missionId);
  }

  snapshot(): ArtifactRegistrySnapshot {
    const byType = {} as Record<EmpireAIArtifactType, number>;
    for (const artifact of this.artifacts) {
      byType[artifact.artifactType] = (byType[artifact.artifactType] ?? 0) + 1;
    }
    return {
      missionId: "PILLOW-IP-001",
      totalArtifacts: this.artifacts.length,
      byType,
      recent: this.list(20),
    };
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.registryPath)) return;
      const raw = fs.readFileSync(this.registryPath, "utf8");
      const parsed = JSON.parse(raw) as EmpireAIArtifact[];
      if (Array.isArray(parsed)) {
        this.artifacts = parsed;
      }
    } catch {
      this.artifacts = [];
    }
  }

  private persist(): void {
    const dir = path.dirname(this.registryPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.registryPath, JSON.stringify(this.artifacts, null, 2), "utf8");
  }
}

export function createArtifactRegistry(repositoryRoot: string): ArtifactRegistry {
  return new ArtifactRegistry(repositoryRoot);
}
