import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/access/session";
import { requireAdminAccess } from "@/lib/access/rules";
import { getDashboardConfig, updateDashboardConfig, getDashboardStats } from "@/lib/services/dashboard.service";
import { UpdateDashboardConfigSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const user = await getSessionUser();
    requireAdminAccess(user);
    const [config, stats] = await Promise.all([
      getDashboardConfig(user.projectId),
      getDashboardStats(user.projectId),
    ]);
    return NextResponse.json({ config, stats });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    requireAdminAccess(user);
    const body = await req.json();
    const parsed = UpdateDashboardConfigSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const updated = await updateDashboardConfig(user.projectId, parsed.data);
    return NextResponse.json({ config: updated });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
