export {
  AssistantCommandSchema,
  AssistantCommandStatusSchema,
  AssistantCommandTypeSchema,
  AssistantEvidenceSchema,
  AssistantMessageRoleSchema,
  AssistantMessageSchema,
  AssistantScreenContextSchema,
  AssistantSessionSchema,
  AssistantWorkflowSchema,
  ChatRequestSchema,
  EvidenceSourceSchema,
  WhyEvidenceQuerySchema,
} from "./models/global-assistant.js";
export type {
  AssistantCommand,
  AssistantCommandStatus,
  AssistantCommandType,
  AssistantEvidence,
  AssistantMessage,
  AssistantMessageRole,
  AssistantScreenContext,
  AssistantSession,
  AssistantWorkflow,
  EvidenceSource,
} from "./models/global-assistant.js";

export {
  getGlobalAssistantRepository,
  resetGlobalAssistantRepository,
} from "./repositories/sqlite-global-assistant-repository.js";

export { resolveScreenContext } from "./screen-registry.js";

export {
  buildGlobalAssistantDashboard,
  buildWhyResponse,
  createAssistantSession,
  getAssistantHistory,
  sendAssistantMessage,
} from "./services/assistant-service.js";

export { buildAssistantContextBundle } from "./services/context-service.js";
export { gatherAllEvidence } from "./services/evidence-service.js";
export { generateAssistantMissions } from "./services/mission-service.js";
export { generateExecutiveAuditArtifact, getExecutiveAuditArtifact } from "./services/audit-service.js";
export { getContextualHelp, listGuidedWorkflows } from "./services/workflow-service.js";
export {
  decideAssistantCommand,
  getAssistantCommand,
  registerAssistantCommand,
  requestAuditGenerationCommand,
  requestMissionGenerationCommand,
} from "./services/command-service.js";

export { registerGlobalAssistantRoutes } from "./routes/global-assistant-routes.js";
