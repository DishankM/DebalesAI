import { connectDB } from "@/lib/db/connect";
import { Conversation, Message, ProductInstance, Project } from "@/lib/db/models";
import { callAI, AIMessage, IntegrationContext } from "./ai.service";
import { SessionUser } from "@/types";

export async function getConversations(projectId: string, userId: string) {
  await connectDB();
  return Conversation.find({ projectId, userId })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getConversationMessages(
  conversationId: string,
  projectId: string
) {
  await connectDB();
  return Message.find({ conversationId, projectId })
    .sort({ createdAt: 1 })
    .lean();
}

export async function createConversation(
  projectId: string,
  productInstanceId: string,
  userId: string,
  title = "New Conversation"
) {
  await connectDB();
  return Conversation.create({ projectId, productInstanceId, userId, title });
}

export async function sendMessage(
  user: SessionUser,
  conversationId: string,
  content: string
) {
  await connectDB();

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) throw new Error("Conversation not found");
  if (conversation.projectId.toString() !== user.projectId)
    throw new Error("Forbidden");

  // Save user message
  await Message.create({
    conversationId,
    projectId: user.projectId,
    role: "user",
    content,
  });

  // Get product instance for settings
  const productInstance = await ProductInstance.findById(
    conversation.productInstanceId
  ).lean();
  const systemPrompt =
    productInstance?.settings?.systemPrompt || "You are a helpful AI assistant.";

  // Get project integrations
  const project = await Project.findById(user.projectId).lean();
  const integrations: IntegrationContext = {
    shopify: { enabled: project?.integrations?.shopify?.enabled ?? false },
    crm: { enabled: project?.integrations?.crm?.enabled ?? false },
  };

  // Build conversation history for AI (exclude the user message we just saved — callAI appends it)
  const prevMessages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
  const priorTurns = prevMessages.slice(0, -1);
  const history: AIMessage[] = priorTurns.slice(-10).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  // Call AI
  const steps: string[] = [];
  const aiResponse = await callAI(content, history, systemPrompt, integrations, steps);

  // Save assistant message
  const assistantMsg = await Message.create({
    conversationId,
    projectId: user.projectId,
    role: "assistant",
    content: aiResponse,
    steps,
  });

  // First user message in this thread: set title from their text
  if (priorTurns.length === 0) {
    await Conversation.findByIdAndUpdate(conversationId, {
      title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
      updatedAt: new Date(),
    });
  } else {
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
  }

  return assistantMsg;
}

export async function getProjectStats(projectId: string) {
  await connectDB();
  const [conversations, messages] = await Promise.all([
    Conversation.countDocuments({ projectId }),
    Message.countDocuments({ projectId }),
  ]);
  return { conversations, messages };
}
