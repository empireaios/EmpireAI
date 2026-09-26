import type { EmpireDatabase } from "../../brain/sqlite-database.js";
import { withQuiescedSqliteSave } from "../../brain/quiesced-sqlite-save.js";
import type { SqliteShadowCeoRepository } from "../shadow-ceo/repository.js";

/** Hold both candidate SQL.js handles through the caller's disk verification.
 * The caller must separately drain HTTP, background jobs, JSON/native stores,
 * Redis and other processes. This is not a production or whole-app snapshot.
 */
export async function withQuiescedBrainAndShadowCapture<T>(
  brain: EmpireDatabase,
  shadow: SqliteShadowCeoRepository,
  captureAndVerify: () => T | Promise<T>,
): Promise<T> {
  return withQuiescedSqliteSave(brain, () => shadow.withQuiescedCapture(captureAndVerify));
}
