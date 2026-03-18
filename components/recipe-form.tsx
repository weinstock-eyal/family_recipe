"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { IngredientFormList } from "@/components/ingredient-form-list";
import { InstructionFormList } from "@/components/instruction-form-list";
import { ImageUpload } from "@/components/image-upload";
import type { ActionResult } from "@/src/lib/types";
import type { IngredientGroup, InstructionSection } from "@/src/db/schema";

type RecipeData = {
  id?: number;
  title: string;
  imageUrl?: string | null;
  youtubeUrl?: string | null;
  sourceUrl?: string | null;
  ingredients?: IngredientGroup[] | null;
  instructions?: InstructionSection[] | null;
  tags?: string[] | null;
};

type Props = {
  initialData?: RecipeData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (input: any) => Promise<ActionResult<{ id: number }>>;
  submitLabel: string;
  pendingLabel: string;
};

export function RecipeForm({ initialData, action, submitLabel, pendingLabel }: Props) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl ?? "");
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") ?? "");
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>(
    initialData?.ingredients ?? []
  );
  const [instructionSections, setInstructionSections] = useState<InstructionSection[]>(
    initialData?.instructions ?? []
  );
  const hasInitialIngredients = (initialData?.ingredients ?? []).some(g => g.items.length > 0);
  const hasInitialInstructions = (initialData?.instructions ?? []).some(s => s.steps.length > 0);
  const [showIngredients, setShowIngredients] = useState(hasInitialIngredients);
  const [showInstructions, setShowInstructions] = useState(hasInitialInstructions);
  const [initialNote, setInitialNote] = useState("");
  const [initialNoteType, setInitialNoteType] = useState<"comment" | "tip" | "change">("tip");

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown) => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const validGroups = ingredientGroups
        .map((g) => ({
          ...g,
          items: g.items.filter((ing) => ing.item.trim()),
        }))
        .filter((g) => g.items.length > 0);
      const validSections = instructionSections
        .map((s) => ({
          ...s,
          steps: s.steps.filter((step) => step.trim()),
        }))
        .filter((s) => s.steps.length > 0);

      const input: Record<string, unknown> = {
        title: title.trim(),
        ...(isEdit && { id: initialData!.id }),
        ...(imageUrl && { imageUrl }),
        ...(youtubeUrl && { youtubeUrl }),
        ...(sourceUrl && { sourceUrl }),
        ...(tags.length > 0 && { tags }),
        ...(validGroups.length > 0 && { ingredients: validGroups }),
        ...(validSections.length > 0 && { instructions: validSections }),
        ...(initialNote.trim() && !isEdit && {
          initialNote: initialNote.trim(),
          initialNoteType,
        }),
      };

      const result = await action(input);
      if (result.success) {
        router.push(`/recipes/${result.data.id}`);
      }
      return result;
    },
    null
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold">שם המתכון *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: עוגת שוקולד של סבתא"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">תמונה</Label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">קישור ליוטיוב</Label>
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">קישור למקור</Label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">תגיות</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="קינוחים, חלבי, אפייה"
            />
          </div>

          {/* Collapsible Ingredients */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                const next = !showIngredients;
                setShowIngredients(next);
                if (next && ingredientGroups.length === 0) {
                  setIngredientGroups([{ items: [{ amount: "", unit: "", item: "" }] }]);
                }
              }}
              className="flex items-center gap-2 text-base font-semibold"
            >
              {showIngredients ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              מרכיבים (אופציונלי)
            </button>
            {showIngredients && (
              <IngredientFormList groups={ingredientGroups} onChange={setIngredientGroups} />
            )}
          </div>

          {/* Collapsible Instructions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                const next = !showInstructions;
                setShowInstructions(next);
                if (next && instructionSections.length === 0) {
                  setInstructionSections([{ steps: [""] }]);
                }
              }}
              className="flex items-center gap-2 text-base font-semibold"
            >
              {showInstructions ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              הוראות הכנה (אופציונלי)
            </button>
            {showInstructions && (
              <InstructionFormList sections={instructionSections} onChange={setInstructionSections} />
            )}
          </div>

          {!isEdit && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setInitialNote(initialNote ? "" : " ")}
                className="flex items-center gap-2 text-base font-semibold"
              >
                {initialNote ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                <MessageSquare className="size-4" />
                הערה / טיפ / שינוי (אופציונלי)
              </button>
              {initialNote !== "" && (
                <div className="space-y-3">
                  <Textarea
                    value={initialNote.trim() ? initialNote : ""}
                    onChange={(e) => setInitialNote(e.target.value)}
                    placeholder="למשל: אני מוסיפה קצת יותר שוקולד..."
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    {(["tip", "comment", "change"] as const).map((type) => {
                      const labels = { comment: "הערה", tip: "טיפ", change: "שינוי" };
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={initialNoteType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInitialNoteType(type)}
                        >
                          {labels[type]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {state && !state.success && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
