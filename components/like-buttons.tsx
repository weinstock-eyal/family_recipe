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
  const [likesCount, setLikesCount] = useState(likes);
  const [dislikesCount, setDislikesCount] = useState(dislikes);

  useEffect(() => {
    setReaction(getStoredReaction(recipeId));
  }, [recipeId]);

  async function handleClick(type: "like" | "dislike") {
    const currentReaction = reaction;
    const newReaction = currentReaction === type ? null : type;

    // Optimistic count updates
    if (currentReaction === "like") setLikesCount((c) => c - 1);
    if (currentReaction === "dislike") setDislikesCount((c) => c - 1);
    if (newReaction === "like") setLikesCount((c) => c + 1);
    if (newReaction === "dislike") setDislikesCount((c) => c + 1);

    setReaction(newReaction);
    setStoredReaction(recipeId, newReaction);

    startTransition(async () => {
      await toggleRecipeLike({ id: recipeId, previousReaction: currentReaction, newReaction });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={reaction === "like" ? "default" : "ghost"}
        size="default"
        onClick={() => handleClick("like")}
        className="min-h-[44px] min-w-[44px] gap-2 px-4"
      >
        <ThumbsUp className="size-5" />
        {likesCount}
      </Button>
      <Button
        variant={reaction === "dislike" ? "default" : "ghost"}
        size="default"
        onClick={() => handleClick("dislike")}
        className="min-h-[44px] min-w-[44px] gap-2 px-4"
      >
        <ThumbsDown className="size-5" />
        {dislikesCount}
      </Button>
    </div>
  );
}
