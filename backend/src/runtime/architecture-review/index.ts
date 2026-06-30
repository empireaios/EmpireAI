export { architectureReviewSchema } from "./models/architecture-review.js";
export type { ArchitectureReview } from "./models/architecture-review.js";
export { buildArchitectureReview } from "./services/architecture-review-service.js";
export { registerArchitectureReviewRoutes } from "./routes/architecture-review-routes.js";
export { architectureReviewTools } from "./tools/architecture-review-tools.js";
export const ARCHITECTURE_REVIEW_MODULE_ID = "architecture-review" as const;
export const ARCHITECTURE_REVIEW_MISSION_ID = "REAL-095" as const;
