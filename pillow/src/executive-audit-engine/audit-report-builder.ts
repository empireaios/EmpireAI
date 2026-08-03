import { EXA_METADATA_VERSION } from "./paths.js";
import type { InspectionResult } from "./audit-inspector.js";
import type { AuditReport, ValidationStatus } from "./types.js";

let auditSequence = 0;

export class AuditReportBuilder {
  build(inspection: InspectionResult, validationStatus: ValidationStatus): AuditReport {
    auditSequence += 1;
    return {
      auditId: `exa-aud-${Date.now()}-${auditSequence}`,
      timestamp: new Date().toISOString(),
      auditType: inspection.auditType,
      targetObject: inspection.targetObject,
      objectId: inspection.objectId,
      auditStatus: inspection.auditStatus,
      findings: [...inspection.findings],
      severity: inspection.severity,
      violations: [...inspection.violations],
      recommendations: [...inspection.recommendations],
      correctiveActions: [...inspection.correctiveActions],
      evidence: [...inspection.evidence],
      metadataVersion: EXA_METADATA_VERSION,
      auditTraceId: `exa-trace-${Date.now()}-${auditSequence}`,
      validationStatus,
      neverExecuteCorrections: true,
      neverApproveMissions: true,
      neverAssignWorkers: true,
      neverModifyBusinessState: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      correctionsExecuted: false,
      missionsApproved: false,
      workersAssigned: false,
      businessStateModified: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveAuditTraceability: true,
      preserveAuditability: true,
      preserveAuditIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

export function resetAuditSequenceForTesting() {
  auditSequence = 0;
}
