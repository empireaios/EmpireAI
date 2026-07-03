/**
 * G6-00 — Production Certification Framework public surface.
 */

import { resetCertificationRegistryBatchForTests } from "../../registry/sources/certification-source.js";
import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetCertificationObservationStoreForTests } from "./ekls/certification-observation-store.js";
import { resetProductionCertificationStateForTests } from "./services/certification-runner-service.js";
import { resetPlatformIntegrityObservationStoreForTests } from "./platform-integrity/ekls/platform-integrity-observation-store.js";
import { resetPlatformIntegrityPluginHostForTests } from "./platform-integrity/plugins/platform-integrity-plugin-host.js";
import { resetPlatformIntegrityStateForTests } from "./platform-integrity/services/platform-integrity-certification-service.js";
import { resetSecurityGovernanceObservationStoreForTests } from "./security-governance/ekls/security-governance-observation-store.js";
import { resetSecurityGovernancePluginHostForTests } from "./security-governance/plugins/security-governance-plugin-host.js";
import { resetSecurityGovernanceStateForTests } from "./security-governance/services/security-governance-certification-service.js";
import { resetInfrastructureDeploymentObservationStoreForTests } from "./infrastructure-deployment/ekls/infrastructure-deployment-observation-store.js";
import { resetInfrastructureDeploymentPluginHostForTests } from "./infrastructure-deployment/plugins/infrastructure-deployment-plugin-host.js";
import { resetInfrastructureDeploymentStateForTests } from "./infrastructure-deployment/services/infrastructure-deployment-certification-service.js";
import { resetOperationalReadinessObservationStoreForTests } from "./operational-readiness/ekls/operational-readiness-observation-store.js";
import { resetOperationalReadinessPluginHostForTests } from "./operational-readiness/plugins/operational-readiness-plugin-host.js";
import { resetOperationalReadinessStateForTests } from "./operational-readiness/services/operational-readiness-certification-service.js";
import { resetBusinessOperationsObservationStoreForTests } from "./business-operations/ekls/business-operations-observation-store.js";
import { resetBusinessOperationsPluginHostForTests } from "./business-operations/plugins/business-operations-plugin-host.js";
import { resetBusinessOperationsStateForTests } from "./business-operations/services/business-operations-certification-service.js";
import { resetPerformanceObservationStoreForTests } from "./performance-scalability-resilience/ekls/performance-observation-store.js";
import { resetPerformancePluginHostForTests } from "./performance-scalability-resilience/plugins/performance-plugin-host.js";
import { resetPerformanceStateForTests } from "./performance-scalability-resilience/services/performance-certification-service.js";
import { resetExecutiveOperationsStateForTests } from "./executive-operations/services/executive-operations-certification-service.js";
import { resetExecutiveOperationsObservationStoreForTests } from "./executive-operations/ekls/executive-operations-observation-store.js";
import { resetExecutiveOperationsPluginHostForTests } from "./executive-operations/plugins/executive-operations-plugin-host.js";
import { resetFailureRecoveryStateForTests } from "./failure-recovery-incident/services/failure-recovery-certification-service.js";
import { resetFailureRecoveryObservationStoreForTests } from "./failure-recovery-incident/ekls/failure-recovery-observation-store.js";
import { resetFailureRecoveryPluginHostForTests } from "./failure-recovery-incident/plugins/failure-recovery-plugin-host.js";
import { resetProductionSimulationStateForTests } from "./production-simulation/services/production-simulation-certification-service.js";
import { resetProductionSimulationObservationStoreForTests } from "./production-simulation/ekls/production-simulation-observation-store.js";
import { resetProductionSimulationPluginHostForTests } from "./production-simulation/plugins/production-simulation-plugin-host.js";
import { resetFinalProductionReadinessStateForTests } from "./final-production-readiness/services/final-production-readiness-service.js";
import { resetFinalReadinessObservationStoreForTests } from "./final-production-readiness/ekls/final-readiness-observation-store.js";
import { resetFinalReadinessPluginHostForTests } from "./final-production-readiness/plugins/final-readiness-plugin-host.js";

export {
  PRODUCTION_CERTIFICATION_VERSION,
  CERTIFICATION_RESULT_STATES,
  CERTIFICATION_GOVERNANCE_STATES,
  CERTIFICATION_EKLS_OBSERVATION_KINDS,
  type CertificationResultState,
  type CertificationCheckResult,
  type CertificationDomainResult,
  type CertificationRunResult,
  type CertificationOverview,
  type CertificationBlocker,
  type CertificationRisk,
  type CertificationEvidence,
  type CertificationGateModel,
} from "./contracts/production-certification-types.js";

