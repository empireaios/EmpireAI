export { globalCommandCenterDashboardSchema } from "./models/global-command-center.js";
export type { GlobalCommandCenterDashboard } from "./models/global-command-center.js";

export { buildGlobalCommandCenter } from "./services/global-command-center-service.js";
export { registerGlobalCommandCenterRoutes } from "./routes/global-command-center-routes.js";
export { globalCommandCenterTools } from "./tools/global-command-center-tools.js";

export const GLOBAL_COMMAND_CENTER_MODULE_ID = "global-command-center" as const;
export const GLOBAL_COMMAND_CENTER_MISSION_IDS = [
  "REAL-013", "REAL-014", "REAL-015", "REAL-016", "REAL-017", "REAL-018",
] as const;
