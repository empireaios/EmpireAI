/** T4-09 — Collaboration metadata and ID generation. */

import { COLLABORATION_METADATA_VERSION } from "./paths.js";

export class CollaborationMetadataGenerator {
  buildSessionId(): string {
    return `cc-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `cc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `cc-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildTopicId(): string {
    return `cc-topic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  getMetadataVersion(): string {
    return COLLABORATION_METADATA_VERSION;
  }
}