export { CERTIFICATION_DOMAINS } from "../../registry/types/certification-registry-types.js";

export {
  PRODUCTION_CERTIFICATION_MODULE_ID,
  PRODUCTION_CERTIFICATION_CAPABILITIES,
  createProductionCertificationModuleContract,
  type ProductionCertificationCapability,
  type ProductionCertificationModuleContract,
} from "./contract/production-certification-module.js";

export {
  COCKPIT_CERTIFICATION_MODULE_ID,
  createCockpitCertificationRouteRegistration,
  buildCockpitCertificationCentreView,
  type CockpitCertificationCentreView,
} from "./contract/cockpit-certification-module.js";

export {
  resolveCertificationRegistrySnapshot,
  listCertificationRegistryIds,
  listCertificationGates,
  listCertificationDomains,
} from "./registry/certification-registry-resolver.js";

export {
  validateCertificationPillowGovernance,
  type CertificationPillowContext,
  type CertificationPillowResult,
} from "./governance/certification-pillow-governance.js";

export {
  recordCertificationEklsObservation,
  searchCertificationEklsObservations,
} from "./ekls/certification-ekls-integration.js";

export { listCertificationEklsObservationKinds } from "./ekls/certification-ekls-pillow-governance.js";

export {
  redactCertificationEvidenceValue,
  buildRedactedCertificationEvidence,
  assertNoSecretsInEvidence,
} from "./services/certification-evidence-service.js";

export {
  scoreCertificationStatus,
  aggregateCertificationScore,
  deriveOverallCertificationStatus,
} from "./services/certification-scoring-service.js";

export {
  getCertificationOverview,
  runCertificationCheck,
  runCertificationDomain,
  runFullCertification,
  getCertificationStatus,
  getCertificationBlockers,
  getCertificationRiskRegister,
  getCertificationEvidence,
} from "./services/certification-runner-service.js";

export { productionCertificationTools } from "./tools/production-certification-tools.js";

export {
  PLATFORM_INTEGRITY_CERTIFICATION_VERSION,
  PLATFORM_INTEGRITY_EKLS_KINDS,
  PLATFORM_INTEGRITY_RESULT_STATES,
  type PlatformIntegrityEklsKind,
  type PlatformIntegrityResultState,
  type PlatformIntegrityViolation,
  type OwnershipMatrixEntry,
  type DependencyMatrixEntry,
  type PlatformIntegrityScanResult,
  type PlatformIntegrityOverview,
  type PlatformIntegrityPluginManifest,
} from "./platform-integrity/contracts/platform-integrity-types.js";

export {
  COCKPIT_PLATFORM_INTEGRITY_VIEW_ID,
  buildCockpitPlatformIntegrityView,
  type CockpitPlatformIntegrityView,
} from "./platform-integrity/contracts/platform-integrity-cockpit-contracts.js";

export {
  resolvePlatformIntegrityRules,
  listPlatformIntegritySubsystems,
} from "./platform-integrity/registry/platform-integrity-registry-resolver.js";

export {
  validateOwnershipRules,
  detectDuplicateOwnership,
  detectMissingOwnership,
  detectInvalidOwnership,
} from "./platform-integrity/validation/ownership-validator.js";

export {
  validateDependencyRules,
  detectCircularDependencies,
  detectBrokenIntegrationPaths,
} from "./platform-integrity/validation/dependency-validator.js";

export { detectArchitecturalDrift, detectMissingCertificationRecords } from "./platform-integrity/validation/architecture-drift-detector.js";

export {
  validateProgrammeIntegrity,
  validateModuleIntegrity,
  validateSubsystemIntegrity,
} from "./platform-integrity/validation/programme-integrity-validator.js";

export {
  validatePlatformIntegrityPillowGovernance,
  type PlatformIntegrityPillowContext,
  type PlatformIntegrityPillowResult,
} from "./platform-integrity/governance/platform-integrity-pillow-governance.js";

export {
  recordPlatformIntegrityEklsObservation,
  searchPlatformIntegrityEklsObservations,
  listPlatformIntegrityEklsKinds,
} from "./platform-integrity/ekls/platform-integrity-ekls-integration.js";

export {
  registerPlatformIntegrityPlugin,
  runPlatformIntegrityPluginValidators,
  listPlatformIntegrityPlugins,
} from "./platform-integrity/plugins/platform-integrity-plugin-host.js";

