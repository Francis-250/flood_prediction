import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AppLayout from "@/components/AppLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "ADMIN") {
    if (user.role === "OFFICIAL") redirect("/official");
    if (user.role === "RESIDENT") redirect("/resident");
    redirect("/auth/login");
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
