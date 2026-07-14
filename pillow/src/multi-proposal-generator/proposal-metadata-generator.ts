/** T4-04 — Proposal metadata and ID generation. */

import type { RedesignProposalRecord } from "./types.js";
import { PROPOSAL_METADATA_VERSION } from "./paths.js";

export class ProposalMetadataGenerator {
  buildProposalId(): string {
    return `mpg-prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `mpg-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `mpg-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `mpg-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichProposal(record: RedesignProposalRecord): RedesignProposalRecord {
    return { ...record, metadataVersion: PROPOSAL_METADATA_VERSION };
  }
}
