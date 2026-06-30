import { randomUUID } from "node:crypto";

import type { AssistantCommand, AssistantCommandType } from "../models/global-assistant.js";
import { getGlobalAssistantRepository } from "../repositories/sqlite-global-assistant-repository.js";
import { generateExecutiveAuditArtifact } from "./audit-service.js";
import { generateAssistantMissions } from "./mission-service.js";

export function registerAssistantCommand(input: {
  workspaceId: string;
  companyId: string;
  sessionId: string;
  type: AssistantCommandType;
  title: string;
  summary: string;
  screenPath?: string;
}): AssistantCommand {
  const repo = getGlobalAssistantRepository();
  const now = new Date().toISOString();
  const command: AssistantCommand = {
    commandId: repo.createId(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    sessionId: input.sessionId,
    type: input.type,
    title: input.title,
    summary: input.summary,
    status: "pending",
    requiresApproval: true,
    approvalId: null,
    createdAt: now,
    decidedAt: null,
  };
  repo.saveCommand(command);
  return command;
}

export function decideAssistantCommand(
  workspaceId: string,
  commandId: string,
  outcome: "approved" | "rejected",
  screenPath = "/dashboard",
): AssistantCommand | null {
  const repo = getGlobalAssistantRepository();
  const existing = repo.getCommand(commandId);
  if (!existing || existing.workspaceId !== workspaceId) return null;

  const now = new Date().toISOString();
  let result: Record<string, unknown> | undefined;
  let status: AssistantCommand["status"] = outcome === "approved" ? "approved" : "rejected";

  if (outcome === "approved") {
    if (existing.type === "mission_generation") {
      result = generateAssistantMissions(workspaceId, existing.companyId);
      status = "executed";
    } else if (existing.type === "executive_audit_generation") {
      result = generateExecutiveAuditArtifact(workspaceId, existing.companyId, screenPath);
      status = "executed";
    } else {
      result = { acknowledged: true, type: existing.type };
      status = "executed";
    }
  }

  const updated: AssistantCommand = {
    ...existing,
    status,
    approvalId: existing.approvalId ?? repo.createId(),
    result,
    decidedAt: now,
  };
  repo.saveCommand(updated);
  return updated;
}

export function requestMissionGenerationCommand(
  workspaceId: string,
  companyId: string,
  sessionId: string,
): AssistantCommand {
  return registerAssistantCommand({
    workspaceId,
    companyId,
    sessionId,
    type: "mission_generation",
    title: "Generate governed missions",
    summary: "REAL-057 mission proposals from PROGRAM_CATALOG blockers — requires King approval.",
  });
}

export function requestAuditGenerationCommand(
  workspaceId: string,
  companyId: string,
  sessionId: string,
  screenPath: string,
): AssistantCommand {
  return registerAssistantCommand({
    workspaceId,
    companyId,
    sessionId,
    type: "executive_audit_generation",
    title: "Generate Executive Audit",
    summary: `Executive Audit for ${screenPath} from live chief and ESS evidence.`,
    screenPath,
  });
}

export function getAssistantCommand(commandId: string): AssistantCommand | null {
  return getGlobalAssistantRepository().getCommand(commandId);
}

export function createApprovalBridgeId(): string {
  return randomUUID();
}
