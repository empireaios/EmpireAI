import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { parseUxIntent } from "./intent-parser.js";
import { generateDesignProposals } from "./proposal-generator.js";
import { evaluateUx } from "./ux-reasoner.js";
import { buildPreviewPlan } from "./preview-planner.js";
import { validateUxImplementation } from "./ux-validator.js";
import { indexCockpitScreens } from "./screen-indexer.js";
import type {
  ScreenCatalogEntry,
  UxDesignResult,
  UxDesignerState,
  UxEngineeringSpec,
  UxValidationResult,
} from "./types.js";

export const UX_DESIGNER_CONTRACT_PATH = "UX_IMPLEMENTATION_CONTRACT.md";

/**
 * AI UX & Product Designer (PILLOW-UX-001 / Phase 4).
 * Screen understanding, NL UX editing, multi-proposal generation, reasoning, preview planning, validation.
 */
export class UxDesignerEngine {
  private initializedAt: string | null = null;
  private totalDesigns = 0;
  private catalog: ScreenCatalogEntry[] = [];
  private discoveredRoutes = 0;

  constructor(private readonly bootstrap: EmpireBootstrapContext) {}

  async initialize(): Promise<UxDesignerState> {
    const reader = new RepositoryReader(this.bootstrap.repositoryRoot);
    const indexed = await indexCockpitScreens(reader);
    this.catalog = indexed.catalog;
    this.discoveredRoutes = indexed.discoveredRoutes;
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): UxDesignerState {
    if (!this.initializedAt) {
      throw new Error("UX Designer not initialized. Call initialize() first.");
    }
    return {
      designerVersion: "PILLOW-UX-001",
      status: "ready",
      initializedAt: this.initializedAt,
      indexedScreens: this.catalog.length,
      totalDesigns: this.totalDesigns,
    };
  }

  getScreenCatalog(): ScreenCatalogEntry[] {
    return [...this.catalog];
  }

  findScreen(routeOrKeyword: string | null): ScreenCatalogEntry | null {
    if (!routeOrKeyword) {
      return this.catalog.find((s) => s.id === "SCR-001") ?? this.catalog[0] ?? null;
    }

    const direct = this.catalog.find(
      (s) => s.route === routeOrKeyword || s.route === `/${routeOrKeyword.replace(/^\//, "")}`,
    );
    if (direct) return direct;

    const keyword = routeOrKeyword.toLowerCase();
    return (
      this.catalog.find(
        (s) =>
          s.route.toLowerCase().includes(keyword) ||
          s.title.toLowerCase().includes(keyword) ||
          s.id.toLowerCase().includes(keyword),
      ) ?? null
    );
  }

  /** Full UX design pipeline — intent → reasoning → A/B/C proposals → preview plan. */
  designFromRequest(request: string, screenPath?: string): UxDesignResult {
    const started = performance.now();
    const intent = parseUxIntent(request, screenPath);
    const screen = this.findScreen(intent.targetScreen);
    const reasoning = evaluateUx(screen, request);
    const proposals = generateDesignProposals(intent, screen);
    const recommended = proposals[0]!;
    const previewPlan = buildPreviewPlan(screen, recommended.spec);
    const executiveBrief = formatUxExecutiveBrief(intent, screen, reasoning, proposals, previewPlan);

    this.totalDesigns += 1;

    return {
      designId: randomUUID(),
      analyzedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      intent,
      screen,
      reasoning,
      proposals,
      recommendedOption: "A",
      previewPlan,
      executiveBrief,
    };
  }

  /** Post-implementation validation against original request and spec. */
  validateImplementation(input: {
    originalRequest: string;
    spec: UxEngineeringSpec;
    changedFiles: string[];
    visualChecklist?: Partial<Record<string, boolean>>;
  }): UxValidationResult {
    return validateUxImplementation(input);
  }

  formatScreenSummary(screen: ScreenCatalogEntry): string {
    return [
      `Screen: ${screen.title} (${screen.id})`,
      `Route: ${screen.route}`,
      `Purpose: ${screen.purpose}`,
      `Business: ${screen.businessFunction}`,
      `Layout: ${screen.layout}`,
      `Components: ${screen.componentHierarchy.map((c) => c.name).join(", ")}`,
      `Data: ${screen.dataSources.join(", ")}`,
      `Backend: ${screen.backendDependencies.join(", ")}`,
    ].join("\n");
  }

  getDiscoveredRouteCount(): number {
    return this.discoveredRoutes;
  }
}

function formatUxExecutiveBrief(
  intent: UxDesignResult["intent"],
  screen: ScreenCatalogEntry | null,
  reasoning: UxDesignResult["reasoning"],
  proposals: UxDesignResult["proposals"],
  previewPlan: UxDesignResult["previewPlan"],
): string {
  const optionLines = proposals.map((p) => {
    const files = p.spec.requiredFiles.slice(0, 4).join(", ");
    return [
      `Option ${p.optionId}: ${p.name}`,
      `  ${p.description}`,
      `  Advantages: ${p.advantages.join("; ")}`,
      `  Trade-offs: ${p.tradeoffs.join("; ")}`,
      `  Files: ${files}`,
      `  Cursor mission: ${p.spec.cursorMissionSummary.split("\n")[0]}`,
    ].join("\n");
  });

  return [
    "--- AI UX Designer (PILLOW-UX-001) ---",
    `Request: ${intent.rawRequest}`,
    `Target: ${screen?.title ?? "Executive Home"} (${screen?.route ?? "/cockpit"})`,
    `Categories: ${intent.categories.join(", ")}`,
    intent.styleHint ? `Style hint: ${intent.styleHint}` : null,
    `UX score: ${reasoning.overallScore}/100`,
    `Recommendations: ${reasoning.recommendations.slice(0, 3).join("; ")}`,
    "",
    "--- Design Options (King chooses A, B, or C) ---",
    ...optionLines,
    "",
    "--- Recommended Preview (Option A) ---",
    previewPlan.visualSummary,
    `Token overrides: ${Object.entries(previewPlan.tokenOverrides).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    `Acceptance: ${proposals[0]?.spec.acceptanceCriteria.slice(0, 3).join("; ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createUxDesignerEngine(bootstrap: EmpireBootstrapContext): UxDesignerEngine {
  return new UxDesignerEngine(bootstrap);
}
