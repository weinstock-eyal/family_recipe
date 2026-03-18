import Image from "next/image";
import { format } from "date-fns";
import { Calendar, User, ExternalLink, Youtube, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstructionSection } from "@/src/db/schema";

type Props = {
  title: string;
  uploadedBy: string;
  createdAt: Date;
  imageUrl: string | null;
  youtubeUrl: string | null;
  sourceUrl: string | null;
  instructions: InstructionSection[] | null;
  hasIngredients: boolean;
};

export function RecipeDetail({
  title,
  uploadedBy,
  createdAt,
  imageUrl,
  youtubeUrl,
  sourceUrl,
  instructions,
  hasIngredients,
}: Props) {
  return (
    <div className="space-y-6">
      {imageUrl ? (
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-xl bg-muted">
          <ImageIcon className="size-12 text-muted-foreground/30" />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-4" />
            העלה: {uploadedBy}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            נוסף בתאריך: {format(createdAt, "dd/MM/yyyy")}
          </span>
        </div>
      </div>

      {(youtubeUrl || sourceUrl) && (
        <div className="flex flex-wrap gap-2">
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Youtube className="size-4 text-red-500" />
                צפה בסרטון
              </Button>
            </a>
          )}
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="size-4" />
                קישור למקור
              </Button>
            </a>
          )}
        </div>
      )}

      {!hasIngredients && (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
          <p className="text-muted-foreground">למתכון זה אין מרכיבים מפורטים</p>
          <Button variant="secondary" disabled className="gap-1.5">
            <Sparkles className="size-4" />
            חלץ מרכיבים עם AI
          </Button>
        </div>
      )}

      {instructions && instructions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">הוראות הכנה</h2>
          {instructions.map((section, si) => {
            const hasMultipleSections = instructions.length > 1 || (instructions.length === 1 && instructions[0].name);
            return (
              <div key={si} className="space-y-3">
                {hasMultipleSections && section.name && (
                  <h3 className="text-base font-semibold text-muted-foreground">{section.name}</h3>
                )}
                <ol className="space-y-3">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-base">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
