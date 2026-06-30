import { randomUUID } from "node:crypto";

import type { HumanActionQueue, HumanActionTask } from "../models/human-action-queue.js";
import { buildOrLoadGlobalCommerceIdentity } from "../../global-commerce/index.js";
import { computeCountryOnboardingBatch } from "../../global-commerce/index.js";
import { listInfrastructureReadiness } from "../../global-commerce-infrastructure/index.js";
import { getProviderDependencies } from "../../global-commerce-infrastructure/index.js";
import { buildGlobalCommerceRegistry } from "../../global-commerce/index.js";

const TASK_TEMPLATES: Array<Omit<HumanActionTask, "taskId" | "workspaceId" | "companyId" | "createdAt">> = [
  { title: "Verify identity", category: "kyc", priority: "CRITICAL", reason: "KYC verification required before marketplace access", estimatedCompletionMinutes: 45, blockingImpact: "LAUNCH_BLOCKING", automationStatus: "HUMAN_REQUIRED", journeyStageId: "registration", source: "global_commerce_identity" },
  { title: "Accept marketplace terms", category: "legal", priority: "HIGH", reason: "Commerce operating terms must be accepted", estimatedCompletionMinutes: 15, blockingImpact: "HIGH", automationStatus: "HUMAN_REQUIRED", journeyStageId: "launch_approval", source: "global_commerce_identity" },
  { title: "Upload KYC documents", category: "kyc", priority: "HIGH", reason: "Business verification documents required", estimatedCompletionMinutes: 30, blockingImpact: "LAUNCH_BLOCKING", automationStatus: "HUMAN_REQUIRED", journeyStageId: "registration", source: "global_commerce_identity" },
  { title: "Approve launch", category: "launch", priority: "CRITICAL", reason: "Founder approval required before go-live", estimatedCompletionMinutes: 10, blockingImpact: "LAUNCH_BLOCKING", automationStatus: "HUMAN_REQUIRED", journeyStageId: "launch_approval", source: "operation_first_dollar" },
  { title: "Connect payment account", category: "payment", priority: "HIGH", reason: "Payment rail required for disbursement", estimatedCompletionMinutes: 20, blockingImpact: "HIGH", automationStatus: "SEMI_AUTOMATABLE", journeyStageId: "marketplace_readiness", source: "global_commerce_infrastructure" },
  { title: "Approve advertising budget", category: "advertising", priority: "MEDIUM", reason: "Campaign spend requires founder approval", estimatedCompletionMinutes: 10, blockingImpact: "LOW", automationStatus: "HUMAN_REQUIRED", journeyStageId: "growth_review", source: "founder_automation" },
  { title: "Accept supplier agreement", category: "supplier", priority: "MEDIUM", reason: "Supplier terms must be acknowledged", estimatedCompletionMinutes: 15, blockingImpact: "MEDIUM", automationStatus: "SEMI_AUTOMATABLE", journeyStageId: "product_approval", source: "global_commerce_identity" },
];

function priorityRank(p: HumanActionTask["priority"]): number {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[p];
}

/** E-012 — Human Action Queue (founder-specific, not Brain task queue). */
export function buildHumanActionQueue(workspaceId: string, companyId: string): HumanActionQueue {
  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const infra = listInfrastructureReadiness(workspaceId, companyId);
  const registry = buildGlobalCommerceRegistry();
  const ts = new Date().toISOString();
  const tasks: HumanActionTask[] = [];

  for (const template of TASK_TEMPLATES) {
    let include = true;
    if (template.title === "Verify identity" && identity.kycStatus === "VERIFIED") include = false;
    if (template.title === "Accept marketplace terms" && identity.termsAccepted) include = false;
    if (template.title === "Upload KYC documents" && identity.kycStatus === "VERIFIED") include = false;
    if (!include) continue;

    tasks.push({
      taskId: randomUUID(),
      workspaceId,
      companyId,
      ...template,
      deadline: template.priority === "CRITICAL"
        ? new Date(Date.now() + 3 * 86400000).toISOString()
        : undefined,
      createdAt: ts,
    });
  }

  for (const action of identity.humanActionsRequired.slice(0, 5)) {
    if (tasks.some((t) => t.title === action)) continue;
    tasks.push({
      taskId: randomUUID(),
      workspaceId,
      companyId,
      title: action,
      category: "identity",
      priority: "HIGH",
      reason: "Required by global commerce identity",
      estimatedCompletionMinutes: 20,
      blockingImpact: "MEDIUM",
      automationStatus: "HUMAN_REQUIRED",
      source: "global_commerce_identity",
      createdAt: ts,
    });
  }

  for (const country of registry.countries.slice(0, 3)) {
    const onboarding = computeCountryOnboardingBatch(workspaceId, companyId, country.countryCode);
    for (const ob of onboarding.slice(0, 2)) {
      for (const ha of ob.humanActions.slice(0, 1)) {
        tasks.push({
          taskId: randomUUID(),
          workspaceId,
          companyId,
          title: ha,
          category: "marketplace",
          priority: ob.risk === "HIGH" ? "HIGH" : "MEDIUM",
          reason: `${ob.displayName} onboarding: ${ob.status}`,
          estimatedCompletionMinutes: 25,
          blockingImpact: ob.status === "KYC_REQUIRED" ? "LAUNCH_BLOCKING" : "MEDIUM",
          automationStatus: "HUMAN_REQUIRED",
          countryCode: country.countryCode,
          providerId: ob.providerId,
          journeyStageId: "marketplace_readiness",
          source: "global_commerce_onboarding",
          createdAt: ts,
        });
      }
    }

    const readiness = infra.find((r) => r.countryCode === country.countryCode);
    for (const blocker of readiness?.criticalBlockers.slice(0, 2) ?? []) {
      tasks.push({
        taskId: randomUUID(),
        workspaceId,
        companyId,
        title: blocker,
        category: "infrastructure",
        priority: "CRITICAL",
        reason: `Infrastructure blocker for ${country.displayName}`,
        estimatedCompletionMinutes: 40,
        blockingImpact: "LAUNCH_BLOCKING",
        automationStatus: "HUMAN_REQUIRED",
        countryCode: country.countryCode,
        journeyStageId: "infrastructure_review",
        source: "global_commerce_infrastructure",
        createdAt: ts,
      });
    }
  }

  const shopeeDeps = getProviderDependencies("shopee-sg", "SG");
  for (const dep of shopeeDeps?.dependencies.filter((d) => d.humanActionRequired && d.requirement === "REQUIRED") ?? []) {
    tasks.push({
      taskId: randomUUID(),
      workspaceId,
      companyId,
      title: dep.component,
      category: dep.layerId,
      priority: "HIGH",
      reason: dep.rationale,
      estimatedCompletionMinutes: 30,
      blockingImpact: "HIGH",
      automationStatus: dep.automatable ? "SEMI_AUTOMATABLE" : "HUMAN_REQUIRED",
      countryCode: "SG",
      providerId: "shopee-sg",
      journeyStageId: "infrastructure_review",
      source: "global_commerce_infrastructure",
      createdAt: ts,
    });
  }

  tasks.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));

  return {
    workspaceId,
    companyId,
    tasks,
    totalCount: tasks.length,
    criticalCount: tasks.filter((t) => t.priority === "CRITICAL").length,
    computedAt: ts,
  };
}

export function getHumanActionTask(queue: HumanActionQueue, taskId: string): HumanActionTask | null {
  return queue.tasks.find((t) => t.taskId === taskId) ?? null;
}
