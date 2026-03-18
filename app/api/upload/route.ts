import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/src/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "recipe-images";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  // Auth check
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "סוג קובץ לא נתמך. יש להעלות JPEG, PNG או WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "הקובץ גדול מדי. הגודל המקסימלי הוא 5MB" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: `שגיאה בהעלאת הקובץ לשרת: ${error.message}` },
        { status: 500 }
      );
    }

    // Bucket is private - create a signed URL with long expiry (1 year)
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json({ error: "שגיאה ביצירת קישור לתמונה" }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });
  } catch (error) {
    console.error("Upload failed:", error);
    const detail = error instanceof Error ? error.message : "";
    const msg = detail
      ? `שגיאה בהעלאת הקובץ: ${detail}`
      : "שגיאה בהעלאת הקובץ – נסה שוב מאוחר יותר";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
