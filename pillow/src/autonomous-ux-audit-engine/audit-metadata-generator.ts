/** T5-02 — Machine-readable UX audit metadata generation. */

import { randomUUID } from "node:crypto";
import { AUDIT_METADATA_VERSION } from "./paths.js";
import type {
  AuditStatus,
  DetectedUxIssue,
  IssueSeverity,
  UxAuditRecord,
} from "./types.js";
import { maxSeverity } from "./severity-utils.js";

export class AuditMetadataGenerator {
  buildRecord(input: {
    sourceObservationId: string | null;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    issues: DetectedUxIssue[];
    confidenceScore: number;
    auditStatus: AuditStatus;
  }): UxAuditRecord {
    const components = new Set<string>();
    const layoutRegions = new Set<string>();
    const navigationNodes = new Set<string>();
    const evidenceRefs = new Set<string>();

    for (const issue of input.issues) {
      if (issue.affectedComponentId) components.add(issue.affectedComponentId);
      if (issue.affectedLayoutRegionId) layoutRegions.add(issue.affectedLayoutRegionId);
      if (issue.affectedNavigationNodeId) navigationNodes.add(issue.affectedNavigationNodeId);
      if (issue.evidenceReference) evidenceRefs.add(issue.evidenceReference);
    }

    const severities = input.issues.map((i) => i.severity);
    const issueSeverity: IssueSeverity = maxSeverity(severities);

    return {
      auditId: `aua-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceObservationId: input.sourceObservationId,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      detectedUxIssues: input.issues,
      affectedComponents: [...components],
      affectedLayoutRegions: [...layoutRegions],
      affectedNavigationNodes: [...navigationNodes],
      issueSeverity,
      evidenceReferences: [...evidenceRefs],
      confidenceScore: input.confidenceScore,
      auditStatus: input.auditStatus,
      metadataVersion: AUDIT_METADATA_VERSION,
      auditOnly: true,
    };
  }
}
