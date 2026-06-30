import { randomUUID } from "node:crypto";

import type {
  DeploymentPlan,
  DeploymentPlanCreateInput,
} from "../models/deployment-plan.js";
import type {
  DeploymentBlueprintRepository,
  DeploymentBlueprintRepositoryQuery,
} from "./deployment-blueprint-repository.js";

function recordKey(workspaceId: string, deploymentPlanId: string): string {
  return `${workspaceId}:deployment-plan:${deploymentPlanId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneInput(input: DeploymentPlanCreateInput): DeploymentPlanCreateInput {
  return {
    ...input,
    environmentVariables: { ...input.environmentVariables },
    domainRequirements: {
      ...input.domainRequirements,
      dnsRecords: input.domainRequirements.dnsRecords.map((record) => ({ ...record })),
    },
    deploymentSteps: input.deploymentSteps.map((step) => ({ ...step })),
    signals: input.signals.map((signal) => ({ ...signal })),
  };
}

/** In-memory DeploymentBlueprintRepository for Mission 063 tests and local development. */
export class InMemoryDeploymentBlueprintRepository implements DeploymentBlueprintRepository {
  private readonly store = new Map<string, DeploymentPlan>();
  private readonly projectIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: DeploymentPlanCreateInput,
  ): Promise<DeploymentPlan> {
    const projectKey = `${workspaceId}:${input.projectId}`;
    const existingId = this.projectIndex.get(projectKey);
    const timestamp = nowIso();
    const cloned = cloneInput(input);

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: DeploymentPlan = {
          ...existing,
          ...cloned,
          deploymentPlanId: existing.deploymentPlanId,
          workspaceId: existing.workspaceId,
          createdAt: existing.createdAt,
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: DeploymentPlan = {
      deploymentPlanId: randomUUID(),
      workspaceId,
      ...cloned,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.deploymentPlanId), record);
    this.projectIndex.set(projectKey, record.deploymentPlanId);
    return structuredClone(record);
  }

  async getById(
    workspaceId: string,
    deploymentPlanId: string,
  ): Promise<DeploymentPlan | null> {
    const record = this.store.get(recordKey(workspaceId, deploymentPlanId));
    return record ? structuredClone(record) : null;
  }

  async getByProject(
    workspaceId: string,
    projectId: string,
  ): Promise<DeploymentPlan | null> {
    const deploymentPlanId = this.projectIndex.get(`${workspaceId}:${projectId}`);
    if (!deploymentPlanId) return null;
    return this.getById(workspaceId, deploymentPlanId);
  }

  async list(query: DeploymentBlueprintRepositoryQuery): Promise<DeploymentPlan[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.projectId) {
      results = results.filter((record) => record.projectId === query.projectId);
    }
    if (query.storeId) {
      results = results.filter((record) => record.storeId === query.storeId);
    }
    if (query.generatedStorefrontId) {
      results = results.filter(
        (record) => record.generatedStorefrontId === query.generatedStorefrontId,
      );
    }
    if (query.hostingTarget) {
      results = results.filter((record) => record.hostingTarget === query.hostingTarget);
    }

    results.sort(
      (left, right) =>
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.projectId.localeCompare(right.projectId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, deploymentPlanId: string): Promise<boolean> {
    const key = recordKey(workspaceId, deploymentPlanId);
    const existing = this.store.get(key);
    if (!existing) return false;
    this.projectIndex.delete(`${workspaceId}:${existing.projectId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory deployment blueprint repository. */
export function createInMemoryDeploymentBlueprintRepository(): InMemoryDeploymentBlueprintRepository {
  return new InMemoryDeploymentBlueprintRepository();
}
