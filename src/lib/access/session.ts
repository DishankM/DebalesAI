import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/connect";
import { User, Project } from "@/lib/db/models";
import { SessionUser } from "@/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get("userId")?.value;
  const projectSlug = cookieStore.get("projectSlug")?.value;

  if (!userId || !projectSlug) return null;

  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const project = await Project.findOne({ slug: projectSlug }).lean();
  if (!project) return null;

  // Check user belongs to project
  const isAdmin = project.adminIds.some((id) => id.toString() === userId);
  const isMember = project.memberIds.some((id) => id.toString() === userId);
  if (!isAdmin && !isMember) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: isAdmin ? "admin" : "member",
    projectId: project._id.toString(),
    projectSlug: project.slug,
  };
}
