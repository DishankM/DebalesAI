export type UserRole = "admin" | "member";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  projectIds: string[];
  createdAt: Date;
}

export interface IProject {
  _id: string;
  name: string;
  slug: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  adminIds: string[];
  integrations: {
    shopify: { enabled: boolean; storeName: string; apiKey: string };
    crm: { enabled: boolean; provider: string; apiKey: string };
  };
  createdAt: Date;
}

export interface IProductInstance {
  _id: string;
  projectId: string;
  productType: "ai-sales-assistant" | "ai-support-agent" | "ai-analyst";
  nameSpace: string;
  settings: { model: string; temperature: number; systemPrompt: string };
  createdAt: Date;
}

export interface IConversation {
  _id: string;
  projectId: string;
  productInstanceId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  projectId: string;
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  createdAt: Date;
}

export type WidgetType =
  | "stats-card"
  | "conversation-chart"
  | "integration-status"
  | "recent-conversations"
  | "user-activity"
  | "ai-usage-meter"
  | "quick-actions";

export interface IDashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: "sm" | "md" | "lg" | "full";
  order: number;
  visible: boolean;
  config?: Record<string, unknown>;
}

export interface IDashboardSection {
  id: string;
  title: string;
  order: number;
  widgets: IDashboardWidget[];
}

export interface IDashboardConfig {
  _id: string;
  projectId: string;
  title: string;
  theme: "dark" | "light";
  sections: IDashboardSection[];
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  projectId: string;
  projectSlug: string;
}
