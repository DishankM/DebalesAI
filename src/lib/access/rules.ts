import { SessionUser } from "@/types";

// ─── Pure access rules (no DB calls) ─────────────────────────────────────────

export function canAccessProject(user: SessionUser, projectSlug: string): boolean {
  return user.projectSlug === projectSlug;
}

export function canAccessAdminDashboard(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageIntegrations(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canViewConversations(user: SessionUser): boolean {
  return true; // all project members can view conversations
}

export function canSendMessages(user: SessionUser): boolean {
  return true; // all project members can send messages
}

export function canUpdateDashboardConfig(user: SessionUser): boolean {
  return user.role === "admin";
}

// ─── Access check helpers that throw ─────────────────────────────────────────

export function requireProjectAccess(user: SessionUser | null, projectSlug: string): asserts user is SessionUser {
  if (!user) throw new AccessError("Unauthorized: not logged in", 401);
  if (!canAccessProject(user, projectSlug)) throw new AccessError("Forbidden: no access to this project", 403);
}

export function requireAdminAccess(user: SessionUser | null): asserts user is SessionUser {
  if (!user) throw new AccessError("Unauthorized: not logged in", 401);
  if (!canAccessAdminDashboard(user)) throw new AccessError("Forbidden: admin only", 403);
}

export class AccessError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = "AccessError";
  }
}
