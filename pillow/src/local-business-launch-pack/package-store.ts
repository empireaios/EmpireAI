import { cloneSections, cloneVerification } from "./package-builder.js";
import type {
  CollectedFactoryOutputs,
  DeliverableVerification,
  LaunchPackage,
  LocalBusinessLaunchReport,
} from "./types.js";

/** Authoritative in-memory Launch Pack store — collections, verifications, packages, reports, audit. */
export class LaunchPackageStore {
  private collections = new Map<string, CollectedFactoryOutputs>();
  private verifications = new Map<string, DeliverableVerification>();
  private packages = new Map<string, LaunchPackage>();
  private reports = new Map<string, LocalBusinessLaunchReport>();
  private latestCollectionByProject = new Map<string, string>();
  private latestPackageByProject = new Map<string, string>();
  private latestPackageId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: LocalBusinessLaunchReport[]) {
    this.collections.clear();
    this.verifications.clear();
    this.packages.clear();
    this.reports.clear();
    this.latestCollectionByProject.clear();
    this.latestPackageByProject.clear();
    this.latestPackageId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.reportId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  packageCount() {
    return this.packages.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listPackages() {
    return [...this.packages.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((p) => ({ ...p, collection: { ...p.collection }, verification: cloneVerification(p.verification), sections: cloneSections(p.sections) }));
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getCollection(businessProjectId: string) {
    const id = this.latestCollectionByProject.get(businessProjectId);
    if (!id) return null;
    const collection = this.collections.get(id);
    return collection ? { ...collection } : null;
  }

  saveCollection(collection: CollectedFactoryOutputs, action = "collect_factory_outputs") {
    this.collections.set(collection.collectionId, { ...collection });
    this.latestCollectionByProject.set(collection.businessProjectId, collection.collectionId);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: collection.collectionId,
      action,
      details: `project=${collection.businessProjectId} present=${collection.sourcesPresent.length} missing=${collection.sourcesMissing.length}`,
    });
    return { ...collection };
  }

  saveVerification(verification: DeliverableVerification, action = "verify_deliverables") {
    this.verifications.set(verification.verificationId, cloneVerification(verification));
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: verification.verificationId,
      action,
      details: `project=${verification.businessProjectId} present=${verification.presentCount}/${verification.requiredCount}`,
    });
    return cloneVerification(verification);
  }

  getPackage(packageId: string) {
    const found = this.packages.get(packageId);
    return found
      ? { ...found, collection: { ...found.collection }, verification: cloneVerification(found.verification), sections: cloneSections(found.sections) }
      : null;
  }

  getLatestPackageForProject(businessProjectId: string) {
    const id = this.latestPackageByProject.get(businessProjectId);
    return id ? this.getPackage(id) : null;
  }

  getLatestPackageId() {
    return this.latestPackageId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  savePackage(packageDoc: LaunchPackage, action = "generate_executive_launch_package") {
    const stored: LaunchPackage = {
      ...packageDoc,
      collection: { ...packageDoc.collection },
      verification: cloneVerification(packageDoc.verification),
      sections: cloneSections(packageDoc.sections),
    };
    this.packages.set(stored.packageId, stored);
    this.latestPackageByProject.set(stored.businessProjectId, stored.packageId);
    this.latestPackageId = stored.packageId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: stored.packageId,
      action,
      details: `project=${stored.businessProjectId} status=${stored.status}`,
    });
    return this.getPackage(stored.packageId)!;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  saveReport(report: LocalBusinessLaunchReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `package=${report.packageId} readiness=${report.readinessStatus} recommendation=${report.approvalRecommendation}`,
    });
    return cloneReport(report);
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}

function cloneReport(report: LocalBusinessLaunchReport): LocalBusinessLaunchReport {
  return {
    ...report,
    deliverableVerification: cloneVerification(report.deliverableVerification),
    riskSummary: [...report.riskSummary],
    outstandingIssues: [...report.outstandingIssues],
    launchPackage: cloneSections(report.launchPackage),
    readinessAssessment: {
      ...report.readinessAssessment,
      missingItems: [...report.readinessAssessment.missingItems],
      criticalItemsMissing: [...report.readinessAssessment.criticalItemsMissing],
      notes: [...report.readinessAssessment.notes],
    },
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    consumableByQ711: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverLaunchBusinessAutomatically: true,
    neverOverrideGovernance: true,
    neverReplaceCertification: true,
    neverClaimReadinessWithoutEvidence: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ711OrLater: true,
  };
}
