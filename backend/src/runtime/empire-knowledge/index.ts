export {
  createEmpireKnowledgeModuleContract,
  EMPIRE_KNOWLEDGE_MODULE_ID,
} from "./contract/empire-knowledge-module.js";

export {
  createKnowledgeObject,
  getKnowledgeObject,
  listKnowledgeObjects,
  countKnowledgeObjectsByType,
  findKnowledgeObjectsByCategory,
  ensureKnowledgeSeeded,
} from "./services/knowledge-object-service.js";

export {
  createKnowledgeEdge,
  listKnowledgeEdges,
  queryKnowledgeGraph,
  findRelatedObjects,
  findGraphPath,
  getGraphStats,
} from "./services/knowledge-graph-service.js";

export {
  createLearningRecord,
  listLearningRecords,
  getLearningRecord,
  listLearningsByObject,
  averageLearningConfidence,
} from "./services/learning-record-service.js";

export { reasonAboutProduct } from "./services/knowledge-reasoning-service.js";
export { buildEmpireKnowledgeDashboard, buildEsisEmpireKnowledgePayload } from "./services/empire-knowledge-dashboard-service.js";

export { registerEmpireKnowledgeRoutes } from "./routes/empire-knowledge-routes.js";
export { empireKnowledgeTools } from "./tools/empire-knowledge-tools.js";
export { resetEmpireKnowledgeRepository } from "./repositories/sqlite-empire-knowledge-repository.js";

export type { KnowledgeObject, KnowledgeObjectType } from "./models/knowledge-object.js";
export type { KnowledgeEdge, KnowledgeRelationship, GraphQueryResult } from "./models/knowledge-graph.js";
export type { LearningRecord } from "./models/learning-record.js";
export type { KnowledgeReasoningResult } from "./models/knowledge-reasoning.js";
export type { EmpireKnowledgeDashboard } from "./models/knowledge-dashboard.js";
