export {
  EMAIL_FLOW_TYPES,
  EMAIL_FLOW_LABELS,
  emailFlowTypeSchema,
  validateEmailFlowType,
} from "./models/email-flow-types.js";
export type { EmailFlowType } from "./models/email-flow-types.js";

export {
  EMAIL_FLOW_STATUSES,
  emailFlowSchema,
  validateEmailFlow,
} from "./models/email-flow.js";
export type { EmailFlowStatus, EmailFlow } from "./models/email-flow.js";

export {
  emailSubjectLineSchema,
  validateEmailSubjectLine,
} from "./models/email-subject-line.js";
export type { EmailSubjectLine } from "./models/email-subject-line.js";

export { emailCopySchema, validateEmailCopy } from "./models/email-copy.js";
export type { EmailCopy } from "./models/email-copy.js";

export {
  CAMPAIGN_CALENDAR_STATUSES,
  campaignCalendarEntrySchema,
  validateCampaignCalendarEntry,
} from "./models/campaign-calendar.js";
export type { CampaignCalendarStatus, CampaignCalendarEntry } from "./models/campaign-calendar.js";

export {
  EMAIL_MARKETING_SIGNAL_TYPES,
  emailMarketingSignalSchema,
  validateEmailMarketingSignal,
} from "./models/email-marketing-signal.js";
export type { EmailMarketingSignalType, EmailMarketingSignal } from "./models/email-marketing-signal.js";

export {
  emailMarketingBlueprintSchema,
  validateEmailMarketingBlueprint,
} from "./models/email-marketing-blueprint.js";
export type {
  EmailMarketingBlueprintId,
  EmailMarketingBlueprint,
  EmailMarketingBlueprintCreateInput,
} from "./models/email-marketing-blueprint.js";

export {
  emailMarketingRecordSchema,
  validateEmailMarketingRecord,
} from "./models/email-marketing-record.js";
export type {
  EmailMarketingRecordId,
  EmailMarketingRecord,
  EmailMarketingRecordCreateInput,
} from "./models/email-marketing-record.js";

export type {
  EmailMarketingRepositoryQuery,
  EmailMarketingRepository,
} from "./repositories/email-marketing-repository.js";

export {
  InMemoryEmailMarketingRepository,
  createInMemoryEmailMarketingRepository,
} from "./repositories/in-memory-email-marketing-repository.js";

export {
  EMAIL_MARKETING_SIGNAL_WEIGHTS,
  generateEmailMarketingBlueprint,
  emailMarketingIntelligenceScoring,
} from "./scoring/email-marketing-intelligence-scoring.js";
export type {
  EmailMarketingBrandInput,
  EmailMarketingOfferInput,
  EmailMarketingInput,
  EmailMarketingBreakdown,
} from "./scoring/email-marketing-intelligence-scoring.js";

export {
  EmailMarketingIntelligenceEngine,
  defaultEmailMarketingIntelligenceEngine,
} from "./engines/email-marketing-intelligence-engine.js";

export {
  EMAIL_MARKETING_INTELLIGENCE_MODULE_ID,
  EMAIL_MARKETING_INTELLIGENCE_MODULE_VERSION,
  EMAIL_MARKETING_INTELLIGENCE_CAPABILITIES,
  EMAIL_MARKETING_INTELLIGENCE_MODULE_CONTRACT,
  EmailMarketingIntelligenceModule,
  createEmailMarketingIntelligenceModule,
  emailMarketingIntelligenceModule,
} from "./contract/email-marketing-intelligence-module.js";
export type {
  EmailMarketingIntelligenceModuleId,
  EmailMarketingIntelligenceCapability,
  EmailMarketingIntelligenceModuleContract,
} from "./contract/email-marketing-intelligence-module.js";
