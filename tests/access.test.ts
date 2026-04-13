/**
 * Unit tests for pure access rules and Zod validation schemas
 * Run: npx jest
 */

import {
  canAccessProject,
  canAccessAdminDashboard,
  canManageIntegrations,
  canSendMessages,
  canUpdateDashboardConfig,
  requireProjectAccess,
  requireAdminAccess,
  AccessError,
} from "../src/lib/access/rules";

import {
  SendMessageSchema,
  LoginSchema,
  UpdateIntegrationsSchema,
  UpdateDashboardConfigSchema,
} from "../src/lib/validations/schemas";

import { SessionUser } from "../src/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const adminUser: SessionUser = {
  id: "user_admin",
  name: "Admin User",
  email: "admin@test.com",
  role: "admin",
  projectId: "proj_abc",
  projectSlug: "my-project",
};

const memberUser: SessionUser = {
  id: "user_member",
  name: "Member User",
  email: "member@test.com",
  role: "member",
  projectId: "proj_abc",
  projectSlug: "my-project",
};

// ─── Access Rule Tests ─────────────────────────────────────────────────────────
describe("Access Rules — canAccessProject", () => {
  it("allows user to access their own project", () => {
    expect(canAccessProject(adminUser, "my-project")).toBe(true);
    expect(canAccessProject(memberUser, "my-project")).toBe(true);
  });

  it("blocks user from accessing a different project", () => {
    expect(canAccessProject(adminUser, "other-project")).toBe(false);
    expect(canAccessProject(memberUser, "other-project")).toBe(false);
  });
});

describe("Access Rules — canAccessAdminDashboard", () => {
  it("allows admin to access admin dashboard", () => {
    expect(canAccessAdminDashboard(adminUser)).toBe(true);
  });

  it("blocks member from accessing admin dashboard", () => {
    expect(canAccessAdminDashboard(memberUser)).toBe(false);
  });
});

describe("Access Rules — canManageIntegrations", () => {
  it("allows admin to manage integrations", () => {
    expect(canManageIntegrations(adminUser)).toBe(true);
  });

  it("blocks member from managing integrations", () => {
    expect(canManageIntegrations(memberUser)).toBe(false);
  });
});

describe("Access Rules — canSendMessages / canViewConversations", () => {
  it("allows all roles to send messages and view conversations", () => {
    expect(canSendMessages(adminUser)).toBe(true);
    expect(canSendMessages(memberUser)).toBe(true);
  });
});

describe("Access Rules — canUpdateDashboardConfig", () => {
  it("allows admin to update dashboard config", () => {
    expect(canUpdateDashboardConfig(adminUser)).toBe(true);
  });

  it("blocks member from updating dashboard config", () => {
    expect(canUpdateDashboardConfig(memberUser)).toBe(false);
  });
});

describe("Access Rules — requireProjectAccess", () => {
  it("passes for valid user and correct slug", () => {
    expect(() => requireProjectAccess(adminUser, "my-project")).not.toThrow();
  });

  it("throws 401 when user is null", () => {
    expect(() => requireProjectAccess(null, "my-project")).toThrow(AccessError);
    try {
      requireProjectAccess(null, "my-project");
    } catch (e) {
      expect((e as AccessError).statusCode).toBe(401);
    }
  });

  it("throws 403 when accessing wrong project", () => {
    try {
      requireProjectAccess(adminUser, "wrong-project");
    } catch (e) {
      expect(e).toBeInstanceOf(AccessError);
      expect((e as AccessError).statusCode).toBe(403);
    }
  });
});

describe("Access Rules — requireAdminAccess", () => {
  it("passes for admin user", () => {
    expect(() => requireAdminAccess(adminUser)).not.toThrow();
  });

  it("throws 401 for null user", () => {
    try {
      requireAdminAccess(null);
    } catch (e) {
      expect((e as AccessError).statusCode).toBe(401);
    }
  });

  it("throws 403 for member user", () => {
    try {
      requireAdminAccess(memberUser);
    } catch (e) {
      expect(e).toBeInstanceOf(AccessError);
      expect((e as AccessError).statusCode).toBe(403);
    }
  });
});

// ─── Zod Schema Tests ─────────────────────────────────────────────────────────
describe("Zod — LoginSchema", () => {
  it("accepts valid email", () => {
    const result = LoginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("Zod — SendMessageSchema", () => {
  it("accepts valid message payload", () => {
    const result = SendMessageSchema.safeParse({
      content: "Hello AI!",
      projectId: "proj_abc",
      productInstanceId: "pi_xyz",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = SendMessageSchema.safeParse({
      content: "",
      projectId: "proj_abc",
      productInstanceId: "pi_xyz",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 4000 chars", () => {
    const result = SendMessageSchema.safeParse({
      content: "x".repeat(4001),
      projectId: "proj_abc",
      productInstanceId: "pi_xyz",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional conversationId", () => {
    const result = SendMessageSchema.safeParse({
      content: "Hi",
      projectId: "proj_abc",
      productInstanceId: "pi_xyz",
      conversationId: "conv_123",
    });
    expect(result.success).toBe(true);
  });
});

describe("Zod — UpdateIntegrationsSchema", () => {
  it("accepts shopify toggle", () => {
    const result = UpdateIntegrationsSchema.safeParse({ shopify: { enabled: true } });
    expect(result.success).toBe(true);
  });

  it("accepts crm toggle", () => {
    const result = UpdateIntegrationsSchema.safeParse({ crm: { enabled: false } });
    expect(result.success).toBe(true);
  });

  it("accepts both toggles", () => {
    const result = UpdateIntegrationsSchema.safeParse({
      shopify: { enabled: true },
      crm: { enabled: false },
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean enabled", () => {
    const result = UpdateIntegrationsSchema.safeParse({ shopify: { enabled: "yes" } });
    expect(result.success).toBe(false);
  });
});

describe("Zod — UpdateDashboardConfigSchema", () => {
  it("accepts valid theme update", () => {
    const result = UpdateDashboardConfigSchema.safeParse({ theme: "dark" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid theme", () => {
    const result = UpdateDashboardConfigSchema.safeParse({ theme: "blue" });
    expect(result.success).toBe(false);
  });

  it("accepts valid sections update", () => {
    const result = UpdateDashboardConfigSchema.safeParse({
      sections: [
        {
          id: "s1",
          title: "Overview",
          order: 1,
          widgets: [
            { id: "w1", type: "stats-card", title: "Conversations", size: "sm", order: 1, visible: true },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid widget size", () => {
    const result = UpdateDashboardConfigSchema.safeParse({
      sections: [
        {
          id: "s1",
          title: "Overview",
          order: 1,
          widgets: [{ id: "w1", type: "stats-card", title: "Test", size: "xxl", order: 1, visible: true }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
