import type { CreatePermissionInput, Permission } from "./types.js";
export class PermissionStore {
  private readonly permissions = new Map<string, Permission>();
  create(input: CreatePermissionInput) { const permissionId = input.permissionId ?? `azw-perm-${Date.now()}-${this.permissions.size + 1}`; if (this.permissions.has(permissionId)) throw new Error("Permission ID already exists"); const permission: Permission = { permissionId, name: input.name, resource: input.resource, action: input.action, group: input.group, validated: input.validated !== false, createdAt: new Date().toISOString() }; this.permissions.set(permissionId, permission); return { ...permission }; }
  get(permissionId: string) { const permission = this.permissions.get(permissionId); return permission ? { ...permission } : null; }
  list() { return [...this.permissions.values()].map((permission) => ({ ...permission })); }
  byGroup(group: string) { return this.list().filter((permission) => permission.group === group); }
}
