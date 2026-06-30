import type {
  ConversionRecord,
  PixelConfig,
  RoasSnapshot,
  ServerSideEventRecord,
} from "../models/analytics-conversion-record.js";

export interface AnalyticsConversionRepository {
  savePixelConfig(config: PixelConfig): PixelConfig;
  getPixelConfig(workspaceId: string, companyId?: string): PixelConfig | null;

  saveServerEvent(event: ServerSideEventRecord): ServerSideEventRecord;
  getServerEventByCorrelation(correlationId: string, eventName: string): ServerSideEventRecord | null;
  listServerEvents(workspaceId: string, limit?: number): ServerSideEventRecord[];

  saveConversion(conversion: ConversionRecord): ConversionRecord;
  getConversionByCorrelation(correlationId: string): ConversionRecord | null;
  listConversions(workspaceId: string, companyId?: string): ConversionRecord[];

  saveRoasSnapshot(snapshot: RoasSnapshot): RoasSnapshot;
  getLatestRoasSnapshot(workspaceId: string, companyId?: string): RoasSnapshot | null;

  recordAdSpend(input: {
    workspaceId: string;
    companyId: string;
    campaignId: string;
    amountCents: number;
    currency: string;
    channel: string;
  }): void;
  sumAdSpend(workspaceId: string, companyId?: string): number;
}
