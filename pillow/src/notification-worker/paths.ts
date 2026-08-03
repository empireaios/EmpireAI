export const NTW_INTEGRATION_TARGETS=["worker_registry","worker_lifecycle","worker_assignment_engine","enterprise_platform_factory_core","workflow_builder_worker","api_integration_worker","authentication_worker","authorization_worker","billing_worker","executive_reporting_runtime","audit_runtime","worker_recovery_system","worker_performance_review"] as const;
export const NTW_CAPABILITIES=["provider_registration","templated_delivery","preference_management","queue_retry","delivery_audit"] as const;
export const ENGINE_STATUSES=["idle","ready","blocked"] as const;
export const CHANNELS=["email","sms","telegram","whatsapp","push","in_app"] as const;
export const PROVIDER_TYPES=CHANNELS;
export const NOTIFICATION_WORKER_SYSTEM_PATH="docs/governance/EMPIREAI_NOTIFICATION_WORKER_SYSTEM.md";
