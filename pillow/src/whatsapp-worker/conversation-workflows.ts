import { nextStepId, nextWorkflowId } from "./whatsapp-builder.js";
import type {
  AutomationStep,
  AutomationStepType,
  AutomationWorkflow,
  WhatsAppInput,
} from "./types.js";

export function normalizeStepType(
  value: string | null | undefined,
  allowed: AutomationStepType[],
): AutomationStepType {
  const v = (value ?? "unknown").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as AutomationStepType) : "unknown";
}

export class ConversationWorkflowEngine {
  private workflows = new Map<string, AutomationWorkflow>();

  seed(workflows: AutomationWorkflow[]) {
    this.workflows.clear();
    for (const w of workflows) {
      this.workflows.set(w.workflowId, cloneWorkflow(w));
    }
  }

  list(conversationId?: string) {
    return [...this.workflows.values()]
      .filter((w) => !conversationId || w.conversationId === conversationId)
      .map(cloneWorkflow);
  }

  get(workflowId: string) {
    const w = this.workflows.get(workflowId);
    return w ? cloneWorkflow(w) : null;
  }

  startWorkflow(params: {
    conversationId: string;
    input: WhatsAppInput;
    allowedSteps: AutomationStepType[];
    defaultSteps?: AutomationStepType[];
  }): AutomationWorkflow {
    const now = new Date().toISOString();
    const workflowId = params.input.workflowId?.trim() || nextWorkflowId();
    const stepTypes =
      params.input.workflowSteps && params.input.workflowSteps.length > 0
        ? params.input.workflowSteps
        : (params.defaultSteps ?? ["enquiry_received", "auto_reply"]);
    const steps: AutomationStep[] = stepTypes.map((type) => ({
      stepId: nextStepId(),
      stepType: normalizeStepType(type, params.allowedSteps),
      executedAt: now,
      status: "pending",
      details: `queued step ${type}`,
      relatedMessageId: null,
      relatedTemplateId: null,
    }));
    const workflow: AutomationWorkflow = {
      workflowId,
      name: params.input.workflowName?.trim() || "default_enquiry_workflow",
      conversationId: params.conversationId,
      steps,
      status: "running",
      startedAt: now,
      completedAt: null,
    };
    this.workflows.set(workflowId, workflow);
    return cloneWorkflow(workflow);
  }

  completeStep(
    workflowId: string,
    stepType: AutomationStepType,
    details: string,
    related?: { messageId?: string | null; templateId?: string | null; failed?: boolean },
  ): AutomationWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    const now = new Date().toISOString();
    const step = workflow.steps.find((s) => s.stepType === stepType && s.status === "pending")
      ?? workflow.steps.find((s) => s.stepType === stepType);
    if (step) {
      step.status = related?.failed ? "failed" : "completed";
      step.executedAt = now;
      step.details = details;
      step.relatedMessageId = related?.messageId ?? null;
      step.relatedTemplateId = related?.templateId ?? null;
    }
    const allDone = workflow.steps.every((s) => s.status !== "pending");
    if (allDone) {
      workflow.status = workflow.steps.some((s) => s.status === "failed") ? "failed" : "completed";
      workflow.completedAt = now;
    }
    this.workflows.set(workflowId, workflow);
    return cloneWorkflow(workflow);
  }

  appendStep(
    workflowId: string,
    stepType: AutomationStepType,
    details: string,
    related?: { messageId?: string | null; templateId?: string | null; failed?: boolean },
  ): AutomationWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    const now = new Date().toISOString();
    workflow.steps.push({
      stepId: nextStepId(),
      stepType,
      executedAt: now,
      status: related?.failed ? "failed" : "completed",
      details,
      relatedMessageId: related?.messageId ?? null,
      relatedTemplateId: related?.templateId ?? null,
    });
    this.workflows.set(workflowId, workflow);
    return cloneWorkflow(workflow);
  }
}

function cloneWorkflow(w: AutomationWorkflow): AutomationWorkflow {
  return {
    ...w,
    steps: w.steps.map((s) => ({ ...s })),
  };
}
