export { globalRevenueSimulationDashboardSchema, simulationScenarioSchema } from "./models/global-revenue-simulation.js";
export type { GlobalRevenueSimulationDashboard, SimulationScenario } from "./models/global-revenue-simulation.js";
export { buildGlobalRevenueSimulation } from "./services/global-revenue-simulation-service.js";
export { registerGlobalRevenueSimulationRoutes } from "./routes/global-revenue-simulation-routes.js";
export { globalRevenueSimulationTools } from "./tools/global-revenue-simulation-tools.js";
export const GLOBAL_REVENUE_SIMULATION_MODULE_ID = "global-revenue-simulation" as const;
export const GLOBAL_REVENUE_SIMULATION_MISSION_ID = "REAL-030" as const;
