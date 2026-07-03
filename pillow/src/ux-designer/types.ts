/** PILLOW-UX-001 — AI UX & Product Designer types (Phase 4). */

export type UxDesignStyle =
  | "empire_gold"
  | "premium_minimal"
  | "apple_clean"
  | "futuristic_neon"
  | "high_contrast"
  | "custom";

export type UxChangeCategory =
  | "colour"
  | "spacing"
  | "layout"
  | "typography"
  | "component"
  | "navigation"
  | "animation"
  | "responsive"
  | "accessibility"
  | "branding";

export interface ScreenComponentNode {
  name: string;
  path: string;
  role: string;
}

export interface ScreenCatalogEntry {
  id: string;
  route: string;
  pagePath: string;
  title: string;
  purpose: string;
  businessFunction: string;
  department: string;
  componentHierarchy: ScreenComponentNode[];
  layout: string;
  navigation: string[];
  stateSources: string[];
  dataSources: string[];
  frontendOwner: string;
  backendDependencies: string[];
}

export interface UxDesignIntent {
  rawRequest: string;
  targetScreen: string | null;
  categories: UxChangeCategory[];
  styleHint: UxDesignStyle | null;
  keywords: string[];
  summary: string;
}

export interface UxEngineeringSpec {
  objective: string;
  affectedScreens: string[];
  affectedComponents: string[];
  requiredFiles: string[];
  layoutChanges: string[];
  designTokens: Record<string, string>;
  animations: string[];
  colourPalette: Record<string, string>;
  responsiveBehaviour: string[];
  tailwindClasses: string[];
  acceptanceCriteria: string[];
  cursorMissionSummary: string;
}

export interface UxDesignProposal {
  optionId: "A" | "B" | "C";
  name: string;
  description: string;
  advantages: string[];
  tradeoffs: string[];
  spec: UxEngineeringSpec;
}

export interface UxReasoningReport {
  clarity: number;
  usability: number;
  consistency: number;
  branding: number;
  informationHierarchy: number;
  navigation: number;
  accessibility: number;
  mobileResponsiveness: number;
  executiveWorkflow: number;
  businessEffectiveness: number;
  overallScore: number;
  recommendations: string[];
}

export interface UxPreviewPlan {
  screenId: string;
  route: string;
  visualSummary: string;
  componentChanges: Array<{ component: string; change: string }>;
  tokenOverrides: Record<string, string>;
  breakpointNotes: string[];
  previewNotes: string[];
}

export interface UxValidationResult {
  layoutMatches: boolean;
  stylingMatches: boolean;
  responsiveMatches: boolean;
  componentBehaviourMatches: boolean;
  visualConsistencyMatches: boolean;
  designIntentMatches: boolean;
  businessWorkflowMatches: boolean;
  findings: string[];
  blockers: string[];
  passed: boolean;
}

export interface UxDesignResult {
  designId: string;
  analyzedAt: string;
  durationMs: number;
  intent: UxDesignIntent;
  screen: ScreenCatalogEntry | null;
  reasoning: UxReasoningReport;
  proposals: UxDesignProposal[];
  recommendedOption: "A" | "B" | "C";
  previewPlan: UxPreviewPlan;
  executiveBrief: string;
}

export interface UxDesignerState {
  designerVersion: "PILLOW-UX-001";
  status: "ready";
  initializedAt: string;
  indexedScreens: number;
  totalDesigns: number;
}