export {
  getPlatformIntegrityOverview,
  getLastPlatformIntegrityScan,
  runPlatformIntegrityScan,
} from "./platform-integrity/services/platform-integrity-certification-service.js";

export { platformIntegrityTools } from "./platform-integrity/tools/platform-integrity-tools.js";

export {
  SECURITY_GOVERNANCE_CERTIFICATION_VERSION,
  SECURITY_GOVERNANCE_EKLS_KINDS,
  SECURITY_GOVERNANCE_RESULT_STATES,
  type SecurityGovernanceEklsKind,
  type SecurityGovernanceResultState,
  type SecurityGovernanceViolation,
  type SecurityRiskEntry,
  type SecurityGovernanceScanResult,
  type SecurityGovernanceOverview,
  type SecurityGovernancePluginManifest,
} from "./security-governance/contracts/security-governance-types.js";

export {
  COCKPIT_SECURITY_GOVERNANCE_VIEW_ID,
  buildCockpitSecurityGovernanceView,
  type CockpitSecurityGovernanceView,
} from "./security-governance/contracts/security-governance-cockpit-contracts.js";

export {
  resolveSecurityGovernanceRules,
  listSecurityGovernanceDomains,
} from "./security-governance/registry/security-governance-registry-resolver.js";

export { validateSecretHandlingRules } from "./security-governance/validation/secret-handling-validator.js";

export {
  validateCredentialProtectionRules,
  detectCredentialExposure,
  detectHardcodedCredentials,
  detectTokenExposure,
} from "./security-governance/validation/credential-exposure-validator.js";

export { validatePillowGovernanceRules } from "./security-governance/validation/pillow-governance-validator.js";
export { validateRegistryComplianceRules } from "./security-governance/validation/registry-compliance-validator.js";
export { validateBrainBoundaryRules } from "./security-governance/validation/brain-boundary-validator.js";
export { validateEklsBoundaryRules } from "./security-governance/validation/ekls-boundary-validator.js";
export { validateWorkspaceIsolationRules } from "./security-governance/validation/workspace-isolation-validator.js";
export {
  validatePluginSecurityRules,
  detectUnauthorizedExecution,
} from "./security-governance/validation/plugin-security-validator.js";
export { validateBoundaryRules } from "./security-governance/validation/boundary-validators.js";
export { analyseExecutiveRisks } from "./security-governance/validation/executive-risk-analyser.js";

export {
  validateSecurityGovernancePillowGovernance,
  type SecurityGovernancePillowContext,
  type SecurityGovernancePillowResult,
} from "./security-governance/governance/security-governance-pillow-governance.js";

export {
  recordSecurityGovernanceEklsObservation,
  searchSecurityGovernanceEklsObservations,
  listSecurityGovernanceEklsKinds,
} from "./security-governance/ekls/security-governance-ekls-integration.js";

export {
  registerSecurityGovernancePlugin,
  runSecurityGovernancePluginValidators,
  listSecurityGovernancePlugins,
} from "./security-governance/plugins/security-governance-plugin-host.js";

export {
  getSecurityGovernanceOverview,
  getLastSecurityGovernanceScan,
  runSecurityScan,
  runGovernanceScan,
  runSecurityGovernanceScan,
} from "./security-governance/services/security-governance-certification-service.js";

export { securityGovernanceTools } from "./security-governance/tools/security-governance-tools.js";

export {
  INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION,
  INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS,
  INFRASTRUCTURE_DEPLOYMENT_RESULT_STATES,
  type InfrastructureDeploymentEklsKind,
  type InfrastructureDeploymentResultState,
  type InfrastructureDeploymentViolation,
  type ServiceHealthEntry,
  type DeploymentRiskEntry,
  type InfrastructureDeploymentScanResult,
  type InfrastructureDeploymentOverview,
  type InfrastructureDeploymentPluginManifest,
} from "./infrastructure-deployment/contracts/infrastructure-deployment-types.js";

export {
  COCKPIT_INFRASTRUCTURE_DEPLOYMENT_VIEW_ID,
  buildCockpitInfrastructureDeploymentView,
  type CockpitInfrastructureDeploymentView,
} from "./infrastructure-deployment/contracts/infrastructure-deployment-cockpit-contracts.js";

export {
  resolveInfrastructureDeploymentRules,
  listInfrastructureDomains,
} from "./infrastructure-deployment/registry/infrastructure-deployment-registry-resolver.js";

export {
  resolveDeploymentSignal,
  resolveDeploymentSignals,
  listDeploymentSignalRefs,
} from "./infrastructure-deployment/registry/deployment-signal-resolver.js";

