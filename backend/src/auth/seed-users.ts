import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getDatabase } from "../brain/database.js";
import { UserStore } from "./session-store.js";

/**
 * Ensure founder/admin bootstrap accounts exist and match env passwords.
 * Env credentials are the canonical source for these seed accounts — if the
 * stored hash drifts (volume restore, prior password, failed deploy), re-hash
 * from FOUNDER_PASSWORD / ADMIN_PASSWORD so production login cannot soft-lock.
 */
export async function seedDefaultUsers(): Promise<void> {
  const db = getDatabase();
  const users = new UserStore(db);

  const defaults = [
    {
      email: env.FOUNDER_EMAIL,
      password: env.FOUNDER_PASSWORD,
      name: "Empire Founder",
      role: "founder" as const,
      workspaceId: "ws_empire_1",
    },
    {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      name: "Platform Admin",
      role: "admin" as const,
      workspaceId: "ws_empire_1",
    },
  ];

  for (const account of defaults) {
    const existing = users.findByEmail(account.email);
    if (!existing) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      users.create({
        email: account.email,
        name: account.name,
        role: account.role,
        workspaceId: account.workspaceId,
        passwordHash,
      });
      logger.info({ email: account.email, role: account.role }, "Seeded bootstrap account");
      continue;
    }

    const matches = await verifyPassword(account.password, existing.passwordHash);
    if (!matches) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      users.updatePasswordHash(existing.id, passwordHash);
      logger.warn(
        { email: account.email, role: account.role },
        "Synced bootstrap account password hash from environment (previous hash did not match)",
      );
    }
  }
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
