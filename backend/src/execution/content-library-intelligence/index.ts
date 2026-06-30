export {
  blogStrategySchema,
  validateBlogStrategy,
} from "./models/blog-strategy.js";
export type { BlogStrategy } from "./models/blog-strategy.js";

export {
  topicalClusterSchema,
  validateTopicalCluster,
} from "./models/topical-cluster.js";
export type { TopicalCluster } from "./models/topical-cluster.js";

export {
  pillarPageSchema,
  supportingArticleSchema,
  validatePillarPage,
  validateSupportingArticle,
} from "./models/content-pages.js";
export type { PillarPage, SupportingArticle } from "./models/content-pages.js";

export {
  faqExpansionSchema,
  buyingGuideSchema,
  comparisonPageSchema,
  evergreenContentSchema,
  validateFaqExpansion,
  validateBuyingGuide,
  validateComparisonPage,
  validateEvergreenContent,
} from "./models/content-formats.js";
export type {
  FaqExpansion,
  BuyingGuide,
  ComparisonPage,
  EvergreenContent,
} from "./models/content-formats.js";

export {
  publishingScheduleEntrySchema,
  publishingScheduleSchema,
  validatePublishingSchedule,
} from "./models/publishing-schedule.js";
export type { PublishingScheduleEntry, PublishingSchedule } from "./models/publishing-schedule.js";

export {
  CONTENT_LIBRARY_SIGNAL_TYPES,
  contentLibrarySignalSchema,
  seoCoverageReportSchema,
  validateContentLibrarySignal,
  validateSeoCoverageReport,
} from "./models/content-library-metrics.js";
export type {
  ContentLibrarySignalType,
  ContentLibrarySignal,
  SeoCoverageReport,
} from "./models/content-library-metrics.js";

export {
  contentLibrarySchema,
  validateContentLibrary,
} from "./models/content-library.js";
export type {
  ContentLibraryId,
  ContentLibrary,
  ContentLibraryCreateInput,
} from "./models/content-library.js";

export {
  contentLibraryRecordSchema,
  validateContentLibraryRecord,
} from "./models/content-library-record.js";
export type {
  ContentLibraryRecordId,
  ContentLibraryRecord,
  ContentLibraryRecordCreateInput,
} from "./models/content-library-record.js";

export type {
  ContentLibraryRepositoryQuery,
  ContentLibraryRepository,
} from "./repositories/content-library-repository.js";

export {
  InMemoryContentLibraryRepository,
  createInMemoryContentLibraryRepository,
} from "./repositories/in-memory-content-library-repository.js";

export {
  CONTENT_LIBRARY_SIGNAL_WEIGHTS,
  generateContentLibrary,
  contentLibraryIntelligenceScoring,
} from "./scoring/content-library-intelligence-scoring.js";
export type {
  ContentLibraryBrandInput,
  ContentLibraryOfferInput,
  ContentLibraryInput,
  ContentLibraryBreakdown,
} from "./scoring/content-library-intelligence-scoring.js";

export {
  ContentLibraryIntelligenceEngine,
  defaultContentLibraryIntelligenceEngine,
} from "./engines/content-library-intelligence-engine.js";

export {
  CONTENT_LIBRARY_INTELLIGENCE_MODULE_ID,
  CONTENT_LIBRARY_INTELLIGENCE_MODULE_VERSION,
  CONTENT_LIBRARY_INTELLIGENCE_CAPABILITIES,
  CONTENT_LIBRARY_INTELLIGENCE_MODULE_CONTRACT,
  ContentLibraryIntelligenceModule,
  createContentLibraryIntelligenceModule,
  contentLibraryIntelligenceModule,
} from "./contract/content-library-intelligence-module.js";
export type {
  ContentLibraryIntelligenceModuleId,
  ContentLibraryIntelligenceCapability,
  ContentLibraryIntelligenceModuleContract,
} from "./contract/content-library-intelligence-module.js";
