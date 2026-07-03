import type { RegisteredTool } from "../../../brain/types.js";
import type { TriggerCategory } from "../contracts/trigger-types.js";
import {
  evaluateAutomationTriggers,
  getAutomationTriggerStatus,
  receiveAutomationTrigger,
} from "../services/trigger-engine-service.js";
import {
  advanceAutomationRun,
  cancelAutomationRun,
  getAutomationRunSnapshot,
  getAutomationRunStatus,
  pauseAutomationRun,
  pickupWaitingAutomation,
  previewWorkflowDefinition,
  runAutomationToCompletion,
} from "../services/orchestrator-service.js";
import {
  dispatchNextQueuedAutomation,
  getAutomationQueueSnapshot,
  processSchedulerDueItems,
} from "../services/scheduler-service.js";
import {
  cancelAutomationApproval,
  evaluateAutomationApprovalRequirement,
  expireDueAutomationApprovals,
  getAutomationApprovalSnapshot,
  getAutomationApprovalStatus,
  getCockpitAutomationApprovalStatus,
  grantAutomationApproval,
  rejectAutomationApproval,
  submitAutomationApproval,
} from "../services/approval-router-service.js";
import {
  getAutomationRecoveryStatus,
  getAutomationRollbackStatus,
  getCockpitAutomationRecoveryStatus,
  handleAutomationRecovery,
  resolveRecoveryPolicyPreview,
  simulateAutomationFailure,
} from "../services/recovery-service.js";

