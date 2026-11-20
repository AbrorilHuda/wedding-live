export type Locale = "id" | "en";

export type PhotoIdeaKey = "candid" | "decor" | "group" | "highlight";

export interface GuestPhoto {
  id: string;
  src: string;
  fullSrc?: string;
  width: number;
  height: number;
  guestName: string;
  tableNumber?: string;
  uploadedAt: string; // e.g. "19:24"
  ideaTag?: PhotoIdeaKey;
  alt: string;
  blurColor?: string;
  isNew?: boolean;
}

export interface GuestProfile {
  name: string;
  tableNumber?: string;
  uploadedCount: number;
}

export type UploadStatus =
  | "queued"
  | "compressing"
  | "uploading"
  | "done"
  | "offline"
  | "error";

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
  compressedDataUrl?: string;
  width?: number;
  height?: number;
  ideaTag?: PhotoIdeaKey;
}
