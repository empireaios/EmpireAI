import type { CanvaExportFormat } from "../models/canva-records.js";
import {
  getCanvaConnectApiClient,
  type CanvaAssetSummary,
  type CanvaDesignSummary,
  type CanvaExportJob,
} from "./canva-connect-api-client.js";
import { resolveCanvaAccessToken } from "./canva-oauth-service.js";

export type CanvaDesignOperationInput = {
  workspaceId: string;
  companyId: string;
  title?: string;
  designId?: string;
  query?: string;
  format?: CanvaExportFormat;
  asset?: { name: string; mimeType: string; base64Data: string };
};

/** Internal Canva design operations — consumed only by Visual Generation Layer. */
export class CanvaConnectService {
  async createDesign(input: CanvaDesignOperationInput): Promise<CanvaDesignSummary> {
    const { accessToken } = await resolveCanvaAccessToken(input.workspaceId, input.companyId);
    return getCanvaConnectApiClient().createDesign(accessToken, input.title ?? "EmpireAI Design");
  }

  async searchDesigns(input: CanvaDesignOperationInput): Promise<CanvaDesignSummary[]> {
    const { accessToken } = await resolveCanvaAccessToken(input.workspaceId, input.companyId);
    return getCanvaConnectApiClient().searchDesigns(accessToken, input.query ?? "");
  }

  async duplicateDesign(input: CanvaDesignOperationInput): Promise<CanvaDesignSummary> {
    if (!input.designId) throw new Error("designId is required to duplicate a design");
    const { accessToken } = await resolveCanvaAccessToken(input.workspaceId, input.companyId);
    return getCanvaConnectApiClient().duplicateDesign(accessToken, input.designId);
  }

  async uploadAsset(input: CanvaDesignOperationInput): Promise<CanvaAssetSummary> {
    if (!input.asset) throw new Error("asset payload is required");
    const { accessToken } = await resolveCanvaAccessToken(input.workspaceId, input.companyId);
    return getCanvaConnectApiClient().uploadAsset(accessToken, input.asset);
  }

  async exportDesign(input: CanvaDesignOperationInput): Promise<CanvaExportJob> {
    if (!input.designId) throw new Error("designId is required to export");
    const format = input.format ?? "png";
    const { accessToken } = await resolveCanvaAccessToken(input.workspaceId, input.companyId);
    return getCanvaConnectApiClient().exportDesign(accessToken, input.designId, format);
  }
}

let serviceInstance: CanvaConnectService | null = null;

export function getCanvaConnectService(): CanvaConnectService {
  if (!serviceInstance) serviceInstance = new CanvaConnectService();
  return serviceInstance;
}

export function resetCanvaConnectService(): void {
  serviceInstance = null;
}
