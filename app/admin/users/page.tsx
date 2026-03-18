import { verifySession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/src/data/users";
import { AdminUserTable } from "@/components/admin-user-table";
import { AdminUserForm } from "@/components/admin-user-form";

export default async function AdminUsersPage() {
  const session = await verifySession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const result = await getAllUsers();
  const users = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <AdminUserForm mode="create" />
      </div>
      <AdminUserTable users={users} currentUserId={session.userId} />
    </div>
  );
}
