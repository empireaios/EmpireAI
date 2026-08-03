import { AssignmentStore } from "./assignment-store.js";
import { PermissionStore } from "./permission-store.js";
import { PolicyStore } from "./policy-store.js";
import { RoleStore } from "./role-store.js";
import type { AuthorizationDecision } from "./types.js";
const matches = (pattern: string, value: string) => pattern === "*" || pattern === value;
export class AuthorizationEvaluator {
  constructor(private readonly roles: RoleStore, private readonly permissions: PermissionStore, private readonly policies: PolicyStore, private readonly assignments: AssignmentStore) {}
  evaluate(principalId: string | null | undefined, resource: string, action: string): AuthorizationDecision {
    const decisionId = `azw-dec-${Date.now()}`;
    if (!principalId) return { decisionId, principalId: null, resource, action, decision: "deny", reason: "Authorization cannot be established: no authenticated principal", timestamp: new Date().toISOString() };
    const assignments = this.assignments.list(principalId);
    if (!assignments.length) return { decisionId, principalId, resource, action, decision: "deny", reason: "Default deny: principal has no assignments", timestamp: new Date().toISOString() };
    const roleIds = new Set(assignments.flatMap((item) => item.roleId ? this.roles.ancestry(item.roleId) : []));
    const permissionIds = new Set(assignments.flatMap((item) => item.permissionId ? [item.permissionId] : []));
    const matching = this.policies.list().filter((policy) => {
      const subjectMatches = policy.principalId === principalId || (!!policy.roleId && roleIds.has(policy.roleId)) || (!!policy.permissionId && permissionIds.has(policy.permissionId));
      return subjectMatches && matches(policy.resource, resource) && matches(policy.action, action);
    });
    const directPermissionsMatch = [...permissionIds].some((id) => { const permission = this.permissions.get(id); return !!permission && matches(permission.resource, resource) && matches(permission.action, action); });
    const deny = matching.some((policy) => policy.effect === "deny");
    const allow = matching.some((policy) => policy.effect === "allow") || directPermissionsMatch;
    return { decisionId, principalId, resource, action, decision: deny ? "deny" : allow ? "allow" : "deny", reason: deny ? "Explicit deny policy overrides allow" : allow ? "Explicit least-privilege grant matched" : "Default deny: no matching allow policy", timestamp: new Date().toISOString() };
  }
}
