/**
 * G2-09 — Commerce plugin lifecycle and record state.
 */

import type {
  CommercePluginLifecyclePhase,
  CommercePluginRecord,
  CommercePluginStatus,
} from "../contracts/commerce-plugin-integration-types.js";

const pluginRecords = new Map<string, CommercePluginRecord>();
const lifecyclePhases = new Map<string, CommercePluginLifecyclePhase>();

const STATUS_BY_PHASE: Partial<Record<CommercePluginLifecyclePhase, CommercePluginStatus>> = {
  discover: "draft",
  validate: "validated",
  register: "registered",
  load: "loaded",
  enable: "enabled",
  execute: "executing",
  monitor: "monitored",
  disable: "disabled",
  unload: "unloaded",
  deprecate: "deprecated",
  retire: "retired",
};

export function saveCommercePluginRecord(record: CommercePluginRecord): void {
  pluginRecords.set(record.pluginId, record);
  lifecyclePhases.set(record.pluginId, record.lifecyclePhase);
}

export function getCommercePluginRecordById(pluginId: string): CommercePluginRecord | undefined {
  return pluginRecords.get(pluginId);
}

export function listCommercePluginRecords(): CommercePluginRecord[] {
  return [...pluginRecords.values()];
}

export function getCommercePluginLifecyclePhase(pluginId: string): CommercePluginLifecyclePhase {
  return lifecyclePhases.get(pluginId) ?? "discover";
}

export function updateCommercePluginLifecyclePhase(
  pluginId: string,
  phase: CommercePluginLifecyclePhase,
): CommercePluginRecord | undefined {
  const record = pluginRecords.get(pluginId);
  if (!record) return undefined;

  const status = STATUS_BY_PHASE[phase] ?? record.status;
  const updated: CommercePluginRecord = {
    ...record,
    lifecyclePhase: phase,
    status,
  };
  pluginRecords.set(pluginId, updated);
  lifecyclePhases.set(pluginId, phase);
  return updated;
}

export function resetCommercePluginStateForTests(): void {
  pluginRecords.clear();
  lifecyclePhases.clear();
}
