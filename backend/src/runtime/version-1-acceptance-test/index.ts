export { version1AcceptanceTestSchema, acceptanceReportSchema } from "./models/version-1-acceptance-test.js";
export type { Version1AcceptanceTest } from "./models/version-1-acceptance-test.js";
export { buildVersion1AcceptanceTest } from "./services/version-1-acceptance-test-service.js";
export { registerVersion1AcceptanceTestRoutes } from "./routes/version-1-acceptance-test-routes.js";
export { version1AcceptanceTestTools } from "./tools/version-1-acceptance-test-tools.js";
export const VERSION_1_ACCEPTANCE_TEST_MODULE_ID = "version-1-acceptance-test" as const;
export const VERSION_1_ACCEPTANCE_TEST_MISSION_ID = "REAL-048" as const;
