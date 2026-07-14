import type {
  VisualGenerationProviderId,
  VisualGenerationRequest,
  VisualGenerationResult,
} from "../models/visual-generation-types.js";
import { getCanvaConnectService } from "../../../execution/canva-connect-connector/services/canva-connect-service.js";
import { getCanvaHealthStatus } from "../../../execution/canva-connect-connector/services/canva-oauth-service.js";

export interface VisualProviderAdapter {
  providerId: VisualGenerationProviderId;
  createVisualAsset(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  createDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  searchDesigns(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  duplicateDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  uploadAsset(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  exportDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult>;
  getHealth(workspaceId: string, companyId: string): Promise<{
    connected: boolean;
    healthy: boolean;
    mock: boolean;
    lastError: string | null;
  }>;
}

function buildResult(
  partial: Omit<VisualGenerationResult, "jobId" | "createdAt"> & { jobId?: string },
): VisualGenerationResult {
  return {
    jobId: partial.jobId ?? `vgl-${Date.now()}`,
    provider: partial.provider,
    status: partial.status,
    useCase: partial.useCase,
    designId: partial.designId,
    assetIds: partial.assetIds,
    exportFormat: partial.exportFormat,
    exportLocation: partial.exportLocation,
    errors: partial.errors,
    warnings: partial.warnings,
    usageMetadata: partial.usageMetadata,
    createdAt: new Date().toISOString(),
  };
}

/** Canva provider adapter — internal to Visual Generation Layer only. */
export class CanvaVisualProvider implements VisualProviderAdapter {
  readonly providerId = "canva" as const;

  async createVisualAsset(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    const design = await getCanvaConnectService().createDesign({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      title: request.title ?? request.prompt ?? "EmpireAI Visual Asset",
    });
    const exported = await getCanvaConnectService().exportDesign({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      designId: design.designId,
      format: request.format ?? "png",
    });

    return buildResult({
      provider: "canva",
      status: exported.status === "failed" ? "failed" : "success",
      useCase: request.useCase,
      designId: design.designId,
      assetIds: [],
      exportFormat: exported.format,
      exportLocation: exported.downloadUrl,
      errors: exported.status === "failed" ? ["Export failed"] : [],
      warnings: [],
      usageMetadata: {
        mock: exported.downloadUrl?.startsWith("mock://") ?? false,
        providerCostCents: null,
        operation: "create_visual_asset",
      },
    });
  }

  async createDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    const design = await getCanvaConnectService().createDesign({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      title: request.title ?? "EmpireAI Design",
    });
    return buildResult({
      provider: "canva",
      status: "success",
      useCase: request.useCase,
      designId: design.designId,
      assetIds: [],
      exportFormat: null,
      exportLocation: design.thumbnailUrl,
      errors: [],
      warnings: [],
      usageMetadata: { mock: false, providerCostCents: null, operation: "create_design" },
    });
  }

  async searchDesigns(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    const designs = await getCanvaConnectService().searchDesigns({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      query: request.query ?? request.prompt ?? "",
    });
    return buildResult({
      provider: "canva",
      status: "success",
      useCase: request.useCase,
      designId: designs[0]?.designId ?? null,
      assetIds: [],
      exportFormat: null,
      exportLocation: null,
      errors: [],
      warnings: designs.length === 0 ? ["No designs matched query"] : [],
      usageMetadata: { mock: false, providerCostCents: null, operation: "search_designs" },
    });
  }

  async duplicateDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    if (!request.designId) {
      return buildResult({
        provider: "canva",
        status: "failed",
        useCase: request.useCase,
        designId: null,
        assetIds: [],
        exportFormat: null,
        exportLocation: null,
        errors: ["designId is required"],
        warnings: [],
        usageMetadata: { mock: false, providerCostCents: null, operation: "duplicate_design" },
      });
    }
    const design = await getCanvaConnectService().duplicateDesign({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      designId: request.designId,
    });
    return buildResult({
      provider: "canva",
      status: "success",
      useCase: request.useCase,
      designId: design.designId,
      assetIds: [],
      exportFormat: null,
      exportLocation: design.thumbnailUrl,
      errors: [],
      warnings: [],
      usageMetadata: { mock: false, providerCostCents: null, operation: "duplicate_design" },
    });
  }

  async uploadAsset(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    if (!request.asset) {
      return buildResult({
        provider: "canva",
        status: "failed",
        useCase: request.useCase,
        designId: null,
        assetIds: [],
        exportFormat: null,
        exportLocation: null,
        errors: ["asset payload is required"],
        warnings: [],
        usageMetadata: { mock: false, providerCostCents: null, operation: "upload_asset" },
      });
    }
    const asset = await getCanvaConnectService().uploadAsset({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      asset: request.asset,
    });
    return buildResult({
      provider: "canva",
      status: "success",
      useCase: request.useCase,
      designId: null,
      assetIds: [asset.assetId],
      exportFormat: null,
      exportLocation: asset.url,
      errors: [],
      warnings: [],
      usageMetadata: { mock: asset.url?.startsWith("mock://") ?? false, providerCostCents: null, operation: "upload_asset" },
    });
  }

  async exportDesign(request: VisualGenerationRequest): Promise<VisualGenerationResult> {
    if (!request.designId) {
      return buildResult({
        provider: "canva",
        status: "failed",
        useCase: request.useCase,
        designId: null,
        assetIds: [],
        exportFormat: request.format ?? null,
        exportLocation: null,
        errors: ["designId is required"],
        warnings: [],
        usageMetadata: { mock: false, providerCostCents: null, operation: "export_design" },
      });
    }
    const exported = await getCanvaConnectService().exportDesign({
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      designId: request.designId,
      format: request.format ?? "png",
    });
    return buildResult({
      provider: "canva",
      status: exported.status === "failed" ? "failed" : exported.status === "in_progress" ? "in_progress" : "success",
      useCase: request.useCase,
      designId: request.designId,
      assetIds: [],
      exportFormat: exported.format,
      exportLocation: exported.downloadUrl,
      errors: exported.status === "failed" ? ["Export failed"] : [],
      warnings: [],
      usageMetadata: { mock: exported.downloadUrl?.startsWith("mock://") ?? false, providerCostCents: null, operation: "export_design" },
    });
  }

  async getHealth(workspaceId: string, companyId: string) {
    const health = await getCanvaHealthStatus(workspaceId, companyId);
    return {
      connected: health.connected,
      healthy: health.connected && health.tokenValid,
      mock: health.mock,
      lastError: health.lastError,
    };
  }
}

const providers = new Map<VisualGenerationProviderId, VisualProviderAdapter>([
  ["canva", new CanvaVisualProvider()],
]);

export const DEFAULT_VISUAL_PROVIDER: VisualGenerationProviderId = "canva";

export function getVisualProvider(providerId: VisualGenerationProviderId = DEFAULT_VISUAL_PROVIDER): VisualProviderAdapter {
  const provider = providers.get(providerId);
  if (!provider) throw new Error(`Unknown visual provider: ${providerId}`);
  return provider;
}

export function listVisualProviders(): VisualGenerationProviderId[] {
  return [...providers.keys()];
}
