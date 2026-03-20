"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { IngredientGroup, InstructionSection } from "@/src/db/schema";

type Props = {
  title: string;
  uploadedBy: string;
  createdAt: Date;
  imageUrl: string | null;
  ingredientGroups: IngredientGroup[] | null;
  instructionSections: InstructionSection[] | null;
  tags: string[] | null;
};

const W = 800; // canvas width (2x for retina sharpness)
const PAD = 48;
const CONTENT_W = W - PAD * 2;
const PRIMARY = "#6366f1";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderRecipeCard(props: Props): Promise<HTMLCanvasElement> {
  const {
    title,
    uploadedBy,
    createdAt,
    imageUrl,
    ingredientGroups,
    instructionSections,
    tags,
  } = props;

  const hasIngredients =
    ingredientGroups !== null &&
    ingredientGroups.some((g) => g.items.length > 0);

  // Load recipe image first
  const recipeImg = imageUrl ? await loadImage(imageUrl) : null;

  // Use a tall temporary canvas to measure content height
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = W;
  tmpCanvas.height = 8000;
  const ctx = tmpCanvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  let y = PAD;
  const rightX = W - PAD;

  // --- Recipe image ---
  if (recipeImg) {
    const imgH = (CONTENT_W * 9) / 16; // 16:9 aspect
    y += imgH + 24;
  }

  // --- Title ---
  ctx.font = "bold 40px Heebo, sans-serif";
  const titleLines = wrapText(ctx, title, CONTENT_W);
  y += titleLines.length * 50 + 8;

  // --- Uploader + date ---
  y += 28 + 16;

  // --- Tags ---
  if (tags && tags.length > 0) {
    y += 40 + 16;
  }

  // --- Ingredients ---
  if (hasIngredients && ingredientGroups) {
    y += 2 + 24; // separator + gap
    y += 36 + 12; // header
    for (const group of ingredientGroups) {
      if (group.name) y += 30 + 4;
      y += group.items.length * 32;
      y += 8;
    }
  }

  // --- Instructions ---
  if (instructionSections && instructionSections.length > 0) {
    y += 2 + 24; // separator + gap
    y += 36 + 12; // header
    ctx.font = "28px Heebo, sans-serif";
    for (const section of instructionSections) {
      if (section.name) y += 30 + 4;
      for (const step of section.steps) {
        const stepLines = wrapText(ctx, step, CONTENT_W - 48);
        y += stepLines.length * 34 + 12;
      }
      y += 8;
    }
  }

  // --- Footer ---
  y += 24 + 2 + 24 + 24 + PAD;

  // Create final canvas with exact height
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = y;
  const c = canvas.getContext("2d")!;

  // White background
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, W, y);

  c.direction = "rtl";
  c.textAlign = "right";

  let cy = PAD;

  // --- Draw recipe image ---
  if (recipeImg) {
    const imgH = (CONTENT_W * 9) / 16;
    // Draw rounded rectangle clipped image
    const imgX = PAD;
    const imgY = cy;
    const radius = 16;
    c.save();
    c.beginPath();
    c.moveTo(imgX + radius, imgY);
    c.lineTo(imgX + CONTENT_W - radius, imgY);
    c.quadraticCurveTo(imgX + CONTENT_W, imgY, imgX + CONTENT_W, imgY + radius);
    c.lineTo(imgX + CONTENT_W, imgY + imgH - radius);
    c.quadraticCurveTo(imgX + CONTENT_W, imgY + imgH, imgX + CONTENT_W - radius, imgY + imgH);
    c.lineTo(imgX + radius, imgY + imgH);
    c.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - radius);
    c.lineTo(imgX, imgY + radius);
    c.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
    c.closePath();
    c.clip();
    // Cover-fit the image
    const scale = Math.max(CONTENT_W / recipeImg.width, imgH / recipeImg.height);
    const sw = recipeImg.width * scale;
    const sh = recipeImg.height * scale;
    c.drawImage(recipeImg, imgX + (CONTENT_W - sw) / 2, imgY + (imgH - sh) / 2, sw, sh);
    c.restore();
    cy += imgH + 24;
  }

  // --- Title ---
  c.fillStyle = "#1a1a1a";
  c.font = "bold 40px Heebo, sans-serif";
  const drawnTitleLines = wrapText(c, title, CONTENT_W);
  for (const line of drawnTitleLines) {
    c.fillText(line, rightX, cy + 40);
    cy += 50;
  }
  cy += 8;

  // --- Uploader + date ---
  c.fillStyle = "#666666";
  c.font = "26px Heebo, sans-serif";
  c.fillText(`${uploadedBy}  •  ${format(createdAt, "dd/MM/yyyy")}`, rightX, cy + 22);
  cy += 28 + 16;

  // --- Tags ---
  if (tags && tags.length > 0) {
    c.font = "22px Heebo, sans-serif";
    c.textAlign = "center";
    let tagX = rightX;
    for (const tag of tags) {
      const tw = c.measureText(tag).width + 20;
      // Draw tag pill
      c.fillStyle = "#f3f4f6";
      const pillX = tagX - tw;
      const pillY = cy;
      const pillH = 32;
      const pillR = 16;
      c.beginPath();
      c.moveTo(pillX + pillR, pillY);
      c.lineTo(pillX + tw - pillR, pillY);
      c.quadraticCurveTo(pillX + tw, pillY, pillX + tw, pillY + pillR);
      c.lineTo(pillX + tw, pillY + pillH - pillR);
      c.quadraticCurveTo(pillX + tw, pillY + pillH, pillX + tw - pillR, pillY + pillH);
      c.lineTo(pillX + pillR, pillY + pillH);
      c.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR);
      c.lineTo(pillX, pillY + pillR);
      c.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
      c.closePath();
      c.fill();
      // Tag text
      c.fillStyle = "#4b5563";
      c.fillText(tag, pillX + tw / 2, pillY + 23);
      tagX -= tw + 10;
    }
    c.textAlign = "right";
    cy += 40 + 16;
  }

  // --- Helper: draw separator ---
  function drawSeparator() {
    c.strokeStyle = "#e5e7eb";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(PAD, cy);
    c.lineTo(W - PAD, cy);
    c.stroke();
    cy += 2 + 24;
  }

  // --- Ingredients ---
  if (hasIngredients && ingredientGroups) {
    drawSeparator();
    c.fillStyle = "#1a1a1a";
    c.font = "bold 32px Heebo, sans-serif";
    c.fillText("מרכיבים", rightX, cy + 28);
    cy += 36 + 12;

    for (const group of ingredientGroups) {
      if (group.name) {
        c.fillStyle = "#666666";
        c.font = "bold 26px Heebo, sans-serif";
        c.fillText(group.name, rightX, cy + 24);
        cy += 30 + 4;
      }
      for (const ing of group.items) {
        // Bullet dot
        c.fillStyle = PRIMARY;
        c.beginPath();
        c.arc(rightX - 4, cy + 14, 5, 0, Math.PI * 2);
        c.fill();

        // Ingredient text
        c.fillStyle = "#1a1a1a";
        c.font = "28px Heebo, sans-serif";
        const parts: string[] = [];
        if (ing.amount) parts.push(ing.amount);
        if (ing.unit) parts.push(ing.unit);
        parts.push(ing.item);
        const ingText = parts.join(" ");

        // Bold amount if present
        if (ing.amount) {
          c.font = "bold 28px Heebo, sans-serif";
          const amountW = c.measureText(ing.amount + " ").width;
          c.fillText(ing.amount, rightX - 20, cy + 22);
          c.font = "28px Heebo, sans-serif";
          const rest = parts.slice(1).join(" ");
          c.fillText(rest, rightX - 20 - amountW, cy + 22);
        } else {
          c.fillText(ingText, rightX - 20, cy + 22);
        }
        cy += 32;
      }
      cy += 8;
    }
  }

  // --- Instructions ---
  if (instructionSections && instructionSections.length > 0) {
    drawSeparator();
    c.fillStyle = "#1a1a1a";
    c.font = "bold 32px Heebo, sans-serif";
    c.fillText("הוראות הכנה", rightX, cy + 28);
    cy += 36 + 12;

    let stepNum = 1;
    for (const section of instructionSections) {
      if (section.name) {
        c.fillStyle = "#666666";
        c.font = "bold 26px Heebo, sans-serif";
        c.fillText(section.name, rightX, cy + 24);
        cy += 30 + 4;
      }
      for (const step of section.steps) {
        // Number circle
        c.fillStyle = PRIMARY;
        c.beginPath();
        c.arc(rightX - 14, cy + 16, 16, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffffff";
        c.font = "bold 20px Heebo, sans-serif";
        c.textAlign = "center";
        c.fillText(String(stepNum), rightX - 14, cy + 23);
        c.textAlign = "right";

        // Step text (wrapped)
        c.fillStyle = "#1a1a1a";
        c.font = "28px Heebo, sans-serif";
        const stepLines = wrapText(c, step, CONTENT_W - 48);
        for (let li = 0; li < stepLines.length; li++) {
          c.fillText(stepLines[li], rightX - 42, cy + 22 + li * 34);
        }
        cy += stepLines.length * 34 + 12;
        stepNum++;
      }
      cy += 8;
    }
  }

  // --- Footer ---
  drawSeparator();
  c.fillStyle = "#9ca3af";
  c.font = "22px Heebo, sans-serif";
  c.textAlign = "center";
  c.fillText("מתכונים משפחתיים", W / 2, cy + 20);

  return canvas;
}

export function ExportRecipeImage(props: Props) {
  const { title } = props;
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator.share === "function" &&
        typeof navigator.canShare === "function",
    );
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const canvas = await renderRecipeCard(props);
      const link = document.createElement("a");
      link.download = `${title}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }, [props, title]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const canvas = await renderRecipeCard(props);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const file = new File([blob], `${title}.png`, { type: "image/png" });
      await navigator.share({ title, files: [file] });
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") throw e;
    } finally {
      setSharing(false);
    }
  }, [props, title]);

  return (
    <>
      {canShare && (
        <Button
          variant="outline"
          size="default"
          className="min-h-[44px] gap-1.5"
          onClick={handleShare}
          disabled={sharing}
        >
          {sharing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-4" />
          )}
          {sharing ? "משתף..." : "שתף"}
        </Button>
      )}
      <Button
        variant="outline"
        size="default"
        className="min-h-[44px] gap-1.5"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        {exporting ? "מייצא..." : "הורד כתמונה"}
      </Button>
    </>
  );
}
