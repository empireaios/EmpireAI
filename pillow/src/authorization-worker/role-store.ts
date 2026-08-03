import type { CreateRoleInput, Role } from "./types.js";
export class RoleStore {
  private readonly roles = new Map<string, Role>();
  create(input: CreateRoleInput) { const roleId = input.roleId ?? `azw-role-${Date.now()}-${this.roles.size + 1}`; if (this.roles.has(roleId)) throw new Error("Role ID already exists"); if (input.parentRoleId && !this.roles.has(input.parentRoleId)) throw new Error("Parent role does not exist"); const role: Role = { roleId, name: input.name, description: input.description, parentRoleId: input.parentRoleId, validated: input.validated !== false, createdAt: new Date().toISOString() }; this.roles.set(roleId, role); return { ...role }; }
  get(roleId: string) { const role = this.roles.get(roleId); return role ? { ...role } : null; }
  list() { return [...this.roles.values()].map((role) => ({ ...role })); }
  ancestry(roleId: string) { const result: string[] = []; const seen = new Set<string>(); let current = this.roles.get(roleId); while (current && !seen.has(current.roleId)) { seen.add(current.roleId); result.push(current.roleId); current = current.parentRoleId ? this.roles.get(current.parentRoleId) : undefined; } return result; }
}
