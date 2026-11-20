import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseServerAdmin,
  mapRowToGuestPhoto,
  type PhotoRow,
} from "@/app/lib/supabase";
import type { PhotoIdeaKey } from "@/app/lib/types";

const ALLOWED_IDEAS = new Set<PhotoIdeaKey>([
  "candid",
  "decor",
  "group",
  "highlight",
]);

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerAdmin();
  if (!supabase) {
    return NextResponse.json({ configured: false, photos: [], hasMore: false });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(40, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const { data, error, count } = await supabase
    .from("photos")
    .select("*", { count: "exact" })
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[GET /api/photos] Supabase error:", error);
    return NextResponse.json(
      {
        configured: true,
        error: "Failed to load photos",
        ...(process.env.NODE_ENV !== "production"
          ? { details: error.message, code: error.code, hint: error.hint }
          : {}),
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as PhotoRow[];
  const photos = rows.map((row) => mapRowToGuestPhoto(row));
  const total = count ?? rows.length;

  return NextResponse.json({
    configured: true,
    photos,
    total,
    hasMore: offset + rows.length < total,
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerAdmin();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!supabase || !cloudName) {
    return NextResponse.json(
      { configured: false, error: "Backend storage is not configured" },
      { status: 503 }
    );
  }

  let body: {
    guestName?: unknown;
    tableNumber?: unknown;
    ideaTag?: unknown;
    cloudinaryPublicId?: unknown;
    imageUrl?: unknown;
    width?: unknown;
    height?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const guestName =
    typeof body.guestName === "string" ? body.guestName.trim().slice(0, 40) : "";
  const tableNumber =
    typeof body.tableNumber === "string" && body.tableNumber.trim()
      ? body.tableNumber.trim().slice(0, 20)
      : null;
  const ideaTag =
    typeof body.ideaTag === "string" &&
    ALLOWED_IDEAS.has(body.ideaTag as PhotoIdeaKey)
      ? (body.ideaTag as PhotoIdeaKey)
      : null;
  const cloudinaryPublicId =
    typeof body.cloudinaryPublicId === "string"
      ? body.cloudinaryPublicId.trim()
      : "";
  const imageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const width = Number(body.width);
  const height = Number(body.height);

  if (!guestName) {
    return NextResponse.json(
      { error: "Guest name is required" },
      { status: 400 }
    );
  }

  // Ensure image URL truly belongs to this app's Cloudinary account
  const expectedPrefix = `https://res.cloudinary.com/${cloudName}/`;
  if (!cloudinaryPublicId || !imageUrl.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Invalid Cloudinary image URL" },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid image dimensions" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("photos")
    .insert({
      guest_name: guestName,
      table_number: tableNumber,
      idea_tag: ideaTag,
      cloudinary_public_id: cloudinaryPublicId,
      image_url: imageUrl,
      width: Math.round(width),
      height: Math.round(height),
      is_visible: true,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[POST /api/photos] Supabase error:", error);
    return NextResponse.json(
      {
        error: "Failed to save photo metadata",
        ...(process.env.NODE_ENV !== "production" && error
          ? { details: error.message, code: error.code, hint: error.hint }
          : {}),
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { photo: mapRowToGuestPhoto(data as PhotoRow, true) },
    { status: 201 }
  );
}
