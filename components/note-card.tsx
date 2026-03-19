import { format } from "date-fns";
import { MessageCircle, Lightbulb, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NOTE_TYPE_CONFIG = {
  comment: { label: "הערה", icon: MessageCircle, variant: "secondary" as const },
  tip: { label: "טיפ", icon: Lightbulb, variant: "default" as const },
  change: { label: "שינוי", icon: RefreshCw, variant: "outline" as const },
};

type NoteCardProps = {
  id: number;
  author: string;
  note: string;
  noteType: string;
  createdAt: Date;
  isOwner: boolean;
  onDelete?: (id: number) => void;
};

export function NoteCard({
  author,
  note,
  noteType,
  createdAt,
  isOwner,
  id,
  onDelete,
}: NoteCardProps) {
  const config = NOTE_TYPE_CONFIG[noteType as keyof typeof NOTE_TYPE_CONFIG] ?? NOTE_TYPE_CONFIG.comment;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className="gap-1">
            <Icon className="size-3" />
            {config.label}
          </Badge>
          <span className="text-sm font-semibold">{author}</span>
          <span className="text-sm text-muted-foreground">
            {format(createdAt, "dd/MM/yyyy")}
          </span>
        </div>
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-sm text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
          >
            מחיקה
          </button>
        )}
      </div>
      <p className="text-base">{note}</p>
    </div>
  );
}
