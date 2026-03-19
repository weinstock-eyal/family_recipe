"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      setUploading(true);

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "שגיאה בהעלאת הקובץ");
          setPreview(null);
          return;
        }

        onChange(data.url);
        setPreview(null);
      } catch (err) {
        const message =
          err instanceof TypeError
            ? "בעיית חיבור לשרת – בדוק את חיבור האינטרנט ונסה שוב"
            : "שגיאה בהעלאת הקובץ";
        setError(message);
        setPreview(null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(localUrl);
      }
    },
    [onChange]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleRemove() {
    onChange("");
    setPreview(null);
    setError("");
  }

  const displayUrl = preview ?? value;

  // If there's an image (uploaded or previewing), show it
  if (displayUrl) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl bg-muted">
          <Image
            src={displayUrl}
            alt="תצוגה מקדימה"
            fill
            className="object-cover"
            sizes="384px"
            unoptimized={displayUrl.startsWith("blob:")}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute start-2 top-2 size-10 rounded-full shadow-lg"
              onClick={handleRemove}
            >
              <X className="size-5" strokeWidth={3} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="size-8 text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-sm font-medium">גרור תמונה לכאן או לחץ לבחירה</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP עד 5MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="min-h-[44px] px-2 text-xs text-muted-foreground underline"
        >
          {showUrlInput ? "הסתר" : "או הזן קישור לתמונה"}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            className="text-left"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
