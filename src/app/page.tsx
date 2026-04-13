import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/access/session";

export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  redirect(`/project/${user.projectSlug}/chat`);
}
