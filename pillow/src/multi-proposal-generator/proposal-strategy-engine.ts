/** T4-04 — Selects proposal generation strategy and category mix. */

import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type { ProposalCategory } from "./types.js";
import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { appendProposalLog } from "./proposal-logging.js";

export type ProposalStrategy = {
  categories: ProposalCategory[];
  variantsPerCategory: number;
  diversityEnabled: boolean;
  strategyConfidence: number;
};

export class ProposalStrategyEngine {
  select(
    requirements: InterpretedProposalRequirements,
    config: MultiProposalGeneratorConfiguration,
  ): ProposalStrategy {
    appendProposalLog({
      event: "proposal_strategy_selection",
      level: "info",
      details: "Selecting proposal generation strategy",
    });

    let categories = requirements.suggestedCategories.filter((c) =>
      config.supportedProposalCategories.includes(c),
    );

    if (categories.length === 0) {
      categories = config.supportedProposalCategories.slice(0, 3);
    }

    const min = config.minimumProposalCount;
    const max = config.maximumProposalCount;
    const diversityEnabled = config.proposalDiversityRulesEnabled;

    let variantsPerCategory = 1;
    if (diversityEnabled && categories.length < min) {
      variantsPerCategory = Math.ceil(min / categories.length);
    }

    while (categories.length * variantsPerCategory < min && categories.length < max) {
      const next = config.supportedProposalCategories.find(
        (c) => !categories.includes(c),
      );
      if (!next) break;
      categories.push(next);
    }

    if (categories.length * variantsPerCategory > max) {
      categories = categories.slice(0, Math.max(1, Math.floor(max / variantsPerCategory)));
    }

    return {
      categories,
      variantsPerCategory,
      diversityEnabled,
      strategyConfidence: Math.min(
        0.95,
        requirements.interpretConfidence * 0.6 + (categories.length > 1 ? 0.25 : 0.1),
      ),
    };
  }
}
