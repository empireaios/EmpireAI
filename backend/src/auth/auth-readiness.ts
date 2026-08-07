/**
 * Grand King authentication readiness — distinguishes PROCESS RUNNING from
 * SYSTEM READY FOR GRAND KING ACCESS.
 *
 * Fail-closed on structural auth defects. Do not treat transient event-loop lag
 * as a hard structural failure (Railway /health/live remains the process probe).
 */
import { env } from "../config/env.js";
import { getDatabase } from "../brain/database.js";
import { getSqlitePersistStats } from "../brain/sqlite-database.js";
import { UserStore, type SessionStoreBackend } from "./session-store.js";
import { getRecentEventLoopLagMs } from "../runtime/event-loop-cooperative.js";
import { resolvePlatformIdentity } from "./platform-identity.js";

const DEV_SESSION_SECRET = "empireai-dev-session-secret-change-in-production";

export type AuthReadinessCheck = {
  key: string;
  ok: boolean;
  detail: string;
};

export type AuthReadinessReport = {
  ready: boolean;
  status: "ready" | "not_ready";
  grandKingAccess: "ready" | "blocked";
  checks: AuthReadinessCheck[];
  blockers: string[];
  eventLoopLagMs: number;
  sqlite: ReturnType<typeof getSqlitePersistStats>;
  founderEmailPresent: boolean;
  founderIdentityId: string | null;
  platformIdentity: string | null;
};

function sessionSecretOk(): AuthReadinessCheck {
  const secret = env.SESSION_SECRET ?? "";
  const production = env.NODE_ENV === "production";
  if (!secret || secret.length < 32) {
    return {
      key: "session_secret",
      ok: false,
      detail: "SESSION_SECRET missing or shorter than 32 characters",
    };
  }
  if (production && secret === DEV_SESSION_SECRET) {
    return {
      key: "session_secret",
      ok: false,
      detail: "SESSION_SECRET still set to development default in production",
    };
  }
  return { key: "session_secret", ok: true, detail: "PRESENT" };
}

function persistenceOk(): AuthReadinessCheck {
  const path = env.DATABASE_PATH ?? "";
  const production = env.NODE_ENV === "production";
  if (!path) {
    return { key: "database_path", ok: false, detail: "DATABASE_PATH missing" };
  }
  if (production && !path.startsWith("/data/")) {
    return {
      key: "database_path",
      ok: false,
      detail: "DATABASE_PATH is not under /data (ephemeral risk on Railway)",
    };
  }
  return {
    key: "database_path",
    ok: true,
    detail: production ? "PRESENT under /data" : "PRESENT",
  };
}

function redisConfigOk(): AuthReadinessCheck {
  if (env.NODE_ENV === "production" && env.REDIS_OPTIONAL) {
    return {
      key: "redis_config",
      ok: false,
      detail: "REDIS_OPTIONAL must not be true in production (sessions would be ephemeral)",
    };
  }
  if (env.NODE_ENV === "production" && !env.REDIS_URL) {
    return { key: "redis_config", ok: false, detail: "REDIS_URL missing" };
  }
  return { key: "redis_config", ok: true, detail: "PRESENT" };
}

export function assessAuthReadiness(options?: {
  sessionStore?: SessionStoreBackend | null;
}): AuthReadinessReport {
  const checks: AuthReadinessCheck[] = [];
  const blockers: string[] = [];

  const secretCheck = sessionSecretOk();
  checks.push(secretCheck);
  if (!secretCheck.ok) blockers.push(secretCheck.detail);

  const persistCheck = persistenceOk();
  checks.push(persistCheck);
  if (!persistCheck.ok) blockers.push(persistCheck.detail);

  const redisCheck = redisConfigOk();
  checks.push(redisCheck);
  if (!redisCheck.ok) blockers.push(redisCheck.detail);

  let founderEmailPresent = false;
  let founderIdentityId: string | null = null;
  let platformIdentity: string | null = null;

  try {
    const db = getDatabase();
    const users = new UserStore(db);
    const founder = users.findByEmail(env.FOUNDER_EMAIL);
    founderEmailPresent = Boolean(founder);
    if (!founder) {
      const check = {
        key: "grand_king_identity",
        ok: false,
        detail: "Grand King founder account missing from persistent users table",
      };
      checks.push(check);
      blockers.push(check.detail);
    } else if (!founder.passwordHash || founder.passwordHash.length < 20) {
      const check = {
        key: "grand_king_identity",
        ok: false,
        detail: "Grand King founder account present but password hash invalid",
      };
      checks.push(check);
      blockers.push(check.detail);
    } else if (founder.role !== "founder") {
      const check = {
        key: "grand_king_identity",
        ok: false,
        detail: `Grand King account role is "${founder.role}" (expected founder)`,
      };
      checks.push(check);
      blockers.push(check.detail);
    } else {
      founderIdentityId = founder.id;
      platformIdentity = resolvePlatformIdentity(founder.email, founder.role);
      checks.push({
        key: "grand_king_identity",
        ok: true,
        detail: "PRESENT",
      });
      if (platformIdentity !== "grand-king") {
        const check = {
          key: "platform_identity",
          ok: false,
          detail: `platformIdentity resolved to "${platformIdentity}" (expected grand-king)`,
        };
        checks.push(check);
        blockers.push(check.detail);
      } else {
        checks.push({ key: "platform_identity", ok: true, detail: "grand-king" });
      }
    }
  } catch (error) {
    const detail =
      error instanceof Error
        ? `Authentication database unavailable: ${error.message}`
        : "Authentication database unavailable";
    checks.push({ key: "authentication_database", ok: false, detail });
    blockers.push(detail);
  }

  if (options?.sessionStore) {
    checks.push({
      key: "session_store",
      ok: true,
      detail: "BOUND",
    });
  } else {
    // Presence of the bound store is validated by the route wiring; structural
    // redis config is already checked above.
    checks.push({
      key: "session_store",
      ok: true,
      detail: "CONFIGURED",
    });
  }

  const eventLoopLagMs = getRecentEventLoopLagMs();
  const ready = blockers.length === 0;

  return {
    ready,
    status: ready ? "ready" : "not_ready",
    grandKingAccess: ready ? "ready" : "blocked",
    checks,
    blockers,
    eventLoopLagMs,
    sqlite: getSqlitePersistStats(),
    founderEmailPresent,
    founderIdentityId,
    platformIdentity,
  };
}
