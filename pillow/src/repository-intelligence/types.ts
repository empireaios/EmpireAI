/** Phase 2 — Repository Intelligence knowledge model types (extended PILLOW-RI-002). */

export type CriticalityLevel = "critical" | "high" | "medium" | "low";

export type SystemLayer =
  | "frontend"
  | "bff"
  | "brain"
  | "pillow"
  | "redis"
  | "worker"
  | "database"
  | "deployment"
  | "governance"
  | "automation"
  | "business_engine";

export interface ArchitectureBoundary {
  id: string;
  name: string;
  layer: SystemLayer;
  owner: string;
  rootPath: string;
  responsibilities: string[];
  dependsOn: string[];
}

export interface RuntimeFlowStep {
  order: number;
  component: string;
  description: string;
}

export interface RuntimeFlow {
  id: string;
  name: string;
  steps: RuntimeFlowStep[];
}

export interface CodeModuleEntry {
  id: string;
  name: string;
  layer: SystemLayer;
  rootPath: string;
  owner: string;
  missionHint?: string;
  entryFiles: string[];
}

export interface ScreenRouteEntry {
  route: string;
  componentPath: string;
  description: string;
}

export interface DependencyLink {
  from: string;
  to: string;
  kind: "imports" | "proxies" | "deploys" | "owns" | "runtime";
  critical: boolean;
}

export interface RepositoryKnowledgeModel {
  version: "PILLOW-RI-002";
  builtAt: string;
  architecture: ArchitectureBoundary[];
  runtimeFlows: RuntimeFlow[];
  modules: CodeModuleEntry[];
  screens: ScreenRouteEntry[];
  dependencies: DependencyLink[];
  indexedPaths: number;
  domains: RepositoryDomainSummary[];
  criticalPaths: string[];
  missions: MissionRegistryEntry[];
  architectureIntelligence: RepositoryArchitectureIntelligence;
}

export interface RepositoryInventory {
  topLevelFolders: string[];
  packages: Array<{ name: string; path: string }>;
  fileCounts: Record<string, number>;
  totalIndexedFiles: number;
  services: string[];
  apis: string[];
  uiSurfaces: string[];
  businessEngines: string[];
  pillowModules: string[];
  infrastructurePaths: string[];
  testPaths: string[];
  documentationPaths: string[];
}

export interface ComponentIntelligence {
  id: string;
  name: string;
  layer: SystemLayer;
  owner: string;
  rootPath: string;
  purpose: string;
  responsibilities: string[];
  publicInterfaces: string[];
  internalInterfaces: string[];
  dependencies: string[];
  dependents: string[];
  executionEntryPoints: string[];
  businessEngineRelation: string | null;
  pillowRelation: string | null;
  criticality: CriticalityLevel;
}

export interface FolderIntelligence {
  path: string;
  purpose: string;
  owner: string;
  responsibilities: string[];
  interfaces: string[];
  dependencies: string[];
  relatedTests: string[];
  businessRelevance: string;
  editingBoundaries: string;
  fileCount: number;
}

export interface FileIntelligenceEntry {
  path: string;
  purpose: string;
  responsibilities: string[];
  ownedCapability: string;
  imports: string[];
  exports: string[];
  consumers: string[];
  dependencyChain: string[];
  riskLevel: CriticalityLevel;
}

export interface DependencyGraphIntelligence {
  nodes: string[];
  edges: DependencyLink[];
  incoming: Record<string, string[]>;
  outgoing: Record<string, string[]>;
  circularDependencies: string[][];
  unusedComponents: string[];
  duplicatedResponsibilities: string[];
  architecturalHotspots: Array<{ id: string; score: number; reason: string }>;
}

export interface ImpactAnalysisResult {
  target: string;
  affectedFolders: string[];
  affectedFiles: string[];
  affectedComponents: string[];
  dependencyImpact: string[];
  requiredTests: string[];
  architecturalRisks: string[];
  recommendation: string;
}

export interface RepositoryArchitectureIntelligence {
  inventory: RepositoryInventory;
  components: ComponentIntelligence[];
  folders: FolderIntelligence[];
  files: FileIntelligenceEntry[];
  dependencyGraph: DependencyGraphIntelligence;
  executionFlows: RuntimeFlow[];
  searchIndex: Array<{ id: string; kind: string; label: string; path: string; snippet: string }>;
}

export interface RepositoryArchitectureCockpitSnapshot {
  computedAt: string;
  version: string;
  inventorySummary: string;
  componentCount: number;
  folderCount: number;
  fileCount: number;
  flowCount: number;
  hotspotCount: number;
  circularDependencyCount: number;
  criticalComponents: ComponentIntelligence[];
  executionFlows: RuntimeFlow[];
  dependencyHotspots: DependencyGraphIntelligence["architecturalHotspots"];
  inventory: RepositoryInventory;
  components: ComponentIntelligence[];
  folders: FolderIntelligence[];
  files: FileIntelligenceEntry[];
  dependencyGraph: DependencyGraphIntelligence;
  searchIndex: RepositoryArchitectureIntelligence["searchIndex"];
  grandKingSummary: string;
}

export interface RepositoryDomainSummary {
  id: string;
  name: string;
  rootPath: string;
  artifactCount: number;
  description: string;
}

export interface MissionRegistryEntry {
  id: string;
  name: string;
  rootPath: string;
  layer: string;
}

export interface RepositoryKnowledgeQueryAnswer {
  question: string;
  answer: string;
  sources: string[];
  confidence: "high" | "medium";
}

export interface RepositoryKnowledgeQueryResult {
  matched: boolean;
  answers: RepositoryKnowledgeQueryAnswer[];
}
