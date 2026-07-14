import type { PerformanceMetricRecord } from "./types.js";

/** Continuously measured performance metrics (P5-06). */
export const PERFORMANCE_METRIC_REGISTRY: PerformanceMetricRecord[] = [
  { id: "api_response_time", label: "API Response Time", domain: "api", unit: "ms", description: "Brain Fastify endpoint round-trip" },
  { id: "page_load_time", label: "Page Load Time", domain: "cockpit", unit: "ms", description: "Executive Home LCP / full load" },
  { id: "interactive_response_time", label: "Interactive Response Time", domain: "cockpit", unit: "ms", description: "TTI / first input delay" },
  { id: "authentication_time", label: "Authentication Time", domain: "authentication", unit: "ms", description: "Session verify + JWT" },
  { id: "session_recovery_time", label: "Session Recovery Time", domain: "sessions", unit: "ms", description: "Durable session restore" },
  { id: "queue_latency", label: "Queue Latency", domain: "queues", unit: "ms", description: "Task queue dequeue-to-start" },
  { id: "worker_execution_time", label: "Worker Execution Time", domain: "workers", unit: "ms", description: "Background job duration" },
  { id: "mission_duration", label: "Mission Duration", domain: "builder", unit: "ms", description: "Builder mission start-to-complete" },
  { id: "mission_throughput", label: "Mission Throughput", domain: "builder", unit: "missions/hr", description: "Completed missions per hour" },
  { id: "database_query_time", label: "Database Query Time", domain: "database", unit: "ms", description: "SQLite read/write latency" },
  { id: "redis_latency", label: "Redis Latency", domain: "redis", unit: "ms", description: "Upstash round-trip" },
  { id: "memory_usage", label: "Memory Usage", domain: "brain_runtime", unit: "MB", description: "Heap + RSS consumption" },
  { id: "cpu_usage", label: "CPU Usage", domain: "brain_runtime", unit: "%", description: "Process CPU utilisation" },
  { id: "network_latency", label: "Network Latency", domain: "network", unit: "ms", description: "Vercel BFF → Railway Brain" },
  { id: "ai_provider_latency", label: "AI Provider Latency", domain: "ai_providers", unit: "ms", description: "LLM router round-trip" },
  { id: "production_availability", label: "Production Availability", domain: "production_infrastructure", unit: "%", description: "Uptime / health probe success" },
];
