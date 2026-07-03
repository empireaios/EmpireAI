/** Phase 2 — Repository Intelligence knowledge model types. */

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
  version: "PILLOW-RI-001";
  builtAt: string;
  architecture: ArchitectureBoundary[];
  runtimeFlows: RuntimeFlow[];
  modules: CodeModuleEntry[];
  screens: ScreenRouteEntry[];
  dependencies: DependencyLink[];
  indexedPaths: number;
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
