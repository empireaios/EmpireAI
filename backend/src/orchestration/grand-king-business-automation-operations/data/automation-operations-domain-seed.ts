/**
 * G7-03 — Grand King automation domain seed (registry-driven domain map).
 */

import type { AutomationOperationDomainId } from "../../../registry/types/automation-operations-registry-types.js";

export type AutomationOperationsDomainDefinition = {
  domainId: AutomationOperationDomainId;
  domainName: string;
  primaryRegistryId:
    | "REG-AUTOMATION-WORKFLOW"
    | "REG-AUTOMATION-POLICY"
    | "REG-AUTOMATION-EXECUTOR"
    | "REG-AUTOMATION-APPROVAL"
    | "REG-AUTOMATION-RECOVERY"
    | "REG-READINESS-POLICY";
};

export const AUTOMATION_OPERATIONS_DOMAIN_SEED: AutomationOperationsDomainDefinition[] = [
  { domainId: "trigger_engine", domainName: "Trigger Engine", primaryRegistryId: "REG-AUTOMATION-WORKFLOW" },
  { domainId: "workflow_scheduler", domainName: "Workflow Scheduler", primaryRegistryId: "REG-AUTOMATION-WORKFLOW" },
  { domainId: "workflow_orchestrator", domainName: "Workflow Orchestrator", primaryRegistryId: "REG-AUTOMATION-WORKFLOW" },
  { domainId: "execution_broker", domainName: "Execution Broker", primaryRegistryId: "REG-AUTOMATION-EXECUTOR" },
  { domainId: "approval_router", domainName: "Approval Router", primaryRegistryId: "REG-AUTOMATION-APPROVAL" },
  { domainId: "recovery_engine", domainName: "Recovery Engine", primaryRegistryId: "REG-AUTOMATION-RECOVERY" },
  { domainId: "automation_centre", domainName: "Automation Centre", primaryRegistryId: "REG-AUTOMATION-POLICY" },
  { domainId: "outcome_learning", domainName: "Outcome Learning", primaryRegistryId: "REG-READINESS-POLICY" },
  { domainId: "plugin_execution", domainName: "Plugin Execution", primaryRegistryId: "REG-AUTOMATION-EXECUTOR" },
  { domainId: "executive_monitoring", domainName: "Executive Monitoring", primaryRegistryId: "REG-AUTOMATION-POLICY" },
];
