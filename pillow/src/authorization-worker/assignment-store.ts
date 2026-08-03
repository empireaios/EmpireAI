import type { RoleAssignment } from "./types.js";
export class AssignmentStore {
  private readonly assignments: RoleAssignment[] = [];
  assignRole(principalId: string, roleId: string, assignedBy?: string) { const item: RoleAssignment = { assignmentId: `azw-asn-${Date.now()}-${this.assignments.length + 1}`, principalId, roleId, assignedBy, createdAt: new Date().toISOString() }; this.assignments.push(item); return { ...item }; }
  assignPermission(principalId: string, permissionId: string, assignedBy?: string) { const item: RoleAssignment = { assignmentId: `azw-asn-${Date.now()}-${this.assignments.length + 1}`, principalId, permissionId, assignedBy, createdAt: new Date().toISOString() }; this.assignments.push(item); return { ...item }; }
  list(principalId?: string) { return this.assignments.filter((item) => !principalId || item.principalId === principalId).map((item) => ({ ...item })); }
  hasRole(principalId: string, roleId: string) { return this.assignments.some((item) => item.principalId === principalId && item.roleId === roleId); }
  anyRole(roleId: string) { return this.assignments.some((item) => item.roleId === roleId); }
}
