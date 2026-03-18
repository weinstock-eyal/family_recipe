"use client";

import { useState, useEffect, startTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleRecipeLike } from "@/app/actions";

type Props = {
  recipeId: number;
  likes: number;
  dislikes: number;
};

type Reaction = "like" | "dislike" | null;

function getStoredReaction(recipeId: number): Reaction {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`recipe-reaction-${recipeId}`);
  if (stored === "like" || stored === "dislike") return stored;
  return null;
}

function setStoredReaction(recipeId: number, reaction: Reaction) {
  if (typeof window === "undefined") return;
  if (reaction) {
    localStorage.setItem(`recipe-reaction-${recipeId}`, reaction);
  } else {
    localStorage.removeItem(`recipe-reaction-${recipeId}`);
  }
}

export function LikeButtons({ recipeId, likes, dislikes }: Props) {
  const [reaction, setReaction] = useState<Reaction>(null);

  useEffect(() => {
    setReaction(getStoredReaction(recipeId));
  }, [recipeId]);

  async function handleClick(type: "like" | "dislike") {
    const currentReaction = reaction;
    const newReaction = currentReaction === type ? null : type;

    // Optimistic update
    setReaction(newReaction);
    setStoredReaction(recipeId, newReaction);

    startTransition(async () => {
      await toggleRecipeLike({ id: recipeId, previousReaction: currentReaction, newReaction });
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={reaction === "like" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleClick("like")}
      >
        <ThumbsUp className="size-5" />
      </Button>
      <Button
        variant={reaction === "dislike" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleClick("dislike")}
      >
        <ThumbsDown className="size-5" />
      </Button>
    </div>
  );
}
