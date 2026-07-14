/** T2-02 — Design system metadata generation. */

import { DESIGN_SYSTEM_METADATA_VERSION } from "./paths.js";
import type { DesignSystemComponent, DesignSystemModel } from "./types.js";

export class DesignSystemMetadataGenerator {
  buildDesignSystemId(sessionId: string): string {
    return `dsi-${sessionId}-${Date.now()}`;
  }

  buildComponentName(componentType: string, label: string | null): string {
    if (label?.trim()) return label.trim();
    return componentType.replace(/_/g, " ");
  }

  enrichComponent(component: DesignSystemComponent): DesignSystemComponent {
    return {
      ...component,
      metadataVersion: DESIGN_SYSTEM_METADATA_VERSION,
      version: component.version || "1.0.0",
    };
  }

  validateModelMetadata(model: DesignSystemModel): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!model.designSystemId) errors.push("Missing designSystemId");
    if (!model.version) errors.push("Missing version");
    if (!model.timestamp) errors.push("Missing timestamp");
    if (!model.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }

  bumpVersion(current: string | null): string {
    if (!current) return "1.0.0";
    const parts = current.split(".").map((p) => Number.parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "1.0.0";
    parts[2] = (parts[2] ?? 0) + 1;
    return parts.join(".");
  }
}