export const businessAutomationTools: RegisteredTool[] = [
  {
    name: "business_automation.evaluate_triggers",
    description:
      "Evaluate REG-AUTOMATION-TRIGGER rows against G3-10 executive decision gate — trigger evaluation only, no workflow execution",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        correlationId: { type: "string" },
        killSwitchActive: { type: "boolean" },
      },
      required: ["workspaceId", "actorId", "correlationId"],
    },
    handler: async (args) =>
      evaluateAutomationTriggers({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        correlationId: String(args.correlationId),
        killSwitchActive: args.killSwitchActive === true,
      }),
  },
  {
    name: "business_automation.receive_trigger",
    description:
      "Single entry point for Business Automation triggers — validates, resolves registry, routes approval, queues scheduler handoff",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "executive_decision",
            "brain_dispatch",
            "pillow_approval",
            "scheduler",
            "registry_event",
            "business_event",
            "mission_event",
            "cockpit_action",
            "manual_executive",
            "future_plugin",
          ],
        },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        correlationId: { type: "string" },
        companyId: { type: "string" },
        brandId: { type: "string" },
        environment: { type: "string" },
        registryTriggerId: { type: "string" },
        killSwitchActive: { type: "boolean" },
        priority: { type: "string", enum: ["low", "normal", "high", "critical"] },
        payload: { type: "object" },
      },
      required: ["category", "workspaceId", "actorId", "correlationId"],
    },
    handler: async (args) =>
      receiveAutomationTrigger({
        category: String(args.category) as TriggerCategory,
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        correlationId: String(args.correlationId),
        pillowGovernance: true,
        companyId: args.companyId ? String(args.companyId) : undefined,
        brandId: args.brandId ? String(args.brandId) : undefined,
        environment: args.environment ? String(args.environment) : undefined,
        registryTriggerId: args.registryTriggerId ? String(args.registryTriggerId) : undefined,
        killSwitchActive: args.killSwitchActive === true,
        priority: args.priority as "low" | "normal" | "high" | "critical" | undefined,
        payload:
          args.payload && typeof args.payload === "object"
            ? (args.payload as Record<string, unknown>)
            : undefined,
      }),
  },
  {
    name: "business_automation.trigger_status",
    description: "Cockpit-oriented trigger status snapshot — no UI, status exposure only",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => getAutomationTriggerStatus(String(args.workspaceId)),
  },
  {
    name: "business_automation.queue_status",
    description:
      "Automation queue snapshot — execution state, priority ordering, correlation IDs (no workflow execution)",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      getAutomationQueueSnapshot(args.workspaceId ? String(args.workspaceId) : undefined),
  },
  {
    name: "business_automation.process_scheduler_due",
    description:
      "Promote registry-scheduled automation requests to queued state when scheduled time is reached",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        nowIso: { type: "string" },
      },
    },
    handler: async (args) =>
      processSchedulerDueItems({
        nowIso: args.nowIso ? String(args.nowIso) : undefined,
      }),
  },
  {
    name: "business_automation.dispatch_queued",
    description:
      "Dispatch next ready queued automation to orchestrator waiting state — G5-04 handoff only, no execution",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        nowIso: { type: "string" },
      },
    },
    handler: async (args) =>
      dispatchNextQueuedAutomation({
        nowIso: args.nowIso ? String(args.nowIso) : undefined,
      }),
  },
  {
    name: "business_automation.pickup_waiting",
    description:
      "Pickup waiting automation queue entry and start workflow orchestration — loads registry workflow definition",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        queueId: { type: "string" },
        killSwitchActive: { type: "boolean" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      pickupWaitingAutomation({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        queueId: args.queueId ? String(args.queueId) : undefined,
        killSwitchActive: args.killSwitchActive === true,
      }),
  },
  {
    name: "business_automation.advance_run",
    description: "Advance automation run — execute next registry workflow step via Execution Broker and Brain",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        executionId: { type: "string" },
        killSwitchActive: { type: "boolean" },
      },
      required: ["workspaceId", "actorId", "executionId"],
    },
    handler: async (args) =>
      advanceAutomationRun({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        executionId: String(args.executionId),
        killSwitchActive: args.killSwitchActive === true,
      }),
  },
  {
    name: "business_automation.run_to_completion",
    description: "Advance automation run until completion, failure, or waiting state",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        executionId: { type: "string" },
        maxSteps: { type: "number" },
      },
      required: ["workspaceId", "actorId", "executionId"],
    },
    handler: async (args) =>
      runAutomationToCompletion({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        executionId: String(args.executionId),
        maxSteps: typeof args.maxSteps === "number" ? args.maxSteps : undefined,
      }),
  },
  {
    name: "business_automation.run_status",
    description: "Automation run and step execution status snapshot — no UI",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
      },
      required: ["executionId"],
    },
    handler: async (args) => getAutomationRunStatus(String(args.executionId)),
  },
  {
    name: "business_automation.run_snapshot",
    description: "Workspace automation run snapshot",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      getAutomationRunSnapshot(args.workspaceId ? String(args.workspaceId) : undefined),
  },
  {
    name: "business_automation.cancel_run",
    description: "Cancel in-flight automation run under Pillow governance",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        executionId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "executionId"],
    },
    handler: async (args) =>
      cancelAutomationRun({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        executionId: String(args.executionId),
      }),
  },
  {
    name: "business_automation.pause_run",
    description: "Pause in-flight automation run",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        executionId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "executionId"],
    },
    handler: async (args) =>
      pauseAutomationRun({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        executionId: String(args.executionId),
      }),
  },
  {
    name: "business_automation.foundation_executor_ack",
    description:
      "Foundation executor acknowledgement target for registry executorRef routes — structural only, no business logic",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        stepId: { type: "string" },
        executionId: { type: "string" },
        executorRef: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      acknowledged: true,
      pillowGovernance: true,
      stepId: args.stepId ? String(args.stepId) : undefined,
      executionId: args.executionId ? String(args.executionId) : undefined,
      executorRef: args.executorRef ? String(args.executorRef) : undefined,
    }),
  },
  {
    name: "business_automation.evaluate_approval",
    description: "Evaluate REG-AUTOMATION-APPROVAL requirement for automation request — no execution",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        approvalRegistryId: { type: "string" },
        policyRegistryId: { type: "string" },
        payload: { type: "object" },
      },
    },
    handler: async (args) =>
      evaluateAutomationApprovalRequirement({
        approvalRegistryId: args.approvalRegistryId ? String(args.approvalRegistryId) : undefined,
        policyRegistryId: args.policyRegistryId ? String(args.policyRegistryId) : undefined,
        payload:
          args.payload && typeof args.payload === "object"
            ? (args.payload as Record<string, unknown>)
            : undefined,
      }),
  },
  {
    name: "business_automation.submit_approval",
    description: "Submit Pillow-governed automation approval request",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        workflowId: { type: "string" },
        triggerId: { type: "string" },
        correlationId: { type: "string" },
        approvalRegistryId: { type: "string" },
        policyRegistryId: { type: "string" },
        executionId: { type: "string" },
        queueId: { type: "string" },
        decisionReference: { type: "string" },
        payload: { type: "object" },
      },
      required: ["workspaceId", "actorId", "workflowId", "triggerId", "correlationId"],
    },
    handler: async (args) =>
      submitAutomationApproval({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        workflowId: String(args.workflowId),
        triggerId: String(args.triggerId),
        correlationId: String(args.correlationId),
        approvalRegistryId: args.approvalRegistryId ? String(args.approvalRegistryId) : undefined,
        policyRegistryId: args.policyRegistryId ? String(args.policyRegistryId) : undefined,
        executionId: args.executionId ? String(args.executionId) : undefined,
        queueId: args.queueId ? String(args.queueId) : undefined,
        decisionReference: args.decisionReference ? String(args.decisionReference) : undefined,
        payload:
          args.payload && typeof args.payload === "object"
            ? (args.payload as Record<string, unknown>)
            : undefined,
      }),
  },
  {
    name: "business_automation.grant_approval",
    description: "Grant automation approval and resume workflow per Pillow governance",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        approvalId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["workspaceId", "actorId", "approvalId"],
    },
    handler: async (args) =>
      grantAutomationApproval({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        approvalId: String(args.approvalId),
        reason: args.reason ? String(args.reason) : undefined,
      }),
  },
  {
    name: "business_automation.reject_approval",
    description: "Reject automation approval and terminate workflow",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        approvalId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["workspaceId", "actorId", "approvalId"],
    },
    handler: async (args) =>
      rejectAutomationApproval({
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
        approvalId: String(args.approvalId),
        reason: args.reason ? String(args.reason) : undefined,
      }),
  },
  {
    name: "business_automation.approval_status",
    description: "Automation approval status and history — Cockpit-oriented, no UI redesign",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        approvalId: { type: "string" },
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) => {
      if (args.approvalId) {
        return getAutomationApprovalStatus(String(args.approvalId));
      }
      if (args.workspaceId) {
        return getCockpitAutomationApprovalStatus(String(args.workspaceId));
      }
      return getAutomationApprovalSnapshot();
    },
  },
  {
    name: "business_automation.expire_approvals",
    description: "Expire due automation approvals per registry expiry policy",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        nowIso: { type: "string" },
      },
    },
    handler: async (args) =>
      expireDueAutomationApprovals({
        nowIso: args.nowIso ? String(args.nowIso) : undefined,
      }),
  },
  {
    name: "business_automation.recovery_status",
    description:
      "Recovery status snapshot — execution recovery record or Cockpit workspace summary (no UI redesign)",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) => {
      if (args.executionId) {
        return getAutomationRecoveryStatus(String(args.executionId));
      }
      if (args.workspaceId) {
        return getCockpitAutomationRecoveryStatus(String(args.workspaceId));
      }
      return { error: "executionId or workspaceId required" };
    },
  },
  {
    name: "business_automation.rollback_status",
    description: "Rollback context snapshot for execution or rollback ID",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        rollbackId: { type: "string" },
        executionId: { type: "string" },
      },
    },
    handler: async (args) =>
      getAutomationRollbackStatus({
        rollbackId: args.rollbackId ? String(args.rollbackId) : undefined,
        executionId: args.executionId ? String(args.executionId) : undefined,
      }),
  },
  {
    name: "business_automation.handle_recovery",
    description:
      "Manually invoke Recovery Engine for failed execution — registry-driven strategy, Pillow governed",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
        failedStepId: { type: "string" },
        actorId: { type: "string" },
        errorClass: { type: "string" },
        errorMessage: { type: "string" },
      },
      required: ["executionId", "failedStepId", "actorId"],
    },
    handler: async (args) =>
      handleAutomationRecovery({
        executionId: String(args.executionId),
        failedStepId: String(args.failedStepId),
        actorId: String(args.actorId),
        errorClass: args.errorClass ? String(args.errorClass) : undefined,
        errorMessage: args.errorMessage ? String(args.errorMessage) : undefined,
      }),
  },
  {
    name: "business_automation.simulate_failure",
    description:
      "Simulate execution failure and invoke recovery coordination — validation and test support only",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
        failedStepId: { type: "string" },
        actorId: { type: "string" },
        workspaceId: { type: "string" },
        errorClass: { type: "string" },
        errorMessage: { type: "string" },
      },
      required: ["executionId", "failedStepId", "actorId", "workspaceId"],
    },
    handler: async (args) =>
      simulateAutomationFailure({
        executionId: String(args.executionId),
        failedStepId: String(args.failedStepId),
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        errorClass: args.errorClass ? String(args.errorClass) : undefined,
        errorMessage: args.errorMessage ? String(args.errorMessage) : undefined,
      }),
  },
  {
    name: "business_automation.recovery_policy_preview",
    description: "Preview REG-AUTOMATION-RECOVERY and POLICY resolution — no hardcoded paths",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        recoveryRegistryId: { type: "string" },
        policyRegistryId: { type: "string" },
      },
    },
    handler: async (args) =>
      resolveRecoveryPolicyPreview({
        recoveryRegistryId: args.recoveryRegistryId ? String(args.recoveryRegistryId) : undefined,
        policyRegistryId: args.policyRegistryId ? String(args.policyRegistryId) : undefined,
      }),
  },
];
