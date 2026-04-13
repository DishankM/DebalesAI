import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/access/session";
import { requireAdminAccess } from "@/lib/access/rules";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/lib/db/models";
import { UpdateIntegrationsSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const project = await Project.findById(user.projectId).lean();
    return NextResponse.json({ integrations: project?.integrations });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    requireAdminAccess(user);
    const body = await req.json();
    const parsed = UpdateIntegrationsSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    await connectDB();
    const update: Record<string, unknown> = {};
    if (parsed.data.shopify !== undefined)
      update["integrations.shopify.enabled"] = parsed.data.shopify.enabled;
    if (parsed.data.crm !== undefined)
      update["integrations.crm.enabled"] = parsed.data.crm.enabled;

    const project = await Project.findByIdAndUpdate(
      user.projectId,
      { $set: update },
      { new: true }
    ).lean();

    return NextResponse.json({ integrations: project?.integrations });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
