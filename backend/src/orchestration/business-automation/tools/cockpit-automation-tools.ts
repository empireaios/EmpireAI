/**
 * G5-07 — Cockpit Automation Centre Brain tools (executive interface — no business logic).
 */

import type { RegisteredTool } from "../../../brain/types.js";
import {
  loadAutomationCentreView,
  loadAutomationDetailView,
  loadAutomationTimelineView,
} from "../cockpit/automation-centre-view-loader.js";
import {
  validateCockpitAutomationAction,
  type CockpitAutomationAction,
} from "../cockpit/automation-centre-pillow-governance.js";
import {
  cancelAutomationRun,
  pauseAutomationRun,
} from "../services/orchestrator-service.js";
import {
  grantAutomationApproval,
  rejectAutomationApproval,
} from "../services/approval-router-service.js";
import { handleAutomationRecovery } from "../services/recovery-service.js";
import { scheduleAutomationRetry } from "../services/scheduler-service.js";
import { getAutomationRunStatus } from "../services/orchestrator-service.js";

export const cockpitAutomationTools: RegisteredTool[] = [
  {
    name: "cockpit_automation.load_view",
    description: "Load Cockpit Automation Centre dashboard — SCR-303 executive overview",
    module: "cockpit-automation",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      loadAutomationCentreView(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
      ),
  },
  {
    name: "cockpit_automation.load_detail",
    description: "Load automation detail view — workflow, approval, recovery, EKLS links",
    module: "cockpit-automation",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        automationId: { type: "string" },
      },
      required: ["automationId"],
    },
    handler: async (args, context) => {
      const view = loadAutomationDetailView(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        String(args.automationId),
      );
      if (!view) return { found: false as const };
      return { found: true as const, ...view };
    },
  },
  {
    name: "cockpit_automation.load_timeline",
    description: "Load workflow timeline — trigger through final outcome",
    module: "cockpit-automation",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        automationId: { type: "string" },
      },
      required: ["automationId"],
    },
    handler: async (args, context) => {
      const view = loadAutomationTimelineView(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        String(args.automationId),
      );
      if (!view) return { found: false as const };
      return { found: true as const, ...view };
    },
  },
  {
    name: "cockpit_automation.execute_action",
    description: "Execute Pillow-governed executive automation action — approve, pause, cancel, retry, rollback",
    module: "cockpit-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        action: {
          type: "string",
          enum: ["approve", "reject", "pause", "resume", "cancel", "retry", "rollback"],
        },
        automationId: { type: "string" },
        approvalId: { type: "string" },
        executionId: { type: "string" },
        failedStepId: { type: "string" },
        reason: { type: "string" },
        killSwitchActive: { type: "boolean" },
      },
      required: ["workspaceId", "actorId", "action"],
    },
    handler: async (args) => {
      const action = String(args.action) as CockpitAutomationAction;
      const workspaceId = String(args.workspaceId);
      const actorId = String(args.actorId);

      const governance = validateCockpitAutomationAction({
        action,
        actorId,
        workspaceId,
        killSwitchActive: args.killSwitchActive === true,
      });

      if (!governance.allowed) {
        return { success: false, reason: governance.reason, pillowGoverned: true };
      }

      switch (action) {
        case "approve":
          if (!args.approvalId) return { success: false, reason: "approvalId required" };
          return {
            success: true,
            result: await grantAutomationApproval({
              approvalId: String(args.approvalId),
              actorId,
              workspaceId,
              reason: args.reason ? String(args.reason) : undefined,
            }),
          };
        case "reject":
          if (!args.approvalId) return { success: false, reason: "approvalId required" };
          return {
            success: true,
            result: await rejectAutomationApproval({
              approvalId: String(args.approvalId),
              actorId,
              workspaceId,
              reason: args.reason ? String(args.reason) : undefined,
            }),
          };
        case "pause": {
          const executionId = String(args.executionId ?? args.automationId ?? "");
          if (!executionId) return { success: false, reason: "executionId required" };
          return {
            success: true,
            result: await pauseAutomationRun({ executionId, actorId, workspaceId }),
          };
        }
        case "cancel": {
          const executionId = String(args.executionId ?? args.automationId ?? "");
          if (!executionId) return { success: false, reason: "executionId required" };
          return {
            success: true,
            result: await cancelAutomationRun({ executionId, actorId, workspaceId }),
          };
        }
        case "retry": {
          const executionId = String(args.executionId ?? args.automationId ?? "");
          const runStatus = getAutomationRunStatus(executionId);
          if (!runStatus.found) return { success: false, reason: "Run not found for retry" };
          return {
            success: true,
            result: await scheduleAutomationRetry({
              queueId: runStatus.queueId,
              actorId,
              workspaceId,
            }),
          };
        }
        case "rollback": {
          const executionId = String(args.executionId ?? args.automationId ?? "");
          const runStatus = getAutomationRunStatus(executionId);
          if (!runStatus.found) return { success: false, reason: "Run not found for rollback" };
          return {
            success: true,
            result: await handleAutomationRecovery({
              executionId,
              failedStepId: args.failedStepId ? String(args.failedStepId) : runStatus.activeStepId ?? "unknown",
              actorId,
              errorClass: "COCKPIT_ROLLBACK",
              errorMessage: args.reason ? String(args.reason) : "Executive rollback via Cockpit",
            }),
          };
        }
        case "resume":
        default:
          return { success: false, reason: `Action ${action} delegated to Business Automation Brain resume path` };
      }
    },
  },
];
