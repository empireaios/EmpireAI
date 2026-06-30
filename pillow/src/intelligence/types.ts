/** PILLOW-003 — Repository Intelligence types. */

export type IntelligenceClassification =
  | "constitution"
  | "doctrine"
  | "journey"
  | "journey_audit"
  | "architecture"
  | "contract"
  | "reality_owner"
  | "executive_audit"
  | "decision"
  | "backlog"
  | "enhancement_register"
  | "bootstrap"
  | "pillow"
  | "ux"
  | "global_component"
  | "executive_component"
  | "operational_document"
  | "commercial_spine"
  | "governance"
  | "unknown";

export type RelationshipType =
  | "owns"
  | "depends_on"
  | "implements"
  | "references"
  | "governs"
  | "part_of"
  | "documents"
  | "blocks"
  | "synchronizes_with";

export type DependencyKind =
  | "mission"
  | "owner"
  | "contract"
  | "architecture"
  | "commercial"
  | "governance"
  | "synchronization";

export interface ClassifiedEntity {
  id: string;
  classification: IntelligenceClassification;
  label: string;
  path?: string;
  phase?: string;
  status?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface RelationshipEdge {
  from: string;
  to: string;
  type: RelationshipType;
  source: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
  source: string;
}

export type HealthIssueSeverity = "info" | "warning" | "error";

export interface HealthIssue {
  code: string;
  severity: HealthIssueSeverity;
  message: string;
  entityId?: string;
  recommendation: string;
}

export interface RepositoryHealthReport {
  score: number;
  issues: HealthIssue[];
  indicators: {
    totalEntities: number;
    missingOwnerReferences: number;
    brokenDependencyChains: number;
    duplicateOwnership: number;
    orphanedArtifacts: number;
    architectureDriftSignals: number;
    missingJourneyReferences: number;
    missingDocumentation: number;
  };
}

export interface GraphSummary {
  nodeCount: number;
  edgeCount: number;
  dependencyCount: number;
  byClassification: Partial<Record<IntelligenceClassification, number>>;
}

export interface RepositoryIntelligenceContext {
  intelligenceVersion: "PILLOW-003";
  status: "ready";
  completedAt: string;
  durationMs: number;
  bootstrapVersion: "PILLOW-002";
  entities: ClassifiedEntity[];
  relationships: RelationshipEdge[];
  dependencies: DependencyEdge[];
  health: RepositoryHealthReport;
  graphSummary: GraphSummary;
}

export interface QueryAnswer {
  question: string;
  answer: string;
  entities: ClassifiedEntity[];
  relationships: RelationshipEdge[];
  dependencies: DependencyEdge[];
  sources: string[];
}

export interface QueryResult {
  matched: boolean;
  answers: QueryAnswer[];
}
