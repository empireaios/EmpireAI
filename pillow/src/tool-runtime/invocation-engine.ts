import type { ToolRuntimeDependencies } from "./integrations.js";
import type { ToolRegistration, ToolrtInput } from "./types.js";

export type InvocationResult = {
  status: "success" | "failed";
  resultRef: string;
  liveExecution: boolean;
  errorClass: string | null;
};

/**
 * Invoke approved tool actions. Structural resultRef when no adapter is bound.
 * NEVER invents business payloads.
 */
export class InvocationEngine {
  invoke(
    tool: ToolRegistration,
    input: ToolrtInput,
    invocationId: string,
    deps: ToolRuntimeDependencies = {},
  ): InvocationResult {
    const requestRef =
      input.requestRef ?? `request://structural/${tool.toolId}/${input.action ?? "invoke"}`;

    if (deps.toolAdapter?.execute) {
      const adapterResult = deps.toolAdapter.execute({
        toolId: tool.toolId,
        toolName: tool.toolName,
        action: input.action ?? "invoke",
        requestRef,
        credentialReference: tool.credentialReference,
      });
      return {
        status: adapterResult.status === "success" ? "success" : "failed",
        resultRef: adapterResult.resultRef,
        liveExecution: true,
        errorClass: adapterResult.status === "success" ? null : "adapter_failure",
      };
    }

    // Structural invocation only — NEVER invent business result payloads
    return {
      status: "success",
      resultRef: `result://structural/${invocationId}`,
      liveExecution: false,
      errorClass: null,
    };
  }
}
