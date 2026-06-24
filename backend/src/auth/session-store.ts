import { randomBytes, randomUUID } from "node:crypto";
import type { RedisClient } from "../config/redis-client.js";
import { env } from "../config/env.js";
import type { SessionRecord, SessionUser } from "./permissions.js";

const SESSION_PREFIX = "empireai:session:";

export interface SessionStoreBackend {
  create(user: SessionUser): Promise<SessionRecord>;
  get(token: string): Promise<SessionRecord | null>;
  destroy(token: string): Promise<void>;
  refresh(token: string): Promise<SessionRecord | null>;
}

export class SessionStore implements SessionStoreBackend {
  constructor(private readonly redis: RedisClient) {}

  async create(user: SessionUser): Promise<SessionRecord> {
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    const session: SessionRecord = {
      ...user,
      token,
      expiresAt,
      createdAt: now.toISOString(),
    };

    await this.redis.setex(
      `${SESSION_PREFIX}${token}`,
      env.SESSION_TTL_SECONDS,
      JSON.stringify(session),
    );

    return session;
  }

  async get(token: string): Promise<SessionRecord | null> {
    const raw = await this.redis.get(`${SESSION_PREFIX}${token}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionRecord;
  }

  async destroy(token: string): Promise<void> {
    await this.redis.del(`${SESSION_PREFIX}${token}`);
  }

  async refresh(token: string): Promise<SessionRecord | null> {
    const session = await this.get(token);
    if (!session) return null;

    await this.destroy(token);
    const { token: _old, expiresAt: _exp, createdAt: _created, ...user } =
      session;
    return this.create(user);
  }
}

export class InMemorySessionStore implements SessionStoreBackend {
  private readonly sessions = new Map<string, SessionRecord>();

  async create(user: SessionUser): Promise<SessionRecord> {
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    const session: SessionRecord = {
      ...user,
      token,
      expiresAt,
      createdAt: now.toISOString(),
    };

    this.sessions.set(token, session);
    return session;
  }

  async get(token: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  async destroy(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async refresh(token: string): Promise<SessionRecord | null> {
    const session = await this.get(token);
    if (!session) return null;

    await this.destroy(token);
    const { token: _old, expiresAt: _exp, createdAt: _created, ...user } =
      session;
    return this.create(user);
  }
}

export type DbUser = SessionUser & { passwordHash: string };

export class UserStore {
  constructor(private readonly db: import("../brain/database.js").EmpireDatabase) {}

  findByEmail(email: string): DbUser | null {
    const row = this.db
      .prepare(`SELECT * FROM users WHERE email = @email LIMIT 1`)
      .get({ email: email.toLowerCase() }) as DbUserRow | undefined;

    return row ? mapUser(row) : null;
  }

  findById(id: string): SessionUser | null {
    const row = this.db
      .prepare(`SELECT * FROM users WHERE id = @id LIMIT 1`)
      .get({ id }) as DbUserRow | undefined;

    if (!row) return null;
    const user = mapUser(row);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    };
  }

  create(user: Omit<DbUser, "id">): SessionUser {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO users (id, email, name, role, workspace_id, password_hash, created_at)
         VALUES (@id, @email, @name, @role, @workspaceId, @passwordHash, @createdAt)`,
      )
      .run({
        id,
        email: user.email.toLowerCase(),
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
        passwordHash: user.passwordHash,
        createdAt: new Date().toISOString(),
      });

    return {
      id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    };
  }
}

type DbUserRow = {
  id: string;
  email: string;
  name: string;
  role: SessionUser["role"];
  workspace_id: string;
  password_hash: string;
  created_at: string;
};

function mapUser(row: DbUserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    workspaceId: row.workspace_id,
    passwordHash: row.password_hash,
  };
}