export {
  validateHostingRules,
  validateBackendRules,
  validateFrontendRules,
  validateDatabaseRules,
  validateQueueRules,
  validateCacheRules,
  validateStorageRules,
  validateMonitoringRules,
  validateBackupRules,
  validateDisasterRecoveryRules,
  validateDeploymentTopologyRules,
  validateScalabilityRules,
  validateDeploymentHealthRules,
  analyseDeploymentRisks,
} from "./infrastructure-deployment/validation/deployment-validators.js";

export {
  validateInfrastructureDeploymentPillowGovernance,
  type InfrastructureDeploymentPillowContext,
  type InfrastructureDeploymentPillowResult,
} from "./infrastructure-deployment/governance/infrastructure-deployment-pillow-governance.js";

export {
  recordInfrastructureDeploymentEklsObservation,
  searchInfrastructureDeploymentEklsObservations,
  listInfrastructureDeploymentEklsKinds,
} from "./infrastructure-deployment/ekls/infrastructure-deployment-ekls-integration.js";

export {
  registerInfrastructureDeploymentPlugin,
  runInfrastructureDeploymentPluginValidators,
} from "./infrastructure-deployment/plugins/infrastructure-deployment-plugin-host.js";

export {
  getInfrastructureDeploymentOverview,
  getLastInfrastructureDeploymentScan,
  runInfrastructureDeploymentScan,
  runDeploymentHealthCheck,
} from "./infrastructure-deployment/services/infrastructure-deployment-certification-service.js";

export { infrastructureDeploymentTools } from "./infrastructure-deployment/tools/infrastructure-deployment-tools.js";

export {
  OPERATIONAL_READINESS_CERTIFICATION_VERSION,
  OPERATIONAL_READINESS_EKLS_KINDS,
  OPERATIONAL_READINESS_RESULT_STATES,
  type OperationalReadinessEklsKind,
  type OperationalReadinessResultState,
  type OperationalBlocker,
  type OperationalDependencyEntry,
  type OperationalRiskEntry,
  type OperationalReadinessScanResult,
  type OperationalReadinessOverview,
  type OperationalReadinessPluginManifest,
  mapOperationalStatusToCertification,
} from "./operational-readiness/contracts/operational-readiness-types.js";

export {
  COCKPIT_OPERATIONAL_READINESS_VIEW_ID,
  buildCockpitOperationalReadinessView,
  type CockpitOperationalReadinessView,
} from "./operational-readiness/contracts/operational-readiness-cockpit-contracts.js";

export {
  resolveOperationalReadinessRules,
  listOperationalReadinessDomains,
} from "./operational-readiness/registry/operational-readiness-registry-resolver.js";

export {
  resolveOperationalSignal,
  resolveOperationalSignals,
} from "./operational-readiness/registry/operational-signal-resolver.js";

export {
  validateOperationalRules,
  validateAutomationReadiness,
  validateCommerceReadiness,
  validateExternalDependencyReadiness,
  validateProviderReadiness,
  validateMonitoringReadiness,
  validateIncidentReadiness,
  validateRecoveryReadiness,
  analyseOperationalRisks,
} from "./operational-readiness/validation/operational-readiness-validator.js";

export {
  deriveOperationalReadinessStatus,
  computeOperationalScore,
  scoreOperationalReadiness,
} from "./operational-readiness/services/operational-score-engine.js";

export {
  validateOperationalReadinessPillowGovernance,
  type OperationalReadinessPillowContext,
  type OperationalReadinessPillowResult,
} from "./operational-readiness/governance/operational-readiness-pillow-governance.js";

export {
  recordOperationalReadinessEklsObservation,
  searchOperationalReadinessEklsObservations,
  listOperationalReadinessEklsKinds,
} from "./operational-readiness/ekls/operational-readiness-ekls-integration.js";

export {
  registerOperationalReadinessPlugin,
  runOperationalReadinessPluginValidators,
} from "./operational-readiness/plugins/operational-readiness-plugin-host.js";

export {
  getOperationalReadinessOverview,
  getLastOperationalReadinessScan,
  runOperationalScan,
} from "./operational-readiness/services/operational-readiness-certification-service.js";

export { operationalReadinessTools } from "./operational-readiness/tools/operational-readiness-tools.js";

