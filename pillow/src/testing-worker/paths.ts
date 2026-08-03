export const TSW_INTEGRATION_TARGETS=["worker_registry","worker_lifecycle","worker_assignment_engine","enterprise_platform_factory_core","requirements_worker","architecture_worker","frontend_worker","backend_worker","database_worker","authentication_worker","authorization_worker","billing_worker","api_integration_worker","workflow_builder_worker","notification_worker","executive_reporting_runtime","audit_runtime","worker_recovery_system","worker_performance_review"] as const;
export const TSW_CAPABILITIES=["test_generation","automated_execution","coverage_analysis","regression_detection","failure_evidence","remediation"] as const;
export const ENGINE_STATUSES=["idle","ready","blocked"] as const;
export const TEST_TYPES=["unit","integration","end_to_end","acceptance","api","ui","authentication","authorization","billing","workflow","notification","performance","security"] as const;
export const TEST_DOMAINS=["frontend","backend","database","authentication","authorization","billing","api_integration","workflow","notification","platform"] as const;
export const TESTING_WORKER_SYSTEM_PATH="docs/governance/EMPIREAI_TESTING_WORKER_SYSTEM.md";
