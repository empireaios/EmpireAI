import { randomUUID } from "node:crypto";

import type { AssistantMessage, AssistantSession } from "../models/global-assistant.js";
import { getGlobalAssistantRepository } from "../repositories/sqlite-global-assistant-repository.js";
import { resolveScreenContext } from "../screen-registry.js";
import { buildAssistantContextBundle } from "./context-service.js";
import { buildWhyResponse, gatherAllEvidence } from "./evidence-service.js";
import { getContextualHelp } from "./workflow-service.js";

function composeAssistantReply(
  message: string,
  workspaceId: string,
  companyId: string,
  screenPath: string,
  kpiLabel?: string,
): { content: string; evidence: ReturnType<typeof gatherAllEvidence> } {
  const normalized = message.trim().toLowerCase();
  const screen = resolveScreenContext(screenPath);
  const evidence = gatherAllEvidence(workspaceId, companyId, screenPath, kpiLabel);

  if (normalized.startsWith("why") || normalized.includes("evidence") || kpiLabel) {
    const label = kpiLabel ?? (message.replace(/^why\s*\??\s*/i, "").trim() || "KPI");
    const why = buildWhyResponse(workspaceId, companyId, screenPath, label);
    return {
      content: `${why.headline}\n\n${why.summary}`,
      evidence: why.evidence,
    };
  }

  if (normalized.includes("help") || normalized.includes("workflow")) {
    const help = getContextualHelp(screenPath);
    const workflowText = help.workflows
      .map((w) => `**${w.title}**: ${w.steps.join(" → ")}`)
      .join("\n");
    return {
      content: `Contextual help for ${screen.screenTitle}:\n\n${help.helpTopics.map((t) => `• **${t.topic}** — ${t.description}`).join("\n")}\n\nGuided workflows:\n${workflowText}`,
      evidence,
    };
  }

  if (normalized.includes("journey")) {
    const context = buildAssistantContextBundle(workspaceId, companyId, screenPath);
    const journeyText =
      context.journey.rows.length > 0
        ? context.journey.rows.map((r) => `• ${r.id}: ${r.status}`).join("\n")
        : "No journey rows matched this screen.";
    return {
      content: `Journey awareness for ${screen.screenTitle}:\n${journeyText}`,
      evidence,
    };
  }

  if (normalized.includes("recommend") || normalized.includes("chief")) {
    const chiefEvidence = evidence.filter((e) =>
      ["REAL-031", "REAL-032", "REAL-033", "executive-council"].includes(e.source),
    );
    const text =
      chiefEvidence.length > 0
        ? chiefEvidence
            .slice(0, 6)
            .map((e) => `• [${e.source}] ${e.title}: ${e.summary}`)
            .join("\n")
        : "Chiefs are online with recommend-only outputs — no hardcoded advice.";
    return {
      content: `Executive recommendations (recommend-only):\n${text}`,
      evidence: chiefEvidence.length > 0 ? chiefEvidence : evidence,
    };
  }

  const essEvidence = evidence.filter((e) => e.source === "executive-surveillance");
  const summary =
    essEvidence[0]?.summary ??
    evidence[0]?.summary ??
    "Watchers observe — Council debates — you decide.";

  return {
    content: `On ${screen.screenTitle}: ${summary}\n\nAsk "Why?" with a KPI label, "help" for workflows, or "journey" for mission status.`,
    evidence,
  };
}

export function buildGlobalAssistantDashboard(workspaceId: string, companyId: string) {
  return {
    missionId: "GC-05",
    moduleId: "global-assistant",
    owners: ["REAL-031", "REAL-032", "REAL-033", "executive-council"],
    recommendOnly: true,
    features: [
      "context_awareness",
      "screen_awareness",
      "repository_awareness",
      "journey_awareness",
      "executive_recommendations",
      "mission_generation",
      "executive_audit_generation",
      "guided_workflows",
      "contextual_help",
      "conversation_history",
      "approval_gated_commands",
    ],
    computedAt: new Date().toISOString(),
  };
}

export function createAssistantSession(
  workspaceId: string,
  companyId: string,
  screenPath: string,
  kpiLabel?: string,
): AssistantSession {
  const repo = getGlobalAssistantRepository();
  const now = new Date().toISOString();
  const session: AssistantSession = {
    sessionId: repo.createId(),
    workspaceId,
    companyId,
    screenContext: resolveScreenContext(screenPath),
    kpiLabel: kpiLabel ?? null,
    createdAt: now,
    updatedAt: now,
  };
  repo.saveSession(session);

  const welcome: AssistantMessage = {
    messageId: repo.createId(),
    sessionId: session.sessionId,
    role: "assistant",
    content: `Global AI Assistant online on ${session.screenContext.screenTitle}. Ask "Why?" on any KPI, request help, or generate missions — all recommend-only until you approve.`,
    evidence: gatherAllEvidence(workspaceId, companyId, screenPath).slice(0, 3),
    createdAt: now,
  };
  repo.saveMessage(welcome);
  return session;
}

export function getAssistantHistory(sessionId: string): AssistantMessage[] {
  return getGlobalAssistantRepository().listMessages(sessionId);
}

export function sendAssistantMessage(input: {
  workspaceId: string;
  companyId: string;
  sessionId: string;
  message: string;
  screenPath?: string;
  kpiLabel?: string;
}): { userMessage: AssistantMessage; assistantMessage: AssistantMessage } {
  const repo = getGlobalAssistantRepository();
  const session = repo.getSession(input.sessionId);
  if (!session || session.workspaceId !== input.workspaceId) {
    throw new Error("Assistant session not found");
  }

  const screenPath = input.screenPath ?? session.screenContext.screenPath;
  const now = new Date().toISOString();

  const userMessage: AssistantMessage = {
    messageId: repo.createId(),
    sessionId: input.sessionId,
    role: "user",
    content: input.message,
    createdAt: now,
  };
  repo.saveMessage(userMessage);

  const reply = composeAssistantReply(
    input.message,
    input.workspaceId,
    input.companyId,
    screenPath,
    input.kpiLabel ?? session.kpiLabel ?? undefined,
  );

  const assistantMessage: AssistantMessage = {
    messageId: repo.createId(),
    sessionId: input.sessionId,
    role: "assistant",
    content: reply.content,
    evidence: reply.evidence.slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  repo.saveMessage(assistantMessage);

  repo.saveSession({
    ...session,
    screenContext: resolveScreenContext(screenPath),
    kpiLabel: input.kpiLabel ?? session.kpiLabel,
    updatedAt: assistantMessage.createdAt,
  });

  return { userMessage, assistantMessage };
}

export { buildWhyResponse } from "./evidence-service.js";