export {
  BUSINESS_OPERATIONS_CERTIFICATION_VERSION,
  BUSINESS_OPERATIONS_EKLS_KINDS,
  BUSINESS_OPERATIONS_RESULT_STATES,
  type BusinessOperationsEklsKind,
  type BusinessOperationsResultState,
  type BusinessFinding,
  type BusinessDependencyEntry,
  type BusinessRiskEntry,
  type CommerceHealthSummary,
  type BusinessOperationsScanResult,
  type BusinessOperationsOverview,
  type BusinessOperationsPluginManifest,
  mapBusinessStatusToCertification,
} from "./business-operations/contracts/business-operations-types.js";

export {
  COCKPIT_BUSINESS_OPERATIONS_VIEW_ID,
  buildCockpitBusinessOperationsView,
  type CockpitBusinessOperationsView,
} from "./business-operations/contracts/business-operations-cockpit-contracts.js";

export {
  resolveBusinessOperationsRules,
  listBusinessOperationsDomains,
} from "./business-operations/registry/business-operations-registry-resolver.js";

export {
  resolveBusinessSignal,
  resolveBusinessSignals,
} from "./business-operations/registry/business-signal-resolver.js";

export {
  validateBusinessRules,
  validateMarketplaceCertification,
  validateSupplierCertification,
  validateStorefrontCertification,
  validatePaymentCertification,
  validateLogisticsCertification,
  validateAnalyticsCertification,
  validateWorkflowCertification,
  validateAutomationCertification,
  validateCommerceCertification,
  deriveCommerceHealth,
  analyseBusinessRisks,
} from "./business-operations/validation/business-operations-validator.js";

export {
  deriveBusinessOperationsStatus,
  computeExecutiveBusinessScore,
  scoreBusinessOperationsStatus,
} from "./business-operations/services/executive-business-score-engine.js";

export {
  validateBusinessOperationsPillowGovernance,
  type BusinessOperationsPillowContext,
  type BusinessOperationsPillowResult,
} from "./business-operations/governance/business-operations-pillow-governance.js";

export {
  recordBusinessOperationsEklsObservation,
  searchBusinessOperationsEklsObservations,
  listBusinessOperationsEklsKinds,
} from "./business-operations/ekls/business-operations-ekls-integration.js";

export {
  registerBusinessOperationsPlugin,
  runBusinessOperationsPluginValidators,
} from "./business-operations/plugins/business-operations-plugin-host.js";

export {
  getBusinessOperationsOverview,
  getLastBusinessOperationsScan,
  runBusinessOperationsScan,
} from "./business-operations/services/business-operations-certification-service.js";

export { businessOperationsTools } from "./business-operations/tools/business-operations-tools.js";

export {
  PERFORMANCE_SCALABILITY_RESILIENCE_CERTIFICATION_VERSION,
  PERFORMANCE_EKLS_KINDS,
  PERFORMANCE_RESULT_STATES,
  type PerformanceEklsKind,
  type PerformanceResultState,
  type PerformanceBottleneck,
  type PerformanceBenchmarkEntry,
  type PerformanceTrendEntry,
  type PerformanceRiskEntry,
  type ScalabilityStatusSummary,
  type ResilienceStatusSummary,
  type PerformanceScanResult,
  type PerformanceOverview,
  type PerformancePluginManifest,
} from "./performance-scalability-resilience/contracts/performance-certification-types.js";

export {
  COCKPIT_PERFORMANCE_VIEW_ID,
  buildCockpitPerformanceView,
  type CockpitPerformanceView,
} from "./performance-scalability-resilience/contracts/performance-cockpit-contracts.js";

export {
  resolvePerformanceCertificationRules,
  listPerformanceDomains,
} from "./performance-scalability-resilience/registry/performance-registry-resolver.js";

export {
  resolveBenchmarkSignal,
  resolveBenchmarkSignals,
} from "./performance-scalability-resilience/registry/performance-benchmark-resolver.js";

export {
  validatePerformanceRules,
  validateApiPerformance,
  validateDatabasePerformance,
  validateQueueThroughput,
  validateBrainPerformance,
  validateCockpitPerformance,
  validatePluginPerformance,
  validateResilience,
  validateFailoverReadiness,
  validateRecoveryPerformance,
  validateScalability,
  deriveScalabilityStatus,
  deriveResilienceStatus,
  analysePerformanceRisks,
} from "./performance-scalability-resilience/validation/performance-certification-validator.js";

export {
  derivePerformanceStatus,
  computeExecutivePerformanceScore,
  scorePerformanceStatus,
} from "./performance-scalability-resilience/services/executive-performance-score-engine.js";

