import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/access/session";
import { requireProjectAccess } from "@/lib/access/rules";
import {
  getConversationMessages,
  sendMessage,
} from "@/lib/services/conversation.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    requireProjectAccess(user, user?.projectSlug || "");
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId)
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    const messages = await getConversationMessages(conversationId, user.projectId);
    return NextResponse.json({ messages });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    requireProjectAccess(user, user?.projectSlug || "");
    const body = await req.json();
    const { conversationId, content } = body;
    if (!conversationId || !content)
      return NextResponse.json({ error: "conversationId and content required" }, { status: 400 });

    const message = await sendMessage(user, conversationId, content);
    return NextResponse.json({ message });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
