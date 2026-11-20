"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DICTIONARY } from "../lib/i18n";
import {
  compressImageClientSide,
  formatCurrentTime,
  validateImageFile,
} from "../lib/image-utils";
import { INITIAL_PHOTOS, MORE_PHOTOS_BATCH } from "../lib/sample-photos";
import {
  getSupabaseBrowserClient,
  mapRowToGuestPhoto,
  type PhotoRow,
} from "../lib/supabase";
import type {
  GuestPhoto,
  GuestProfile,
  Locale,
  PhotoIdeaKey,
  UploadItem,
} from "../lib/types";
import { FooterSection } from "./FooterSection";
import { HeroSection } from "./HeroSection";
import { Lightbox } from "./Lightbox";
import { MasonryGallery } from "./MasonryGallery";
import { PhotoGuideSection } from "./PhotoGuideSection";
import { StickyUploadBar } from "./StickyUploadBar";
import { MAX_PHOTOS_PER_GUEST, UploadSheet } from "./UploadSheet";

const PROFILE_STORAGE_KEY = "wedding_live_guest_profile_v1";
const PROFILE_EVENT = "wedding-live-profile-change";
const PAGE_SIZE = 20;

interface CloudinarySignResponse {
  configured: boolean;
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

function uploadBlobToCloudinary(
  blob: Blob,
  sign: CloudinarySignResponse,
  onProgress: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", blob, `wedding-${Date.now()}.jpg`);
    formData.append("api_key", sign.apiKey);
    formData.append("timestamp", String(sign.timestamp));
    formData.append("signature", sign.signature);
    formData.append("folder", sign.folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot() {
  return true;
}

function subscribeProfile(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PROFILE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PROFILE_EVENT, callback);
  };
}

function getProfileRawSnapshot(): string | null {
  try {
    return window.localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getProfileServerSnapshot(): string | null {
  return null;
}

export function WeddingLandingClient() {
  const [locale, setLocale] = useState<Locale>("id");
  const [photos, setPhotos] = useState<GuestPhoto[]>(INITIAL_PHOTOS);
  const [pendingNewPhotos, setPendingNewPhotos] = useState<GuestPhoto[]>([]);
  const [isBackendConfigured, setIsBackendConfigured] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const profileRaw = useSyncExternalStore(
    subscribeProfile,
    getProfileRawSnapshot,
    getProfileServerSnapshot
  );
  const guestProfile: GuestProfile | null = (() => {
    if (!profileRaw) return null;
    try {
      const parsed = JSON.parse(profileRaw) as GuestProfile;
      return parsed && typeof parsed.name === "string" ? parsed : null;
    } catch {
      return null;
    }
  })();

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<PhotoIdeaKey | undefined>(
    undefined
  );
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const t = DICTIONARY[locale];
  const profileRef = useRef<GuestProfile | null>(null);
  const isSheetOpenRef = useRef(isSheetOpen);

  useEffect(() => {
    profileRef.current = guestProfile;
  }, [guestProfile]);

  useEffect(() => {
    isSheetOpenRef.current = isSheetOpen;
  }, [isSheetOpen]);

  // Update <html lang> when switching ID / EN
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Load real photos from Supabase via /api/photos when configured;
  // gracefully stays on curated sample photos in demo mode if env vars aren't set yet.
  useEffect(() => {
    let active = true;

    async function fetchInitialPhotos() {
      try {
        const res = await fetch(`/api/photos?limit=${PAGE_SIZE}&offset=0`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          configured: boolean;
          photos: GuestPhoto[];
          hasMore: boolean;
        };
        if (!active || !data.configured) return;

        setIsBackendConfigured(true);
        setPhotos(data.photos);
        setHasMore(data.hasMore);
      } catch {
        // Offline or demo mode — keep sample gallery
      }
    }

    void fetchInitialPhotos();
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to Supabase Realtime for live guest uploads & admin moderation
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("wedding-live-photos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos" },
        (payload) => {
          const row = payload.new as PhotoRow;
          if (!row?.id || !row.is_visible) return;
          const incoming = mapRowToGuestPhoto(row, true);

          // Deduplicate against photos already added by this device
          setPhotos((prev) => {
            if (prev.some((p) => p.id === incoming.id)) return prev;
            if (window.scrollY > 520 && !isSheetOpenRef.current) {
              setPendingNewPhotos((pending) =>
                pending.some((p) => p.id === incoming.id)
                  ? pending
                  : [incoming, ...pending]
              );
              return prev;
            }
            return [incoming, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "photos" },
        (payload) => {
          const row = payload.new as PhotoRow;
          if (!row?.id) return;
          if (!row.is_visible) {
            setPhotos((prev) => prev.filter((p) => p.id !== row.id));
            setPendingNewPhotos((prev) => prev.filter((p) => p.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const persistProfile = useCallback((next: GuestProfile) => {
    profileRef.current = next;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(PROFILE_EVENT));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleSaveProfile = useCallback(
    (name: string, tableNumber?: string) => {
      const next: GuestProfile = {
        name,
        tableNumber,
        uploadedCount: profileRef.current?.uploadedCount ?? 0,
      };
      persistProfile(next);
    },
    [persistProfile]
  );

  // Process a single upload item:
  // 1) Client-side EXIF-safe compression (<= 1800px, JPEG 83%)
  // 2) Signed direct upload to Cloudinary + metadata save to Supabase (/api/photos)
  // 3) Graceful demo fallback if Cloudinary/Supabase env vars aren't configured yet
  const processUploadItem = useCallback(
    async (item: UploadItem) => {
      const updateItem = (patch: Partial<UploadItem>) => {
        setUploadQueue((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, ...patch } : entry
          )
        );
      };

      try {
        updateItem({ status: "compressing", progress: 15 });
        const compressed = await compressImageClientSide(item.file);

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          updateItem({
            status: "offline",
            progress: 25,
            compressedDataUrl: compressed.dataUrl,
            width: compressed.width,
            height: compressed.height,
          });
          return;
        }

        updateItem({
          status: "uploading",
          progress: 30,
          compressedDataUrl: compressed.dataUrl,
          width: compressed.width,
          height: compressed.height,
        });

        const profile = profileRef.current;
        const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });

        let savedPhoto: GuestPhoto;

        if (signRes.ok) {
          // Real Cloudinary + Supabase flow (zero login needed for guests)
          const signData = (await signRes.json()) as CloudinarySignResponse;
          const cloudResult = await uploadBlobToCloudinary(
            compressed.blob,
            signData,
            (pct) => {
              // Map 0-100% network progress into 30-90% overall bar
              updateItem({ progress: 30 + Math.round(pct * 0.6) });
            }
          );

          updateItem({ progress: 94 });

          const metaRes = await fetch("/api/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestName: profile?.name || "Tamu",
              tableNumber: profile?.tableNumber,
              ideaTag: item.ideaTag,
              cloudinaryPublicId: cloudResult.public_id,
              imageUrl: cloudResult.secure_url,
              width: cloudResult.width || compressed.width,
              height: cloudResult.height || compressed.height,
            }),
          });

          if (!metaRes.ok) {
            throw new Error("Failed to save photo metadata");
          }

          const metaJson = (await metaRes.json()) as { photo: GuestPhoto };
          savedPhoto = metaJson.photo;
        } else if (signRes.status === 503) {
          // Demo / local preview mode (when .env.local is not yet configured)
          await new Promise((r) => setTimeout(r, 240));
          updateItem({ progress: 75 });
          await new Promise((r) => setTimeout(r, 220));

          savedPhoto = {
            id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            src: compressed.dataUrl,
            fullSrc: compressed.dataUrl,
            width: compressed.width,
            height: compressed.height,
            guestName: profile?.name || "Tamu",
            tableNumber: profile?.tableNumber,
            uploadedAt: formatCurrentTime(),
            ideaTag: item.ideaTag,
            alt: `Foto momen pernikahan dari ${profile?.name || "Tamu"}`,
            blurColor: "#EAE3D5",
            isNew: true,
          };
        } else {
          throw new Error("Failed to sign upload");
        }

        setPhotos((prev) =>
          prev.some((p) => p.id === savedPhoto.id)
            ? prev
            : [savedPhoto, ...prev]
        );

        if (profile) {
          persistProfile({
            ...profile,
            uploadedCount: Math.min(
              MAX_PHOTOS_PER_GUEST,
              profile.uploadedCount + 1
            ),
          });
        }

        updateItem({ status: "done", progress: 100 });
      } catch {
        const offlineNow =
          typeof navigator !== "undefined" && !navigator.onLine;
        updateItem({
          status: offlineNow ? "offline" : "error",
          progress: offlineNow ? 25 : 100,
        });
      }
    },
    [persistProfile]
  );

  // Auto-retry offline queued items when connection returns
  useEffect(() => {
    if (!isOnline) return;
    const offlineItems = uploadQueue.filter(
      (item) => item.status === "offline"
    );
    offlineItems.forEach((item) => {
      void processUploadItem(item);
    });
  }, [isOnline, uploadQueue, processUploadItem]);

  const handleFilesSelected = useCallback(
    (files: FileList | File[], ideaTag?: PhotoIdeaKey) => {
      const fileArray = Array.from(files);
      const used = profileRef.current?.uploadedCount ?? 0;
      const remaining = Math.max(0, MAX_PHOTOS_PER_GUEST - used);

      const validFiles: File[] = [];
      let warning: string | null = null;

      for (const file of fileArray) {
        const result = validateImageFile(file);
        if (result === "invalid_type") {
          warning = t.invalidFileError;
          continue;
        }
        if (result === "too_large") {
          warning = t.fileTooLargeError;
          continue;
        }
        if (validFiles.length < remaining) {
          validFiles.push(file);
        }
      }

      if (warning) setValidationWarning(warning);
      if (validFiles.length === 0) return;

      const newItems: UploadItem[] = validFiles.map((file, idx) => ({
        id: `up-${Date.now()}-${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        progress: 8,
        ideaTag,
      }));

      setUploadQueue((prev) => [...prev, ...newItems]);

      // Process sequentially to keep mobile memory & weak network smooth
      (async () => {
        for (const item of newItems) {
          await processUploadItem(item);
        }
      })();
    },
    [processUploadItem, t.fileTooLargeError, t.invalidFileError]
  );

  const handleRetryItem = useCallback(
    (itemId: string) => {
      const target = uploadQueue.find((i) => i.id === itemId);
      if (target) {
        void processUploadItem(target);
      }
    },
    [uploadQueue, processUploadItem]
  );

  const handleClearCompleted = useCallback(() => {
    setUploadQueue((prev) => {
      prev.forEach((item) => {
        if (item.status === "done") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return prev.filter((item) => item.status !== "done");
    });
  }, []);

  const handleOpenUpload = useCallback((idea?: PhotoIdeaKey) => {
    setSelectedIdea(idea);
    setValidationWarning(null);
    setIsSheetOpen(true);
  }, []);

  const handleRevealNewPhotos = useCallback(() => {
    setPhotos((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const uniqueNew = pendingNewPhotos.filter((p) => !existingIds.has(p.id));
      return [...uniqueNew, ...prev];
    });
    setPendingNewPhotos([]);
  }, [pendingNewPhotos]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    if (isBackendConfigured) {
      try {
        const res = await fetch(
          `/api/photos?limit=${PAGE_SIZE}&offset=${photos.length}`
        );
        if (res.ok) {
          const data = (await res.json()) as {
            photos: GuestPhoto[];
            hasMore: boolean;
          };
          setPhotos((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const nextUnique = data.photos.filter(
              (p) => !existingIds.has(p.id)
            );
            return [...prev, ...nextUnique];
          });
          setHasMore(data.hasMore);
        }
      } finally {
        setIsLoadingMore(false);
      }
      return;
    }

    // Demo fallback batch
    setTimeout(() => {
      setPhotos((prev) => [...prev, ...MORE_PHOTOS_BATCH]);
      setHasMore(false);
      setIsLoadingMore(false);
    }, 450);
  }, [hasMore, isLoadingMore, isBackendConfigured, photos.length]);

  const activeUploadCount = uploadQueue.filter(
    (i) =>
      i.status === "queued" ||
      i.status === "compressing" ||
      i.status === "uploading"
  ).length;
  const offlineQueueCount = uploadQueue.filter(
    (i) => i.status === "offline"
  ).length;

  return (
    <div className="flex min-h-dvh flex-col bg-ivory text-ink">
      <HeroSection
        t={t}
        locale={locale}
        onLocaleChange={setLocale}
        totalPhotos={photos.length + pendingNewPhotos.length}
        onAddPhotoClick={() => handleOpenUpload()}
      />

      <main className="flex-1">
        <PhotoGuideSection
          t={t}
          onSelectIdeaToUpload={(idea) => handleOpenUpload(idea)}
        />

        <MasonryGallery
          t={t}
          photos={photos}
          pendingNewCount={pendingNewPhotos.length}
          onRevealNewPhotos={handleRevealNewPhotos}
          onPhotoClick={(idx) => setLightboxIndex(idx)}
          onEmptyUploadClick={() => handleOpenUpload()}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      </main>

      <FooterSection t={t} />

      <StickyUploadBar
        t={t}
        onClick={() => handleOpenUpload()}
        activeUploadCount={activeUploadCount}
        offlineQueueCount={offlineQueueCount}
        hidden={isSheetOpen || lightboxIndex !== null}
      />

      <UploadSheet
        t={t}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        guestProfile={guestProfile}
        onSaveProfile={handleSaveProfile}
        selectedIdea={selectedIdea}
        uploadQueue={uploadQueue}
        isOnline={isOnline}
        onFilesSelected={handleFilesSelected}
        onRetryItem={handleRetryItem}
        onClearCompleted={handleClearCompleted}
        validationWarning={validationWarning}
        onDismissWarning={() => setValidationWarning(null)}
      />

      <Lightbox
        t={t}
        photos={photos}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
      />
    </div>
  );
}
