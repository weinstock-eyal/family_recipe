"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
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

export function ExportRecipeImage({
  title,
  uploadedBy,
  createdAt,
  imageUrl,
  ingredientGroups,
  instructionSections,
  tags,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function" && typeof navigator.canShare === "function");
  }, []);

  const showCard = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.position = "fixed";
    cardRef.current.style.left = "-9999px";
    cardRef.current.style.top = "0";
    cardRef.current.style.display = "block";
  }, []);

  const hideCard = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.display = "none";
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      showCard();
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
      });
      const link = document.createElement("a");
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      hideCard();
      setExporting(false);
    }
  }, [title, showCard, hideCard]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      showCard();
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
      });
      if (!blob) return;
      const file = new File([blob], `${title}.png`, { type: "image/png" });
      await navigator.share({ title, files: [file] });
    } catch (e) {
      // User cancelled the share sheet — ignore
      if (e instanceof Error && e.name !== "AbortError") throw e;
    } finally {
      hideCard();
      setSharing(false);
    }
  }, [title, showCard, hideCard]);

  const hasIngredients =
    ingredientGroups !== null &&
    ingredientGroups.some((g) => g.items.length > 0);

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

      {/* Hidden recipe card for image capture */}
      <div
        ref={cardRef}
        dir="rtl"
        style={{
          display: "none",
          width: "400px",
          fontFamily: "'Heebo', sans-serif",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
          padding: "24px",
          lineHeight: 1.6,
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            crossOrigin="anonymous"
            style={{
              width: "100%",
              aspectRatio: "16/9",
              objectFit: "cover",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          />
        )}

        <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          {title}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "12px",
          }}
        >
          {uploadedBy} &bull; {format(createdAt, "dd/MM/yyyy")}
        </div>

        {tags && tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "12px",
                  padding: "2px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#f3f4f6",
                  color: "#4b5563",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {hasIngredients && ingredientGroups && (
          <>
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                margin: "12px 0",
              }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              מרכיבים
            </div>
            {ingredientGroups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: "8px" }}>
                {group.name && (
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    {group.name}
                  </div>
                )}
                {group.items.map((ing, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "14px",
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        backgroundColor: "#6366f1",
                        flexShrink: 0,
                      }}
                    />
                    {ing.amount && (
                      <span style={{ fontWeight: 600 }}>{ing.amount}</span>
                    )}
                    {ing.unit && <span>{ing.unit}</span>}
                    <span>{ing.item}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {instructionSections && instructionSections.length > 0 && (
          <>
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                margin: "12px 0",
              }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              הוראות הכנה
            </div>
            {instructionSections.map((section, si) => (
              <div key={si} style={{ marginBottom: "8px" }}>
                {section.name && (
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    {section.name}
                  </div>
                )}
                {section.steps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "14px",
                      display: "flex",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: "#6366f1",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ paddingTop: "1px" }}>{step}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: "16px",
            paddingTop: "12px",
            textAlign: "center",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          מתכונים משפחתיים
        </div>
      </div>
    </>
  );
}
