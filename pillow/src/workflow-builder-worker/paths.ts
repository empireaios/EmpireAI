export const WBW_INTEGRATION_TARGETS = ["worker_registry","worker_lifecycle","worker_assignment_engine","enterprise_platform_factory_core","requirements_worker","architecture_worker","frontend_worker","backend_worker","database_worker","authentication_worker","authorization_worker","billing_worker","api_integration_worker","executive_reporting_runtime","audit_runtime","worker_recovery_system","worker_performance_review"] as const;
export const WBW_CAPABILITIES = ["workflow_building","automation_pipelines","execution_definitions","templates","approval_checkpoints","retry_recovery"] as const;
export const ENGINE_STATUSES = ["idle","ready","degraded","stopped"] as const;
export const NODE_TYPES = ["task","worker_invoke","api_invoke","decision","parallel_fork","parallel_join","approval","delay","event_trigger","retry","failure_recovery","end"] as const;
export const STEP_TYPES = NODE_TYPES;
export const WORKFLOW_BUILDER_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_WORKFLOW_BUILDER_WORKER_SYSTEM.md";
