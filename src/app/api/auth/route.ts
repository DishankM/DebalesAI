import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User, Project } from "@/lib/db/models";
import { LoginSchema } from "@/lib/validations/schemas";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email }).lean();
    if (!user)
      return NextResponse.json(
        { error: "User not found. Run `npm run seed` if the database is empty." },
        { status: 401 }
      );

    // Get their project
    const project = await Project.findOne({
      $or: [
        { adminIds: user._id },
        { memberIds: user._id },
      ],
    }).lean();
    if (!project)
      return NextResponse.json(
        { error: "No project linked to this user. Run `npm run seed` to restore demo data." },
        { status: 401 }
      );

    const isAdmin = project.adminIds.some((id) => id.toString() === user._id.toString());

    // Set cookies
    const cookieStore = cookies();
    cookieStore.set("userId", user._id.toString(), { httpOnly: true, path: "/" });
    cookieStore.set("projectSlug", project.slug, { httpOnly: true, path: "/" });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: isAdmin ? "admin" : "member",
        projectSlug: project.slug,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("userId");
  cookieStore.delete("projectSlug");
  return NextResponse.json({ ok: true });
}
