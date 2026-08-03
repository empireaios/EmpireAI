import { AssignmentStore } from "./assignment-store.js";
import { AuthorizationAudit } from "./authorization-audit.js";
import { AuthorizationEvaluator } from "./authorization-evaluator.js";
import type { CreatePermissionInput, CreatePolicyInput, CreateRoleInput, AssignPermissionInput, AssignRoleInput, EvaluateAccessInput } from "./types.js";
import { PermissionStore } from "./permission-store.js";
import { PolicyStore } from "./policy-store.js";
import { RoleStore } from "./role-store.js";
import { IntegrationCoordinator } from "./integrations.js";
export class AuthorizationRuntime {
  readonly roles = new RoleStore(); readonly permissions = new PermissionStore(); readonly policies = new PolicyStore(); readonly assignments = new AssignmentStore(); readonly audit = new AuthorizationAudit();
  private readonly evaluator = new AuthorizationEvaluator(this.roles, this.permissions, this.policies, this.assignments);
  constructor(private readonly integrations: IntegrationCoordinator) {}
  createRole(input: CreateRoleInput) { const role = this.roles.create(input); this.audit.record("role_created", null, `role:${role.roleId}`); return role; }
  createPermission(input: CreatePermissionInput) { const permission = this.permissions.create(input); this.audit.record("permission_created", null, `permission:${permission.permissionId}`); return permission; }
  createPolicy(input: CreatePolicyInput) { if (input.roleId && !this.roles.get(input.roleId)) throw new Error("Policy role does not exist"); if (input.permissionId && !this.permissions.get(input.permissionId)) throw new Error("Policy permission does not exist"); const policy = this.policies.create(input); this.audit.record("policy_created", null, `policy:${policy.policyId}`); return policy; }
  private ensureAdminAssignment(roleId: string, assignedBy?: string) { const role = this.roles.get(roleId); const administrative = roleId === "azw-role-admin" || Boolean(role && /admin/i.test(role.name)); if (!administrative) return; if (!this.assignments.anyRole(roleId)) return; if (!assignedBy || !this.assignments.hasRole(assignedBy, roleId)) throw new Error("Privilege escalation prevented: assigner must already hold administrative role"); }
  assignRole(input: AssignRoleInput) { if (!this.roles.get(input.roleId)) throw new Error("Role does not exist"); this.ensureAdminAssignment(input.roleId, input.assignedBy); const assignment = this.assignments.assignRole(input.principalId, input.roleId, input.assignedBy); this.audit.record("role_assigned", input.principalId, `role:${input.roleId}`); return assignment; }
  assignPermission(input: AssignPermissionInput) { if (!this.permissions.get(input.permissionId)) throw new Error("Permission does not exist"); const permission = this.permissions.get(input.permissionId)!; if (/admin/i.test(permission.name) && (!input.assignedBy || !this.assignments.hasRole(input.assignedBy, "azw-role-admin"))) throw new Error("Privilege escalation prevented: administrative permission requires azw-role-admin assigner"); const assignment = this.assignments.assignPermission(input.principalId, input.permissionId, input.assignedBy); this.audit.record("permission_assigned", input.principalId, `permission:${input.permissionId}`); return assignment; }
  consumeAuthenticatedIdentity(input: { sessionToken: string }) { const principalId = this.integrations.validateSession(input.sessionToken); return { principalId, sessionValid: Boolean(principalId) }; }
  evaluateAccess(input: EvaluateAccessInput) { const principalId = input.principalId ?? (input.sessionToken ? this.consumeAuthenticatedIdentity({ sessionToken: input.sessionToken }).principalId : null); const decision = this.evaluator.evaluate(principalId, input.resource, input.action); this.audit.recordDecision(decision); return decision; }
}
