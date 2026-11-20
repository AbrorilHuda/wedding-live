"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "../lib/i18n";
import type { GuestPhoto } from "../lib/types";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";

interface LightboxProps {
  t: Dictionary;
  photos: GuestPhoto[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function Lightbox({
  t,
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isOpen = currentIndex !== null && photos[currentIndex] !== undefined;
  const photo = isOpen ? photos[currentIndex] : null;
  const hasPrev = isOpen && currentIndex > 0;
  const hasNext = isOpen && currentIndex < photos.length - 1;

  // Lock body scroll & keyboard navigation
  useEffect(() => {
    if (!isOpen || currentIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || !photo || currentIndex === null) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && hasPrev) onNavigate(currentIndex - 1);
      else if (dx < 0 && hasNext) onNavigate(currentIndex + 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.guestName} — ${photo.uploadedAt}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#161412]/95 text-ivory backdrop-blur-md animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
        <span className="text-xs font-medium tracking-wider text-ivory/75">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.closeLightbox}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-white/20"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex flex-1 items-center justify-center px-3 py-2 sm:px-14"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Previous Button */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => onNavigate(currentIndex - 1)}
            aria-label={t.prevPhoto}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-ivory backdrop-blur-xs transition-colors hover:bg-black/65 sm:left-4"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.fullSrc || photo.src}
          alt={photo.alt}
          className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-2xl animate-fade-in"
        />

        {/* Next Button */}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(currentIndex + 1)}
            aria-label={t.nextPhoto}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-ivory backdrop-blur-xs transition-colors hover:bg-black/65 sm:right-4"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 pb-safe pt-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ivory/60">
            {t.uploadedBy}
          </p>
          <p className="truncate text-base font-semibold text-ivory">
            {photo.guestName}
            {photo.tableNumber ? (
              <span className="ml-2 text-sm font-normal text-ivory/75">
                · {t.tablePrefix} {photo.tableNumber}
              </span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {photo.ideaTag && (
            <span className="inline-block rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] font-medium text-ivory/90">
              {t.ideas[photo.ideaTag].label}
            </span>
          )}
          <p className="mt-1 text-xs text-ivory/70">{photo.uploadedAt}</p>
        </div>
      </div>
    </div>
  );
}
