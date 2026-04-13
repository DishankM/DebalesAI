import { connectDB } from "@/lib/db/connect";
import { DashboardConfig, Project, Conversation, Message, User } from "@/lib/db/models";
import { IDashboardConfig } from "@/types";

export async function getDashboardConfig(projectId: string): Promise<IDashboardConfig | null> {
  await connectDB();
  const config = await DashboardConfig.findOne({ projectId }).lean();
  if (!config) return null;
  return {
    _id: config._id.toString(),
    projectId: config.projectId.toString(),
    title: config.title,
    theme: config.theme,
    sections: config.sections as IDashboardConfig["sections"],
    updatedAt: config.updatedAt,
  };
}

export async function updateDashboardConfig(
  projectId: string,
  update: Partial<IDashboardConfig>
) {
  await connectDB();
  return DashboardConfig.findOneAndUpdate(
    { projectId },
    { ...update, updatedAt: new Date() },
    { new: true, upsert: false }
  ).lean();
}

export async function getDashboardStats(projectId: string) {
  await connectDB();
  const [totalConversations, totalMessages, totalUsers, project] = await Promise.all([
    Conversation.countDocuments({ projectId }),
    Message.countDocuments({ projectId, role: "assistant" }),
    User.countDocuments({ projectIds: projectId }),
    Project.findById(projectId).lean(),
  ]);

  // Mock chart data (7 days)
  const now = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      conversations: Math.floor(Math.random() * 20) + 5,
      messages: Math.floor(Math.random() * 60) + 15,
    };
  });

  // Recent conversations
  const recentConversations = await Conversation.find({ projectId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  return {
    totalConversations,
    totalMessages,
    totalUsers: totalUsers || 2,
    aiUsage: { used: Math.min(totalMessages * 3, 950), limit: 1000 },
    integrations: project?.integrations,
    chartData,
    recentConversations: recentConversations.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      updatedAt: c.updatedAt,
    })),
  };
}
