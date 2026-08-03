/** PILLOW-DBW-001 — Database Worker (Q6-06). */
export const DATABASE_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_DATABASE_WORKER_SYSTEM.md" as const;
export const DATABASE_WORKER_ID = "database-worker" as const;
export const DBW_METADATA_VERSION = "DBW-001-v1" as const;
export const DATABASE_WORKER_REPORT_VERSION = "DBW-RPT-v1" as const;
export const DATABASE_WORKER_IDENTITY = {
  workerId: "wkr-database-01",
  workerName: "Database Worker",
  workerType: "database_engineer",
  department: "enterprise_platforms",
  factory: "enterprise-platform-factory",
  role: "role-database-builder",
  reportingLine: ["wkr-database-01", "pillow"] as string[],
} as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "receiving_requirements", "receiving_architecture", "building", "reporting", "validating", "failed"] as const;
export const DATABASE_COMPONENTS = ["schemas", "tables", "views", "relationships", "primary_keys", "foreign_keys", "constraints", "indexes", "migrations", "seed_data", "backup_strategy", "unknown"] as const;
export const INTEGRATION_TARGETS = ["worker_registry", "worker_lifecycle", "worker_assignment_engine", "enterprise_platform_factory_core", "requirements_worker", "architecture_worker", "backend_worker", "executive_reporting_runtime", "worker_performance_review", "worker_recovery_system"] as const;
export const DBW_CAPABILITIES = ["receive_approved_requirements_reports", "receive_approved_architecture_reports", "design_relational_and_non_relational_schemas", "create_tables_relationships_and_constraints", "create_indexes_for_performance", "generate_database_migrations", "validate_referential_integrity", "support_backup_and_recovery_planning", "produce_optimized_production_ready_database_structures", "produce_database_build_report", "preserve_complete_traceability", "maintain_data_integrity", "optimize_performance"] as const;
export const DBW_INTEGRATION_TARGETS = INTEGRATION_TARGETS;
