import type { ToolRuntimeConfiguration } from "./configuration.js";
import { TOOLRT_METADATA_VERSION } from "./paths.js";
import type { ToolStore } from "./tool-store.js";
import type { ToolCategory, ToolRegistration, ToolrtInput } from "./types.js";

export class ToolRegistry {
  /** Deterministic registration keyed by toolId — upserts structural tool record. */
  registerTool(
    store: ToolStore,
    input: ToolrtInput,
    _config: ToolRuntimeConfiguration,
  ): ToolRegistration {
    const toolId = input.toolId!;
    const existing = store.getTool(toolId);
    const highRisk =
      input.highRisk ??
      existing?.permissionPolicy.highRisk ??
      false;
    const allowedActions =
      input.allowedActions ??
      existing?.permissionPolicy.allowedActions ??
      ["status", "invoke", "list"];

    const tool: ToolRegistration = {
      toolId,
      toolName: input.toolName ?? existing?.toolName ?? toolId,
      toolCategory: (input.toolCategory ??
        existing?.toolCategory ??
        "custom_extension") as ToolCategory,
      provider: input.provider ?? existing?.provider ?? `${toolId}-provider`,
      version: input.version ?? existing?.version ?? "v1",
      authMethod: input.authMethod ?? existing?.authMethod ?? "none",
      credentialReference:
        input.credentialReference ?? existing?.credentialReference ?? "cred://vault/none",
      permissionPolicy: {
        allowedActions: [...allowedActions],
        requiresPillowConfirmation:
          input.requiresPillowConfirmation ??
          existing?.permissionPolicy.requiresPillowConfirmation ??
          true,
        requiresGrandKingApproval:
          input.requiresGrandKingApproval ??
          existing?.permissionPolicy.requiresGrandKingApproval ??
          highRisk,
        highRisk,
      },
      connectionStatus: existing?.connectionStatus ?? "disconnected",
      availabilityStatus: existing?.availabilityStatus ?? "unknown",
      auditReference: existing?.auditReference ?? `audit://tool-runtime/${toolId}`,
      metadataVersion: TOOLRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
    store.saveTool(tool);
    return store.getTool(toolId)!;
  }

  getTool(store: ToolStore, toolId: string) {
    return store.getTool(toolId);
  }

  listTools(store: ToolStore) {
    return store.listTools();
  }
}
