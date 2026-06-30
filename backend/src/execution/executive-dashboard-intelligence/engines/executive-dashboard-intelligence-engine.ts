import type { ExecutiveDashboardRecord } from "../models/executive-dashboard-record.js";
import type { ExecutiveDashboardIntelligenceRepository } from "../repositories/executive-dashboard-intelligence-repository.js";
import {
  generateExecutiveDashboard,
  type ExecutiveDashboardInput,
} from "../scoring/executive-dashboard-intelligence-scoring.js";

/** Generates executive dashboard intelligence from brand and metrics inputs. */
export class ExecutiveDashboardIntelligenceEngine {
  constructor(private readonly repository: ExecutiveDashboardIntelligenceRepository) {}

  generateDashboard(input: ExecutiveDashboardInput) {
    return generateExecutiveDashboard(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: ExecutiveDashboardInput,
  ): Promise<ExecutiveDashboardRecord> {
    const breakdown = generateExecutiveDashboard(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultExecutiveDashboardIntelligenceEngine = {
  generateDashboard: generateExecutiveDashboard,
};

export type { ExecutiveDashboardInput };
