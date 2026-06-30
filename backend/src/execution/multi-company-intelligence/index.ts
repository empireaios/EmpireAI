export {
  COMPANY_STATUSES,
  companyEntrySchema,
  validateCompanyEntry,
} from "./models/company-entry.js";
export type { CompanyStatus, CompanyEntry } from "./models/company-entry.js";

export {
  CROSS_LEARNING_CATEGORIES,
  crossLearningInsightSchema,
  validateCrossLearningInsight,
} from "./models/cross-learning-insight.js";
export type { CrossLearningCategory, CrossLearningInsight } from "./models/cross-learning-insight.js";

export {
  crossBrandIntelligenceSchema,
  validateCrossBrandIntelligence,
} from "./models/cross-brand-intelligence.js";
export type { CrossBrandIntelligence } from "./models/cross-brand-intelligence.js";

export {
  PORTFOLIO_PRIORITIES,
  portfolioManagementSchema,
  validatePortfolioManagement,
} from "./models/portfolio-management.js";
export type { PortfolioPriority, PortfolioManagement } from "./models/portfolio-management.js";

export {
  MULTI_COMPANY_SIGNAL_TYPES,
  multiCompanySignalSchema,
  validateMultiCompanySignal,
} from "./models/multi-company-signal.js";
export type { MultiCompanySignalType, MultiCompanySignal } from "./models/multi-company-signal.js";

export {
  multiCompanyReportSchema,
  validateMultiCompanyReport,
} from "./models/multi-company-report.js";
export type {
  MultiCompanyReportId,
  MultiCompanyReport,
  MultiCompanyReportCreateInput,
} from "./models/multi-company-report.js";

export {
  multiCompanyRecordSchema,
  validateMultiCompanyRecord,
} from "./models/multi-company-record.js";
export type {
  MultiCompanyRecordId,
  MultiCompanyRecord,
  MultiCompanyRecordCreateInput,
} from "./models/multi-company-record.js";

export type {
  MultiCompanyIntelligenceRepositoryQuery,
  MultiCompanyIntelligenceRepository,
} from "./repositories/multi-company-intelligence-repository.js";

export {
  InMemoryMultiCompanyIntelligenceRepository,
  createInMemoryMultiCompanyIntelligenceRepository,
} from "./repositories/in-memory-multi-company-intelligence-repository.js";

export {
  MULTI_COMPANY_SIGNAL_WEIGHTS,
  generateMultiCompanyIntelligence,
  multiCompanyIntelligenceScoring,
} from "./scoring/multi-company-intelligence-scoring.js";
export type {
  MultiCompanyBrandInput,
  MultiCompanyEntryInput,
  MultiCompanyInput,
  MultiCompanyBreakdown,
} from "./scoring/multi-company-intelligence-scoring.js";

export {
  MultiCompanyIntelligenceEngine,
  defaultMultiCompanyIntelligenceEngine,
} from "./engines/multi-company-intelligence-engine.js";

export {
  MULTI_COMPANY_INTELLIGENCE_MODULE_ID,
  MULTI_COMPANY_INTELLIGENCE_MODULE_VERSION,
  MULTI_COMPANY_INTELLIGENCE_CAPABILITIES,
  MULTI_COMPANY_INTELLIGENCE_MODULE_CONTRACT,
  MultiCompanyIntelligenceModule,
  createMultiCompanyIntelligenceModule,
  multiCompanyIntelligenceModule,
} from "./contract/multi-company-intelligence-module.js";
export type {
  MultiCompanyIntelligenceModuleId,
  MultiCompanyIntelligenceCapability,
  MultiCompanyIntelligenceModuleContract,
} from "./contract/multi-company-intelligence-module.js";
