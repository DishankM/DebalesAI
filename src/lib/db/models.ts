import mongoose, { Schema, Document, Model } from "mongoose";

// ─── User ───────────────────────────────────────────────────────────────────
export interface UserDoc extends Document {
  name: string;
  email: string;
  role: "admin" | "member";
  projectIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true }
);

// ─── Project ─────────────────────────────────────────────────────────────────
export interface ProjectDoc extends Document {
  name: string;
  slug: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  adminIds: mongoose.Types.ObjectId[];
  integrations: {
    shopify: { enabled: boolean; storeName: string; apiKey: string };
    crm: { enabled: boolean; provider: string; apiKey: string };
  };
  createdAt: Date;
}

const ProjectSchema = new Schema<ProjectDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    adminIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    integrations: {
      shopify: {
        enabled: { type: Boolean, default: false },
        storeName: { type: String, default: "demo-store" },
        apiKey: { type: String, default: "sk_demo_shopify" },
      },
      crm: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "HubSpot" },
        apiKey: { type: String, default: "sk_demo_crm" },
      },
    },
  },
  { timestamps: true }
);

// ─── ProductInstance ─────────────────────────────────────────────────────────
export interface ProductInstanceDoc extends Document {
  projectId: mongoose.Types.ObjectId;
  productType: "ai-sales-assistant" | "ai-support-agent" | "ai-analyst";
  nameSpace: string;
  settings: { model: string; temperature: number; systemPrompt: string };
}

const ProductInstanceSchema = new Schema<ProductInstanceDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    productType: {
      type: String,
      enum: ["ai-sales-assistant", "ai-support-agent", "ai-analyst"],
      required: true,
    },
    nameSpace: { type: String, required: true },
    settings: {
      model: { type: String, default: "gemini-1.5-flash" },
      temperature: { type: Number, default: 0.7 },
      systemPrompt: { type: String, default: "You are a helpful AI assistant." },
    },
  },
  { timestamps: true }
);

// ─── Conversation ─────────────────────────────────────────────────────────────
export interface ConversationDoc extends Document {
  projectId: mongoose.Types.ObjectId;
  productInstanceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    productInstanceId: { type: Schema.Types.ObjectId, ref: "ProductInstance", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Conversation" },
  },
  { timestamps: true }
);

// ─── Message ─────────────────────────────────────────────────────────────────
export interface MessageDoc extends Document {
  conversationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  steps: string[];
  createdAt: Date;
}

const MessageSchema = new Schema<MessageDoc>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    steps: [{ type: String }],
  },
  { timestamps: true }
);

// ─── DashboardConfig ─────────────────────────────────────────────────────────
export interface DashboardConfigDoc extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  theme: "dark" | "light";
  sections: {
    id: string;
    title: string;
    order: number;
    widgets: {
      id: string;
      type: string;
      title: string;
      size: "sm" | "md" | "lg" | "full";
      order: number;
      visible: boolean;
      config?: Record<string, unknown>;
    }[];
  }[];
  updatedAt: Date;
}

// Nested arrays need explicit sub-schemas; otherwise Mongoose may treat `widgets` as [String].
const DashboardWidgetSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    size: { type: String, enum: ["sm", "md", "lg", "full"], required: true },
    order: { type: Number, required: true },
    visible: { type: Boolean, required: true },
    config: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const DashboardSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    widgets: { type: [DashboardWidgetSchema], default: [] },
  },
  { _id: false }
);

const DashboardConfigSchema = new Schema<DashboardConfigDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    title: { type: String, default: "Project Dashboard" },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    sections: { type: [DashboardSectionSchema], default: [] },
  },
  { timestamps: true }
);

function getModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const User = getModel<UserDoc>("User", UserSchema);
export const Project = getModel<ProjectDoc>("Project", ProjectSchema);
export const ProductInstance = getModel<ProductInstanceDoc>("ProductInstance", ProductInstanceSchema);
export const Conversation = getModel<ConversationDoc>("Conversation", ConversationSchema);
export const Message = getModel<MessageDoc>("Message", MessageSchema);
export const DashboardConfig = getModel<DashboardConfigDoc>("DashboardConfig", DashboardConfigSchema);
