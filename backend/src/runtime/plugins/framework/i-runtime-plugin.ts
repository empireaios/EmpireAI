import type {
  RuntimePluginCapability,
  RuntimePluginHealth,
  RuntimePluginManifest,
} from "./runtime-plugin-types.js";

/** B-001 — Contract every runtime plugin must implement. */
export interface IRuntimePlugin {
  readonly manifest: RuntimePluginManifest;

  getHealth(): RuntimePluginHealth;

  declareCapabilities(): RuntimePluginCapability[];

  supportsCapability(capabilityId: string): boolean;

  onRegister?(): void;
  onEnable?(): void;
  onDisable?(): void;
  onUnregister?(): void;
}

export abstract class BaseRuntimePlugin implements IRuntimePlugin {
  abstract readonly manifest: RuntimePluginManifest;

  declareCapabilities(): RuntimePluginCapability[] {
    return this.manifest.capabilities;
  }

  supportsCapability(capabilityId: string): boolean {
    return this.manifest.capabilities.some(
      (c) => c.capabilityId === capabilityId && c.support !== "UNSUPPORTED",
    );
  }

  getHealth(): RuntimePluginHealth {
    const blocked = this.manifest.executionState === "ARCHITECTURE_ONLY";
    return {
      state: blocked ? "BLOCKED" : this.manifest.lifecycle === "ENABLED" ? "HEALTHY" : "WARNING",
      executionBlocked: blocked,
      certificationState: this.manifest.certificationState,
      executionState: this.manifest.executionState,
      summary: `${this.manifest.displayName} v${this.manifest.version} — ${this.manifest.executionState}`,
      checkedAt: new Date().toISOString(),
    };
  }
}
