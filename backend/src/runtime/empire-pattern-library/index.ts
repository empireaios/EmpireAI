export { empirePatternLibrarySchema } from "./models/empire-pattern-library.js";
export type { EmpirePatternLibrary } from "./models/empire-pattern-library.js";
export { buildEmpirePatternLibrary } from "./services/empire-pattern-library-service.js";
export { registerEmpirePatternLibraryRoutes } from "./routes/empire-pattern-library-routes.js";
export { empirePatternLibraryTools } from "./tools/empire-pattern-library-tools.js";
export const EMPIRE_PATTERN_LIBRARY_MODULE_ID = "empire-pattern-library" as const;
export const EMPIRE_PATTERN_LIBRARY_MISSION_ID = "REAL-088" as const;
