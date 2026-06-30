import { seedDefaultExecutives } from "../data/default-executives.js";
import type { RegisteredExecutive, ExecutiveCertificationStatus, ExecutiveMaturity } from "../models/executive-registry.js";
import { getExecutiveCouncilRepository } from "../repositories/sqlite-executive-council-repository.js";

/** EC-002 — Permanent executive registry with unlimited future executives. */
export function initializeExecutiveRegistry(workspaceId: string, companyId: string): RegisteredExecutive[] {
  const repo = getExecutiveCouncilRepository();
  const seeded = seedDefaultExecutives(new Date().toISOString());
  repo.ensureExecutives(workspaceId, companyId, seeded);
  return repo.listExecutives(workspaceId, companyId);
}

export function listRegisteredExecutives(workspaceId: string, companyId: string): RegisteredExecutive[] {
  const repo = getExecutiveCouncilRepository();
  const existing = repo.listExecutives(workspaceId, companyId);
  if (existing.length === 0) return initializeExecutiveRegistry(workspaceId, companyId);
  return existing;
}

export function registerExecutive(
  workspaceId: string,
  companyId: string,
  input: {
    executiveId: string;
    role: string;
    title: string;
    domain: string;
    focusAreas: string[];
    certificationStatus?: ExecutiveCertificationStatus;
    maturity?: ExecutiveMaturity;
  },
): RegisteredExecutive {
  const executive: RegisteredExecutive = {
    executiveId: input.executiveId,
    role: input.role,
    title: input.title,
    domain: input.domain,
    focusAreas: input.focusAreas,
    certificationStatus: input.certificationStatus ?? "DRAFT",
    maturity: input.maturity ?? "EMERGING",
    recommendationCount: 0,
    registeredAt: new Date().toISOString(),
  };
  getExecutiveCouncilRepository().saveExecutive(workspaceId, companyId, executive);
  return executive;
}

export function updateExecutiveCertification(
  workspaceId: string,
  companyId: string,
  executiveId: string,
  certificationStatus: ExecutiveCertificationStatus,
  maturity?: ExecutiveMaturity,
): RegisteredExecutive | null {
  const repo = getExecutiveCouncilRepository();
  const executives = listRegisteredExecutives(workspaceId, companyId);
  const exec = executives.find((e) => e.executiveId === executiveId);
  if (!exec) return null;
  const updated: RegisteredExecutive = {
    ...exec,
    certificationStatus,
    maturity: maturity ?? exec.maturity,
  };
  repo.saveExecutive(workspaceId, companyId, updated);
  return updated;
}

export function getActiveExecutives(workspaceId: string, companyId: string): RegisteredExecutive[] {
  return listRegisteredExecutives(workspaceId, companyId).filter(
    (e) => e.certificationStatus === "ACTIVE" || e.certificationStatus === "EXPERIMENTAL",
  );
}

export function incrementExecutiveRecommendationCount(
  workspaceId: string,
  companyId: string,
  executiveId: string,
): void {
  const repo = getExecutiveCouncilRepository();
  const exec = listRegisteredExecutives(workspaceId, companyId).find((e) => e.executiveId === executiveId);
  if (!exec) return;
  repo.saveExecutive(workspaceId, companyId, {
    ...exec,
    recommendationCount: (exec.recommendationCount ?? 0) + 1,
  });
}
