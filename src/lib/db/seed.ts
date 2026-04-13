import mongoose from "mongoose";
import { User, Project, ProductInstance, DashboardConfig } from "./models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/debales-ai";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    ProductInstance.deleteMany({}),
    DashboardConfig.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // ─── Users ───────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: "Alex Admin",
    email: "admin@debales.ai",
    role: "admin",
    projectIds: [],
  });

  const memberUser = await User.create({
    name: "Sam Member",
    email: "member@debales.ai",
    role: "member",
    projectIds: [],
  });

  const admin2 = await User.create({
    name: "Jordan Tech",
    email: "jordan@techcorp.ai",
    role: "admin",
    projectIds: [],
  });

  const member2 = await User.create({
    name: "Casey Dev",
    email: "casey@techcorp.ai",
    role: "member",
    projectIds: [],
  });

  // ─── Projects ─────────────────────────────────────────────────────────────
  const project1 = await Project.create({
    name: "Debales AI Demo",
    slug: "debales-demo",
    description: "Main demo project showcasing AI Sales Assistant capabilities",
    ownerId: adminUser._id,
    memberIds: [memberUser._id],
    adminIds: [adminUser._id],
    integrations: {
      shopify: { enabled: true, storeName: "debales-store", apiKey: "sk_demo_shopify_123" },
      crm: { enabled: true, provider: "HubSpot", apiKey: "sk_demo_crm_456" },
    },
  });

  const project2 = await Project.create({
    name: "TechCorp Assistant",
    slug: "techcorp",
    description: "TechCorp support and sales AI assistant",
    ownerId: admin2._id,
    memberIds: [member2._id],
    adminIds: [admin2._id],
    integrations: {
      shopify: { enabled: false, storeName: "techcorp-shop", apiKey: "sk_demo_shopify_789" },
      crm: { enabled: true, provider: "Salesforce", apiKey: "sk_demo_salesforce_101" },
    },
  });

  // Update user projectIds
  await User.findByIdAndUpdate(adminUser._id, { projectIds: [project1._id] });
  await User.findByIdAndUpdate(memberUser._id, { projectIds: [project1._id] });
  await User.findByIdAndUpdate(admin2._id, { projectIds: [project2._id] });
  await User.findByIdAndUpdate(member2._id, { projectIds: [project2._id] });

  // ─── Product Instances ────────────────────────────────────────────────────
  const pi1 = await ProductInstance.create({
    projectId: project1._id,
    productType: "ai-sales-assistant",
    nameSpace: "debales-demo/sales",
    settings: {
      model: "gemini-1.5-flash",
      temperature: 0.7,
      systemPrompt:
        "You are an AI Sales Assistant for Debales AI. Help users with product inquiries, pricing, and sales. When Shopify integration is active, you have access to product catalog and order data. When CRM integration is active, you have customer relationship data.",
    },
  });

  await ProductInstance.create({
    projectId: project2._id,
    productType: "ai-support-agent",
    nameSpace: "techcorp/support",
    settings: {
      model: "gemini-1.5-flash",
      temperature: 0.5,
      systemPrompt:
        "You are an AI Support Agent for TechCorp. Help users troubleshoot issues and answer product questions.",
    },
  });

  // ─── Dashboard Configs ────────────────────────────────────────────────────
  await DashboardConfig.create({
    projectId: project1._id,
    title: "Debales AI Command Center",
    theme: "dark",
    sections: [
      {
        id: "overview",
        title: "Overview",
        order: 1,
        widgets: [
          { id: "w1", type: "stats-card", title: "Total Conversations", size: "sm", order: 1, visible: true, config: { metric: "conversations", color: "indigo" } },
          { id: "w2", type: "stats-card", title: "Active Users", size: "sm", order: 2, visible: true, config: { metric: "users", color: "emerald" } },
          { id: "w3", type: "stats-card", title: "AI Responses", size: "sm", order: 3, visible: true, config: { metric: "messages", color: "violet" } },
          { id: "w4", type: "ai-usage-meter", title: "AI Usage", size: "sm", order: 4, visible: true, config: { limit: 1000, used: 342 } },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        order: 2,
        widgets: [
          { id: "w5", type: "conversation-chart", title: "Conversation Trends", size: "lg", order: 1, visible: true, config: { days: 7 } },
          { id: "w6", type: "user-activity", title: "User Activity", size: "md", order: 2, visible: true },
        ],
      },
      {
        id: "integrations-section",
        title: "Integrations",
        order: 3,
        widgets: [
          { id: "w7", type: "integration-status", title: "Integration Health", size: "full", order: 1, visible: true },
        ],
      },
      {
        id: "activity",
        title: "Recent Activity",
        order: 4,
        widgets: [
          { id: "w8", type: "recent-conversations", title: "Recent Conversations", size: "lg", order: 1, visible: true, config: { limit: 5 } },
          { id: "w9", type: "quick-actions", title: "Quick Actions", size: "md", order: 2, visible: true },
        ],
      },
    ],
  });

  await DashboardConfig.create({
    projectId: project2._id,
    title: "TechCorp Support Dashboard",
    theme: "dark",
    sections: [
      {
        id: "overview",
        title: "Overview",
        order: 1,
        widgets: [
          { id: "w1", type: "stats-card", title: "Open Tickets", size: "sm", order: 1, visible: true, config: { metric: "conversations", color: "rose" } },
          { id: "w2", type: "stats-card", title: "Resolved Today", size: "sm", order: 2, visible: true, config: { metric: "messages", color: "emerald" } },
          { id: "w3", type: "ai-usage-meter", title: "AI Usage", size: "md", order: 3, visible: true, config: { limit: 500, used: 89 } },
        ],
      },
      {
        id: "activity",
        title: "Activity",
        order: 2,
        widgets: [
          { id: "w4", type: "recent-conversations", title: "Recent Tickets", size: "full", order: 1, visible: true, config: { limit: 8 } },
        ],
      },
    ],
  });

  console.log("\n✅ Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DEMO USERS (use these to login):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Admin:  admin@debales.ai  → Project: debales-demo`);
  console.log(`Member: member@debales.ai → Project: debales-demo`);
  console.log(`Admin:  jordan@techcorp.ai → Project: techcorp`);
  console.log(`Member: casey@techcorp.ai  → Project: techcorp`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\nProduct Instance ID (debales): ${pi1._id}`);

  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
