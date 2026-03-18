import { verifySession } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
