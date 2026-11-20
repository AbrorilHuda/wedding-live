"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "../lib/i18n";
import type {
  GuestProfile,
  PhotoIdeaKey,
  UploadItem,
} from "../lib/types";
import { CameraModal } from "./CameraModal";
import {
  CameraIcon,
  CheckIcon,
  CloseIcon,
  GalleryIcon,
  RefreshIcon,
  SunIcon,
  WifiOffIcon,
} from "./Icons";

export const MAX_PHOTOS_PER_GUEST = 20;
const MAX_NAME_LENGTH = 40;

interface UploadSheetProps {
  t: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  guestProfile: GuestProfile | null;
  onSaveProfile: (name: string, tableNumber?: string) => void;
  selectedIdea?: PhotoIdeaKey;
  uploadQueue: UploadItem[];
  isOnline: boolean;
  onFilesSelected: (files: FileList | File[], ideaTag?: PhotoIdeaKey) => void;
  onRetryItem: (itemId: string) => void;
  onClearCompleted: () => void;
  validationWarning: string | null;
  onDismissWarning: () => void;
}

export function UploadSheet(props: UploadSheetProps) {
  if (!props.isOpen) return null;
  return <UploadSheetInner {...props} />;
}

function UploadSheetInner({
  t,
  onClose,
  guestProfile,
  onSaveProfile,
  selectedIdea,
  uploadQueue,
  isOnline,
  onFilesSelected,
  onRetryItem,
  onClearCompleted,
  validationWarning,
  onDismissWarning,
}: UploadSheetProps) {
  const [isEditingName, setIsEditingName] = useState(!guestProfile?.name);
  const [nameInput, setNameInput] = useState(guestProfile?.name ?? "");
  const [tableInput, setTableInput] = useState(guestProfile?.tableNumber ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const cameraInputId = useId();
  const galleryInputId = useId();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Detect mobile touch device so native HP camera (`capture="environment"`) opens directly;
  // on desktop/laptops where `capture` opens a file dialog, open live getUserMedia CameraModal instead.
  const isMobileTouch =
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

  // Lock background scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const usedCount = guestProfile?.uploadedCount ?? 0;
  const remainingQuota = Math.max(0, MAX_PHOTOS_PER_GUEST - usedCount);

  const hasQueue = uploadQueue.length > 0;
  const allDone =
    hasQueue && uploadQueue.every((item) => item.status === "done");
  const hasOfflineOrError = uploadQueue.some(
    (item) => item.status === "offline" || item.status === "error"
  );

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError(t.nameRequired);
      return;
    }
    setNameError(null);
    onSaveProfile(trimmed.slice(0, MAX_NAME_LENGTH), tableInput.trim() || undefined);
    setIsEditingName(false);
  };

  const handleGalleryClick = () => {
    onDismissWarning();
    galleryInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files, selectedIdea);
    }
    e.target.value = "";
  };

  const handleDoneViewGallery = () => {
    onClearCompleted();
    onClose();
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUploadMore = () => {
    onClearCompleted();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.addPhoto}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1D1A17]/55 backdrop-blur-[2px] sm:items-center sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-ivory px-5 pb-safe pt-3 shadow-2xl sm:rounded-[26px] sm:p-6 animate-sheet-up">
        {/* Mobile grab handle */}
        <div
          className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-ink/15 sm:hidden"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.closeLightbox}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-cream hover:text-ink"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* Accessible sr-only file inputs (reliable on iOS Safari & Android Chrome) */}
        <input
          id={cameraInputId}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="sr-only"
        />
        <input
          id={galleryInputId}
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="sr-only"
        />

        {/* STEP 1: Name Input (No login, remembered in localStorage) */}
        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="pt-2">
            <h2 className="pr-10 font-serif text-3xl font-medium text-ink">
              {t.sheetTitleName}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {t.sheetSubtitleName}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="guest-name-input"
                    className="text-sm font-semibold text-ink"
                  >
                    {t.nameLabel} <span className="text-sage">*</span>
                  </label>
                  <span className="text-xs text-ink-muted">
                    {nameInput.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <input
                  id="guest-name-input"
                  type="text"
                  autoComplete="name"
                  maxLength={MAX_NAME_LENGTH}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder={t.namePlaceholder}
                  autoFocus
                  className="mt-1.5 min-h-[50px] w-full rounded-xl border border-ink/15 bg-white px-4 text-base text-ink placeholder:text-ink-muted/55 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
                {nameError && (
                  <p className="mt-1.5 text-xs font-medium text-red-700">
                    {nameError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="guest-table-input"
                    className="text-sm font-semibold text-ink"
                  >
                    {t.tableLabel}
                  </label>
                  <span className="inline-flex items-center rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-ink-muted border border-border-soft">
                    {t.tableOptional}
                  </span>
                </div>
                <input
                  id="guest-table-input"
                  type="text"
                  maxLength={20}
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  placeholder={t.tablePlaceholder}
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-ink/12 bg-white px-4 text-base text-ink placeholder:text-ink-muted/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
                <p className="mt-1.5 text-xs text-ink-muted">
                  {t.tableOptionalHint}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex min-h-[54px] w-full items-center justify-center rounded-full bg-sage px-6 text-base font-semibold text-ivory shadow-sm transition-all hover:bg-sage-dark active:scale-[0.99]"
            >
              {t.continueBtn}
            </button>
          </form>
        ) : allDone ? (
          /* STEP 3B: Warm Thank-You Confirmation */
          <div className="py-4 text-center animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-soft text-sage-dark">
              <CheckIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-serif text-3xl font-medium text-ink">
              {t.thankYouTitle(guestProfile?.name || "")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {t.thankYouDesc(uploadQueue.length)}
            </p>

            {/* Thumbnails preview of uploaded photos */}
            <div className="mt-5 flex justify-center gap-2 overflow-x-auto py-1">
              {uploadQueue.slice(0, 5).map((item) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={item.id}
                  src={item.compressedDataUrl || item.previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-xs"
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleDoneViewGallery}
                className="flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-sage px-5 text-sm font-semibold text-ivory shadow-sm hover:bg-sage-dark"
              >
                {t.viewGalleryBtn}
              </button>
              {remainingQuota > 0 && (
                <button
                  type="button"
                  onClick={handleUploadMore}
                  className="flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-cream px-5 text-sm font-semibold text-ink hover:bg-cream-deep"
                >
                  {t.uploadMoreBtn}
                </button>
              )}
            </div>
          </div>
        ) : hasQueue ? (
          /* STEP 3A: Client-Side Compression & Upload Progress Queue */
          <div className="pt-2">
            <h2 className="pr-10 font-serif text-2xl font-medium text-ink">
              {t.uploadingTitle}
            </h2>

            {(!isOnline || hasOfflineOrError) && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-950 border border-amber-200/80">
                <WifiOffIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p>{t.offlineBanner}</p>
              </div>
            )}

            <ul className="mt-4 max-h-[45vh] space-y-2.5 overflow-y-auto pr-0.5">
              {uploadQueue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-2.5 border border-border-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover bg-cream"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-ink">
                        {item.file.name}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-ink-muted">
                        {item.status === "queued" && t.statusQueued}
                        {item.status === "compressing" && t.statusCompressing}
                        {item.status === "uploading" && `${item.progress}%`}
                        {item.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-sage-dark">
                            <CheckIcon className="h-3.5 w-3.5" />
                            {t.statusDone}
                          </span>
                        )}
                        {item.status === "offline" && (
                          <span className="text-amber-700">{t.statusOffline}</span>
                        )}
                        {item.status === "error" && (
                          <span className="text-red-700">{t.statusError}</span>
                        )}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === "error"
                            ? "bg-red-500"
                            : item.status === "offline"
                            ? "bg-amber-500"
                            : "bg-sage"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {(item.status === "offline" || item.status === "error") && (
                      <button
                        type="button"
                        onClick={() => onRetryItem(item.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sage-dark hover:underline"
                      >
                        <RefreshIcon className="h-3.5 w-3.5" />
                        <span>{t.retryBtn}</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* STEP 2: Camera or Gallery Picker */
          <div className="pt-2">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pr-10">
              <h2 className="font-serif text-3xl font-medium text-ink">
                {t.greetingBack(guestProfile?.name || "")}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-xs font-semibold text-sage-dark underline underline-offset-4 hover:text-sage"
              >
                {t.changeName}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>{t.quotaLabel(usedCount, MAX_PHOTOS_PER_GUEST)}</span>
              {selectedIdea && (
                <span className="rounded-full bg-sage-soft px-2.5 py-0.5 font-medium text-sage-dark">
                  # {t.ideas[selectedIdea].label}
                </span>
              )}
            </div>

            {/* Quota Reached State */}
            {remainingQuota === 0 ? (
              <div className="mt-5 rounded-2xl bg-sage-soft/75 p-5 text-center">
                <p className="font-serif text-2xl font-medium text-ink">
                  {t.quotaReachedTitle}
                </p>
                <p className="mt-1.5 text-sm text-ink-muted">
                  {t.quotaReachedDesc(MAX_PHOTOS_PER_GUEST)}
                </p>
              </div>
            ) : (
              <>
                {/* Validation warning */}
                {validationWarning && (
                  <div className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-950 border border-amber-200/80">
                    {validationWarning}
                  </div>
                )}

                {/* Quick 3-tip reminder strip */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-sage-soft/65 px-3.5 py-2.5 text-xs font-medium text-sage-dark">
                  <SunIcon className="h-4 w-4 shrink-0" />
                  <span>{t.cameraTipStrip}</span>
                </div>

                {/* Large Thumb-Friendly Action Cards */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {isMobileTouch ? (
                    <label
                      htmlFor={cameraInputId}
                      onClick={onDismissWarning}
                      className="flex min-h-[82px] cursor-pointer items-center gap-4 rounded-2xl bg-sage p-4 text-left text-ivory shadow-sm transition-all hover:bg-sage-dark active:scale-[0.99] sm:flex-col sm:items-start sm:justify-between sm:p-5"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <CameraIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-base font-semibold leading-tight">
                          {t.openCamera}
                        </p>
                        <p className="mt-0.5 text-xs text-ivory/85">
                          {t.openCameraDesc}
                        </p>
                      </div>
                    </label>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onDismissWarning();
                        setIsLiveCameraOpen(true);
                      }}
                      className="flex min-h-[82px] items-center gap-4 rounded-2xl bg-sage p-4 text-left text-ivory shadow-sm transition-all hover:bg-sage-dark active:scale-[0.99] sm:flex-col sm:items-start sm:justify-between sm:p-5"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <CameraIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-base font-semibold leading-tight">
                          {t.openCamera}
                        </p>
                        <p className="mt-0.5 text-xs text-ivory/85">
                          {t.openCameraDesc}
                        </p>
                      </div>
                    </button>
                  )}

                  <label
                    htmlFor={galleryInputId}
                    onClick={onDismissWarning}
                    className="flex min-h-[82px] cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-left text-ink border border-ink/12 shadow-2xs transition-all hover:border-sage/40 hover:bg-cream/40 active:scale-[0.99] sm:flex-col sm:items-start sm:justify-between sm:p-5"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-sage-dark">
                      <GalleryIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-base font-semibold leading-tight">
                        {t.pickGallery}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {t.pickGalleryDesc}
                      </p>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Camera Modal (desktop/webcam or fallback) */}
      {isLiveCameraOpen && (
        <CameraModal
          t={t}
          onCapture={(file) => onFilesSelected([file], selectedIdea)}
          onFallbackGallery={handleGalleryClick}
          onClose={() => setIsLiveCameraOpen(false)}
        />
      )}
    </div>
  );
}
