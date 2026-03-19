import Link from "next/link";
import { Users2, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GroupCard({
  id,
  name,
  memberCount,
  role,
}: {
  id: number;
  name: string;
  memberCount: number;
  role: string;
}) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 min-h-[44px]">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <Users2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{name}</h3>
            {role === "admin" && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                <Shield className="size-3" />
                מנהל
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {memberCount} חברים
          </p>
        </div>
      </Card>
    </Link>
  );
}
