import Link from "next/link";
import { Plus, Users2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/src/lib/auth";
import { getGroupsByUserId } from "@/src/data/groups";
import { getUserById } from "@/src/data/users";
import { redirect } from "next/navigation";
import { GroupCard } from "@/components/group-card";
import { ShareDefaultToggle } from "@/components/share-default-toggle";

export default async function GroupsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const [result, userResult] = await Promise.all([
    getGroupsByUserId(session.userId),
    getUserById(session.userId),
  ]);
  const groups = result.success ? result.data : [];
  const shareWithAllByDefault =
    userResult.success ? userResult.data.shareWithAllByDefault : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">הקבוצות שלי</h1>
          {groups.length > 0 && (
            <p className="text-sm text-muted-foreground">{groups.length} קבוצות</p>
          )}
        </div>
        <Link href="/groups/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px] gap-1.5 bg-contrast text-contrast-foreground hover:bg-contrast/90">
            <Plus className="size-4" />
            קבוצה חדשה
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users2 className="size-12 text-muted-foreground/50" />
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              אין לך קבוצות עדיין
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                בקש ממשתמש אחר שישלח לך הזמנה להצטרף לקבוצה, או צור קבוצה חדשה והזמן אליה חברים.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              memberCount={Number(group.memberCount)}
              role={group.role}
            />
          ))}
        </div>
      )}

      {groups.length > 0 && (
        <ShareDefaultToggle
          userId={session.userId}
          defaultValue={shareWithAllByDefault === 1}
        />
      )}
    </div>
  );
}