export {
  validatePerformancePillowGovernance,
  type PerformancePillowContext,
  type PerformancePillowResult,
} from "./performance-scalability-resilience/governance/performance-pillow-governance.js";

export {
  recordPerformanceEklsObservation,
  searchPerformanceEklsObservations,
  listPerformanceEklsKinds,
} from "./performance-scalability-resilience/ekls/performance-ekls-integration.js";

export {
  registerPerformancePlugin,
  runPerformancePluginValidators,
} from "./performance-scalability-resilience/plugins/performance-plugin-host.js";

export {
  getPerformanceOverview,
  getLastPerformanceScan,
  runPerformanceScan,
} from "./performance-scalability-resilience/services/performance-certification-service.js";

export { performanceCertificationTools } from "./performance-scalability-resilience/tools/performance-certification-tools.js";

export {
  EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION,
  EXECUTIVE_OPERATIONS_EKLS_KINDS,
  EXECUTIVE_RESULT_STATES,
  type ExecutiveOperationsEklsKind,
  type ExecutiveResultState,
  type ExecutiveBlocker,
  type ExecutiveVisibilityEntry,
  type ExecutiveRiskEntry,
  type CockpitHealthSummary,
  type ExecutiveActionSafetySummary,
  type ExecutiveOperationsScanResult,
  type ExecutiveOperationsOverview,
  type ExecutiveOperationsPluginManifest,
} from "./executive-operations/contracts/executive-operations-types.js";

export {
  COCKPIT_EXECUTIVE_OPERATIONS_VIEW_ID,
  buildCockpitExecutiveOperationsView,
  type CockpitExecutiveOperationsView,
} from "./executive-operations/contracts/executive-operations-cockpit-contracts.js";

export {
  resolveExecutiveOperationsRules,
  listExecutiveOperationsDomains,
} from "./executive-operations/registry/executive-operations-registry-resolver.js";

export {
  resolveExecutiveSignal,
  resolveExecutiveSignals,
} from "./executive-operations/registry/executive-signal-resolver.js";

export {
  validateExecutiveRules,
  validateCockpitOperations,
  validateExecutiveHome,
  validateCommandCentre,
  validateAutomationCentre,
  validateAuthorizationCentre,
  validateRelationshipGraph,
  validateGlobalAiAssistant,
  validateApprovalFlow,
  validateExecutiveReporting,
  validateDecisionVisibility,
  validateReadinessVisibility,
  validateExecutiveActionSafety,
  deriveCockpitHealth,
  deriveActionSafety,
  analyseExecutiveOperationsRisks,
} from "./executive-operations/validation/executive-operations-certification-validator.js";

export {
  deriveExecutiveOperationsStatus,
  computeExecutiveOperationsScore,
  scoreExecutiveStatus,
} from "./executive-operations/services/executive-operations-score-engine.js";

export {
  validateExecutiveOperationsPillowGovernance,
  type ExecutiveOperationsPillowContext,
  type ExecutiveOperationsPillowResult,
} from "./executive-operations/governance/executive-operations-pillow-governance.js";

export {
  recordExecutiveOperationsEklsObservation,
  searchExecutiveOperationsEklsObservations,
  listExecutiveOperationsEklsKinds,
} from "./executive-operations/ekls/executive-operations-ekls-integration.js";

export {
  registerExecutiveOperationsPlugin,
  runExecutiveOperationsPluginValidators,
} from "./executive-operations/plugins/executive-operations-plugin-host.js";

export {
  getExecutiveOperationsOverview,
  getLastExecutiveOperationsScan,
  runExecutiveOperationsScan,
} from "./executive-operations/services/executive-operations-certification-service.js";

export { executiveOperationsTools } from "./executive-operations/tools/executive-operations-tools.js";

export {
  FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION,
  FAILURE_RECOVERY_EKLS_KINDS,
  FAILURE_RECOVERY_RESULT_STATES,
  type FailureRecoveryEklsKind,
  type FailureRecoveryResultState,
  type FailureCertificationFinding,
  type IncidentCertificationEntry,
  type RecoveryCertificationEntry,
  type RollbackCertificationEntry,
  type IncidentRiskEntry,
  type RecoveryReadinessSummary,
  type RollbackReadinessSummary,
  type EscalationStatusSummary,
  type FailureRecoveryScanResult,
  type FailureRecoveryOverview,
  type FailureRecoveryPluginManifest,
} from "./failure-recovery-incident/contracts/failure-recovery-incident-types.js";

