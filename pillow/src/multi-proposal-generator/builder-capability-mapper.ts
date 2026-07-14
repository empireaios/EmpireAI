/** T4-04 — Maps proposals to certified T3 builder capabilities. */

import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type { RedesignProposalRecord } from "./types.js";
import { appendProposalLog } from "./proposal-logging.js";

export class BuilderCapabilityMapper {
  enrich(input: {
    proposals: RedesignProposalRecord[];
    config: MultiProposalGeneratorConfiguration;
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
  }): RedesignProposalRecord[] {
    if (!input.config.builderCapabilityLinkageRulesEnabled) {
      return input.proposals;
    }

    appendProposalLog({
      event: "builder_capability_linkage",
      level: "info",
      details: `Mapping builder capabilities for ${input.proposals.length} proposal(s)`,
    });

    let certified = false;
    if (input.autonomousBuilderCertification) {
      try {
        void input.autonomousBuilderCertification.getState();
        certified = true;
      } catch {
        appendProposalLog({
          event: "builder_capability_linkage",
          level: "warn",
          details: "Builder certification status unavailable",
        });
      }
    }

    return input.proposals.map((p) => ({
      ...p,
      linkedBuilderCapabilities: certified
        ? [...new Set(p.linkedBuilderCapabilities)]
        : p.linkedBuilderCapabilities,
    }));
  }
}
