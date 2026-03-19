import { WifiOff, CookingPot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">אין חיבור לאינטרנט</h1>
        <p className="text-base text-muted-foreground max-w-sm">
          בדקו את חיבור האינטרנט ונסו שוב. המתכונים שצפיתם בהם לאחרונה עשויים להיות זמינים.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
        <CookingPot className="size-4" />
        מתכונים משפחתיים
      </div>
    </div>
  );
}
