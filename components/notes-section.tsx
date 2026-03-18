"use client";

import { useActionState, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NoteCard } from "@/components/note-card";
import { createNote, deleteNote } from "@/app/actions";

type Note = {
  id: number;
  author: string;
  note: string;
  noteType: string;
  createdAt: Date;
};

type Props = {
  recipeId: number;
  notes: Note[];
  currentUser: string;
};

export function NotesSection({ recipeId, notes, currentUser }: Props) {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<"comment" | "tip" | "change">("comment");

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown) => {
      if (!noteText.trim()) return { success: false, error: "תוכן ההערה נדרש" };
      const result = await createNote({
        recipeId,
        note: noteText.trim(),
        noteType,
      });
      if (result.success) {
        setNoteText("");
      }
      return result;
    },
    null
  );

  async function handleDeleteNote(noteId: number) {
    await deleteNote({ id: noteId, recipeId });
  }

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="size-5" />
        הערות משפחתיות
      </h2>

      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label className="font-semibold">הערה חדשה</Label>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="כתבו הערה..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {(["comment", "tip", "change"] as const).map((type) => {
              const labels = { comment: "הערה", tip: "טיפ", change: "שינוי" };
              return (
                <Button
                  key={type}
                  type="button"
                  variant={noteType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNoteType(type)}
                >
                  {labels[type]}
                </Button>
              );
            })}
          </div>
          <Button type="submit" disabled={isPending || !noteText.trim()}>
            {isPending ? "שומר..." : "הוסף הערה"}
          </Button>
        </div>

        {state && !state.success && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </form>

      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              id={n.id}
              author={n.author}
              note={n.note}
              noteType={n.noteType}
              createdAt={n.createdAt}
              isOwner={n.author === currentUser}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">אין הערות עדיין</p>
      )}
    </div>
  );
}
