import { apiRequest } from "@/api/client";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";

export type EvidenceSource =
  | "REAL-031"
  | "REAL-032"
  | "REAL-033"
  | "executive-council"
  | "executive-surveillance"
  | "pillow"
  | "journey"
  | "repository";

export interface AssistantEvidence {
  evidenceId: string;
  source: EvidenceSource;
  title: string;
  summary: string;
  moduleId?: string;
  recordedAt: string;
}

export interface AssistantScreenContext {
  screenPath: string;
  screenId: string;
  screenTitle: string;
  uxId?: string;
  purpose?: string;
  boundApis?: string[];
  journeyMarkers?: string[];
}

export interface AssistantSession {
  sessionId: string;
  workspaceId: string;
  companyId: string;
  screenContext: AssistantScreenContext;
  kpiLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  messageId: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  evidence?: AssistantEvidence[];
  createdAt: string;
}

export interface AssistantWorkflow {
  workflowId: string;
  title: string;
  description: string;
  steps: string[];
  screenId: string;
}

export interface AssistantCommand {
  commandId: string;
  type: string;
  title: string;
  summary: string;
  status: string;
  requiresApproval: boolean;
  result?: Record<string, unknown>;
}

export interface WhyEvidenceResult {
  kpiLabel: string;
  kpiValue: string | null;
  headline: string;
  summary: string;
  evidence: AssistantEvidence[];
  recommendOnly: boolean;
  screen: AssistantScreenContext;
}

export async function createAssistantSession(screenPath: string, kpiLabel?: string, companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ session: AssistantSession }>("/global-assistant/session", {
    method: "POST",
    body: { companyId, screenPath, kpiLabel },
  });
}

export async function fetchAssistantHistory(sessionId: string) {
  return apiRequest<{ history: AssistantMessage[] }>(`/global-assistant/session/${sessionId}/history`);
}

export async function sendAssistantChat(input: {
  sessionId: string;
  message: string;
  screenPath?: string;
  kpiLabel?: string;
  companyId?: string;
}) {
  return apiRequest<{ userMessage: AssistantMessage; assistantMessage: AssistantMessage }>(
    "/global-assistant/chat",
    {
      method: "POST",
      body: {
        companyId: input.companyId ?? GRAND_KING_COMPANY_ID,
        sessionId: input.sessionId,
        message: input.message,
        screenPath: input.screenPath,
        kpiLabel: input.kpiLabel,
      },
    },
  );
}

export async function fetchWhyEvidence(input: {
  screenPath: string;
  kpiLabel: string;
  kpiValue?: string;
  companyId?: string;
}) {
  return apiRequest<WhyEvidenceResult>("/global-assistant/why", {
    method: "POST",
    body: {
      companyId: input.companyId ?? GRAND_KING_COMPANY_ID,
      screenPath: input.screenPath,
      kpiLabel: input.kpiLabel,
      kpiValue: input.kpiValue,
    },
  });
}

export async function fetchAssistantContext(screenPath: string, kpiLabel?: string, companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ context: Record<string, unknown> }>("/global-assistant/context", {
    params: { companyId, screenPath, kpiLabel },
  });
}

export async function fetchAssistantWorkflows(screenPath: string) {
  return apiRequest<{ workflows: AssistantWorkflow[] }>("/global-assistant/workflows", {
    params: { screenPath },
  });
}

export async function fetchAssistantHelp(screenPath: string) {
  return apiRequest<{ helpTopics: Array<{ topic: string; description: string }>; workflows: AssistantWorkflow[] }>(
    "/global-assistant/help",
    { params: { screenPath } },
  );
}

export async function fetchAssistantMissions(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ missions: Array<Record<string, unknown>>; missionCount: number }>(
    "/global-assistant/missions",
    { params: { companyId } },
  );
}

export async function requestMissionGeneration(sessionId: string, companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ command: AssistantCommand; requiresApproval: boolean }>(
    "/global-assistant/missions/generate",
    { method: "POST", body: { companyId, sessionId } },
  );
}

export async function requestAuditGeneration(
  sessionId: string,
  screenPath: string,
  companyId = GRAND_KING_COMPANY_ID,
) {
  return apiRequest<{ command: AssistantCommand; requiresApproval: boolean }>(
    "/global-assistant/audit/generate",
    { method: "POST", body: { companyId, sessionId, screenPath } },
  );
}

export async function decideAssistantCommand(
  commandId: string,
  outcome: "approved" | "rejected",
  screenPath?: string,
) {
  return apiRequest<{ command: AssistantCommand }>(`/global-assistant/commands/${commandId}/decide`, {
    method: "POST",
    body: { outcome, screenPath },
  });
}

export async function fetchAssistantCommand(commandId: string) {
  return apiRequest<{ command: AssistantCommand }>(`/global-assistant/commands/${commandId}`);
}