export {
  COCKPIT_FAILURE_RECOVERY_VIEW_ID,
  buildCockpitFailureRecoveryView,
  type CockpitFailureRecoveryView,
} from "./failure-recovery-incident/contracts/failure-recovery-cockpit-contracts.js";

export {
  resolveFailureRecoveryRules,
  listFailureRecoveryDomains,
} from "./failure-recovery-incident/registry/failure-recovery-registry-resolver.js";

export {
  resolveRecoverySignal,
  resolveRecoverySignals,
} from "./failure-recovery-incident/registry/recovery-signal-resolver.js";

export {
  validateFailureRecoveryRules,
  validateFailureDetection,
  validateIncidentClassification,
  validateRecoveryPath,
  validateRollbackPath,
  validateEscalation,
  validateGuardianIntegration,
  validateEklsEvidence,
  deriveRecoveryReadiness,
  deriveRollbackReadiness,
  deriveEscalationStatus,
  analyseFailureRecoveryRisks,
} from "./failure-recovery-incident/validation/failure-recovery-certification-validator.js";

export {
  deriveFailureRecoveryStatus,
  computeExecutiveIncidentScore,
  scoreFailureRecoveryStatus,
} from "./failure-recovery-incident/services/executive-incident-score-engine.js";

export {
  validateFailureRecoveryPillowGovernance,
  type FailureRecoveryPillowContext,
  type FailureRecoveryPillowResult,
} from "./failure-recovery-incident/governance/failure-recovery-pillow-governance.js";

export {
  recordFailureRecoveryEklsObservation,
  searchFailureRecoveryEklsObservations,
  listFailureRecoveryEklsKinds,
} from "./failure-recovery-incident/ekls/failure-recovery-ekls-integration.js";

export {
  registerFailureRecoveryPlugin,
  runFailureRecoveryPluginValidators,
} from "./failure-recovery-incident/plugins/failure-recovery-plugin-host.js";

export {
  getFailureRecoveryOverview,
  getLastFailureRecoveryScan,
  runFailureRecoveryScan,
} from "./failure-recovery-incident/services/failure-recovery-certification-service.js";

export { failureRecoveryTools } from "./failure-recovery-incident/tools/failure-recovery-tools.js";

export {
  PRODUCTION_SIMULATION_CERTIFICATION_VERSION,
  PRODUCTION_SIMULATION_EKLS_KINDS,
  PRODUCTION_SIMULATION_RESULT_STATES,
  PRODUCTION_SIMULATION_TYPES,
  SAFE_SIMULATION_TYPES,
  type ProductionSimulationEklsKind,
  type ProductionSimulationResultState,
  type ProductionSimulationType,
  type SimulationStep,
  type SimulationEvidence,
  type SimulationBlocker,
  type SimulationRisk,
  type ProductionSimulationResult,
  type ProductionSimulationRunResult,
  type ProductionSimulationOverview,
  type ProductionSimulationPluginManifest,
  isSimulationTypeSafe,
} from "./production-simulation/contracts/production-simulation-types.js";

export {
  COCKPIT_PRODUCTION_SIMULATION_VIEW_ID,
  buildCockpitProductionSimulationView,
  type CockpitProductionSimulationView,
} from "./production-simulation/contracts/production-simulation-cockpit-contracts.js";

export {
  resolveProductionSimulationScenarios,
  resolveProductionSimulationScenario,
  listProductionSimulationDomains,
} from "./production-simulation/registry/simulation-scenario-registry-resolver.js";

export {
  resolveSimulationSignal,
  resolveSimulationSignals,
} from "./production-simulation/registry/simulation-safety-signal-resolver.js";

export {
  runSimulationScenarioValidation,
  validateCommerceSimulation,
  validateAutomationSimulation,
  validateIdentitySimulation,
  validateCockpitSimulation,
  validateFailureSimulation,
  validateRecoverySimulation,
  validateSimulationEvidence,
  analyseSimulationRisks,
} from "./production-simulation/validation/production-simulation-validator.js";

export {
  deriveSimulationRunStatus,
  computeSimulationScore,
  scoreSimulationStatus,
} from "./production-simulation/services/simulation-score-engine.js";

export {
  runEndToEndSimulation,
  createSimulationCorrelationId,
} from "./production-simulation/services/end-to-end-simulation-runner.js";

export {
  validateProductionSimulationPillowGovernance,
  type ProductionSimulationPillowContext,
  type ProductionSimulationPillowResult,
} from "./production-simulation/governance/production-simulation-pillow-governance.js";

export {
  recordProductionSimulationEklsObservation,
  searchProductionSimulationEklsObservations,
  listProductionSimulationEklsKinds,
} from "./production-simulation/ekls/production-simulation-ekls-integration.js";

