/** R5-06 — SEO Metadata Generator. */

import { SIE_CAPABILITIES, SIE_METADATA_VERSION, SEO_INTELLIGENCE_ENGINE_ID } from "./paths.js";
import type {
  OperationalState,
  SeoEngineRecord,
  SeoRecord,
  SeoRunReport,
  SeoValidationReport,
  ValidationStatus,
} from "./types.js";

export class SeoMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    journeyIntelligenceConnected: boolean;
    marketingDataPresent: boolean;
    activeProjectId: string | null;
  }): SeoEngineRecord {
    return {
      engineRecordId: `sie-${SEO_INTELLIGENCE_ENGINE_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SEO_INTELLIGENCE_ENGINE_ID,
      engineVersion: SIE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      supportedCapabilities: [...SIE_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      journeyIntelligenceConnected: input.journeyIntelligenceConnected,
      marketingDataPresent: input.marketingDataPresent,
      activeProjectId: input.activeProjectId,
      metadataVersion: SIE_METADATA_VERSION,
    };
  }

  buildSeoRecord(input: {
    websiteReference: string;
    pageReference: string;
    keywordReference: string | null;
    rankingPosition: number | null;
    seoScore: number;
    technicalIssueSummary: string;
    recommendationSummary: string;
    validationStatus: ValidationStatus;
    organicSessions?: number;
    organicClicks?: number;
    organicImpressions?: number;
  }): SeoRecord {
    return {
      seoRecordId: `sie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      websiteReference: input.websiteReference,
      pageReference: input.pageReference,
      keywordReference: input.keywordReference,
      rankingPosition: input.rankingPosition,
      seoScore: input.seoScore,
      technicalIssueSummary: input.technicalIssueSummary,
      recommendationSummary: input.recommendationSummary,
      validationStatus: input.validationStatus,
      metadataVersion: SIE_METADATA_VERSION,
      organicSessions: input.organicSessions ?? 0,
      organicClicks: input.organicClicks ?? 0,
      organicImpressions: input.organicImpressions ?? 0,
    };
  }

  buildRunReport(input: {
    action: SeoRunReport["action"];
    engineRecord: SeoEngineRecord;
    seoRecords: SeoRecord[];
    keywords: SeoRunReport["keywords"];
    issues: SeoRunReport["issues"];
    recommendations: SeoRunReport["recommendations"];
    validation: SeoValidationReport;
    durationMs: number;
  }): SeoRunReport {
    return {
      seoRunReportId: `sie-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      seoRecords: input.seoRecords,
      keywords: input.keywords,
      issues: input.issues,
      recommendations: input.recommendations,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SIE_METADATA_VERSION,
    };
  }
}
