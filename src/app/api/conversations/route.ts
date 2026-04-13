import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/access/session";
import { requireProjectAccess } from "@/lib/access/rules";
import { getConversations, createConversation } from "@/lib/services/conversation.service";
import { CreateConversationSchema } from "@/lib/validations/schemas";
import { connectDB } from "@/lib/db/connect";
import { ProductInstance } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const slug = req.nextUrl.searchParams.get("slug") || "";
    requireProjectAccess(user, slug);
    const conversations = await getConversations(user.projectId, user.id);
    return NextResponse.json({ conversations });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    requireProjectAccess(user, user?.projectSlug || "");

    // If no productInstanceId provided, find default one for project
    let { productInstanceId } = parsed.data;
    if (!productInstanceId) {
      await connectDB();
      const pi = await ProductInstance.findOne({ projectId: user.projectId }).lean();
      if (!pi) return NextResponse.json({ error: "No product instance found" }, { status: 404 });
      productInstanceId = pi._id.toString();
    }

    const conversation = await createConversation(
      user.projectId,
      productInstanceId,
      user.id,
      parsed.data.title
    );
    return NextResponse.json({ conversation });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