export {
  registerProductionSimulationPlugin,
  runProductionSimulationPluginValidators,
} from "./production-simulation/plugins/production-simulation-plugin-host.js";

export {
  getProductionSimulationOverview,
  getLastProductionSimulationRun,
  runSimulationScenario,
  runFullProductionSimulation,
} from "./production-simulation/services/production-simulation-certification-service.js";

export { productionSimulationTools } from "./production-simulation/tools/production-simulation-tools.js";

export {
  FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION,
  FINAL_CERTIFICATION_OUTCOMES,
  FINAL_READINESS_EKLS_KINDS,
  G6_MISSION_AUDIT_REFS,
  type FinalCertificationOutcome,
  type FinalReadinessEklsKind,
  type FinalReadinessEvidence,
  type FinalReadinessBlocker,
  type FinalReadinessRisk,
  type ValidatedDomainResult,
  type FinalProductionReadinessRecord,
  type GrandKingReadinessSummary,
  type FinalProductionReadinessRunResult,
  type FinalProductionReadinessOverview,
  type FinalReadinessPluginManifest,
} from "./final-production-readiness/contracts/final-production-readiness-types.js";

export {
  COCKPIT_FINAL_PRODUCTION_READINESS_VIEW_ID,
  buildCockpitFinalProductionReadinessView,
  type CockpitFinalProductionReadinessView,
} from "./final-production-readiness/contracts/final-readiness-cockpit-contracts.js";

export {
  resolveFinalReadinessRules,
  listFinalReadinessDomains,
} from "./final-production-readiness/registry/final-readiness-registry-resolver.js";

export {
  validateFinalReadinessPillowGovernance,
  type FinalReadinessPillowContext,
  type FinalReadinessPillowResult,
} from "./final-production-readiness/governance/final-readiness-pillow-governance.js";

export {
  recordFinalReadinessEklsObservation,
  searchFinalReadinessEklsObservations,
  listFinalReadinessEklsKinds,
} from "./final-production-readiness/ekls/final-readiness-ekls-integration.js";

export {
  registerFinalReadinessPlugin,
  listFinalReadinessPlugins,
} from "./final-production-readiness/plugins/final-readiness-plugin-host.js";

export {
  getFinalProductionReadinessOverview,
  getLastFinalProductionReadinessRun,
  runFinalProductionReadinessCertification,
  getProductionEligibilitySummary,
  getProductionBlockers,
  getProductionConditions,
  getProductionRiskRegister,
  getGrandKingReadinessSummary,
  getCertificationCompletionSummary,
} from "./final-production-readiness/services/final-production-readiness-service.js";

export { finalProductionReadinessTools } from "./final-production-readiness/tools/final-production-readiness-tools.js";

export function resetProductionCertificationHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetCertificationRegistryBatchForTests();
  resetProductionCertificationStateForTests();
  resetCertificationObservationStoreForTests();
  resetPlatformIntegrityStateForTests();
  resetPlatformIntegrityObservationStoreForTests();
  resetPlatformIntegrityPluginHostForTests();
  resetSecurityGovernanceStateForTests();
  resetSecurityGovernanceObservationStoreForTests();
  resetSecurityGovernancePluginHostForTests();
  resetInfrastructureDeploymentStateForTests();
  resetInfrastructureDeploymentObservationStoreForTests();
  resetInfrastructureDeploymentPluginHostForTests();
  resetOperationalReadinessStateForTests();
  resetOperationalReadinessObservationStoreForTests();
  resetOperationalReadinessPluginHostForTests();
  resetBusinessOperationsStateForTests();
  resetBusinessOperationsObservationStoreForTests();
  resetBusinessOperationsPluginHostForTests();
  resetPerformanceStateForTests();
  resetPerformanceObservationStoreForTests();
  resetPerformancePluginHostForTests();
  resetExecutiveOperationsStateForTests();
  resetExecutiveOperationsObservationStoreForTests();
  resetExecutiveOperationsPluginHostForTests();
  resetFailureRecoveryStateForTests();
  resetFailureRecoveryObservationStoreForTests();
  resetFailureRecoveryPluginHostForTests();
  resetProductionSimulationStateForTests();
  resetProductionSimulationObservationStoreForTests();
  resetProductionSimulationPluginHostForTests();
  resetFinalProductionReadinessStateForTests();
  resetFinalReadinessObservationStoreForTests();
  resetFinalReadinessPluginHostForTests();
}
