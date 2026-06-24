import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { getDatabase } from "../brain/database.js";
import { UserStore } from "./session-store.js";

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
    if (users.findByEmail(account.email)) continue;

    const passwordHash = await bcrypt.hash(account.password, 12);
    users.create({
      email: account.email,
      name: account.name,
      role: account.role,
      workspaceId: account.workspaceId,
      passwordHash,
    });
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
