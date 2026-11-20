import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildCloudinaryUrl } from "./cloudinary";
import type { GuestPhoto, PhotoIdeaKey } from "./types";

export interface PhotoRow {
  id: string;
  guest_name: string;
  table_number: string | null;
  idea_tag: PhotoIdeaKey | null;
  cloudinary_public_id: string;
  image_url: string;
  width: number;
  height: number;
  is_visible: boolean;
  created_at: string;
}

let browserClient: SupabaseClient | null = null;

export function isSupabasePublicConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabasePublicConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export function getSupabaseServerAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function formatPhotoTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function mapRowToGuestPhoto(row: PhotoRow, isNew = false): GuestPhoto {
  return {
    id: row.id,
    src: buildCloudinaryUrl(row.image_url, 600),
    fullSrc: buildCloudinaryUrl(row.image_url, 1600),
    width: row.width,
    height: row.height,
    guestName: row.guest_name,
    tableNumber: row.table_number ?? undefined,
    uploadedAt: formatPhotoTime(row.created_at),
    ideaTag: row.idea_tag ?? undefined,
    alt: `Foto momen pernikahan dari ${row.guest_name}`,
    blurColor: "#EAE3D5",
    isNew,
  };
}
