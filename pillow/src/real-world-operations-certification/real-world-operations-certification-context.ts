/** R5-20 — Real World Operations Certification context (R1–R5). */

import type { MarketplaceCertificationEngine } from "../marketplace-certification/engine.js";
import type { SupplierOperationsCertificationEngine } from "../supplier-operations-certification/engine.js";
import type { FinancialOperationsCertificationEngine } from "../financial-operations-certification/engine.js";
import type { CustomerOperationsCertificationEngine } from "../customer-operations-certification/engine.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { CrossChannelOrchestrator } from "../cross-channel-orchestrator/engine.js";
import type { AutonomousMarketingEngine } from "../autonomous-marketing-engine/engine.js";

/** Structural probe used by programme certification engines and test doubles. */
export type ProgrammeCertificationProbe = {
  getState: () => {
    missionId?: string;
    status?: string;
    health?: { status?: string; healthScore?: number };
    latestReport?: {
      overallCertificationStatus?: string;
      certificationId?: string;
    } | null;
  };
  getLatestReport?: () => {
    overallCertificationStatus?: string;
    certificationId?: string;
    evidenceReferences?: string[];
  } | null;
};

export type MarketingEngineProbe = {
  getState: () => unknown;
};

export type RealWorldOperationsCertificationContext = {
  marketplaceCertification: MarketplaceCertificationEngine | ProgrammeCertificationProbe | null;
  supplierOperationsCertification:
    | SupplierOperationsCertificationEngine
    | ProgrammeCertificationProbe
    | null;
  financialOperationsCertification:
    | FinancialOperationsCertificationEngine
    | ProgrammeCertificationProbe
    | null;
  customerOperationsCertification:
    | CustomerOperationsCertificationEngine
    | ProgrammeCertificationProbe
    | null;
  marketingFramework: MarketingFrameworkEngine | MarketingEngineProbe | null;
  campaignManager: CampaignManagerEngine | MarketingEngineProbe | null;
  crossChannelOrchestrator: CrossChannelOrchestrator | MarketingEngineProbe | null;
  autonomousMarketingEngine: AutonomousMarketingEngine | MarketingEngineProbe | null;
};

export const EMPTY_REAL_WORLD_CERTIFICATION_CONTEXT: RealWorldOperationsCertificationContext = {
  marketplaceCertification: null,
  supplierOperationsCertification: null,
  financialOperationsCertification: null,
  customerOperationsCertification: null,
  marketingFramework: null,
  campaignManager: null,
  crossChannelOrchestrator: null,
  autonomousMarketingEngine: null,
};
