"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "../lib/i18n";
import type { GuestPhoto } from "../lib/types";
import { ArrowUpIcon, CameraIcon } from "./Icons";

interface MasonryGalleryProps {
  t: Dictionary;
  photos: GuestPhoto[];
  pendingNewCount: number;
  onRevealNewPhotos: () => void;
  onPhotoClick: (index: number) => void;
  onEmptyUploadClick: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

function useColumnCount(): number {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return cols;
}

export function MasonryGallery({
  t,
  photos,
  pendingNewCount,
  onRevealNewPhotos,
  onPhotoClick,
  onEmptyUploadClick,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: MasonryGalleryProps) {
  const columnCount = useColumnCount();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const galleryTopRef = useRef<HTMLElement | null>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "260px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Balanced Pinterest-style masonry: distributes each photo into the shortest column
  // based on stored width/height ratio so newest photos stay on top with zero CLS.
  const columns = useMemo(() => {
    const cols: { photo: GuestPhoto; originalIndex: number }[][] = Array.from(
      { length: columnCount },
      () => []
    );
    const heights = new Array<number>(columnCount).fill(0);

    photos.forEach((photo, originalIndex) => {
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) {
          shortest = i;
        }
      }
      cols[shortest].push({ photo, originalIndex });
      const aspectRatioHeight =
        photo.width > 0 ? photo.height / photo.width : 1.25;
      heights[shortest] += aspectRatioHeight + 0.14;
    });

    return cols;
  }, [photos, columnCount]);

  const handleRevealClick = () => {
    onRevealNewPhotos();
    galleryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={galleryTopRef}
      id="gallery"
      aria-labelledby="gallery-heading"
      className="mx-auto mt-8 max-w-5xl px-4 sm:px-6 scroll-mt-4"
    >
      {/* Section Header */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            id="gallery-heading"
            className="font-serif text-[28px] font-medium tracking-tight text-ink sm:text-3xl leading-tight"
          >
            {t.galleryTitle}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
            {t.gallerySubtitle}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink-muted">
          {t.photosShared(photos.length)}
        </span>
      </div>

      {/* Floating "X foto baru" pill — prevents layout jump while scrolling */}
      {pendingNewCount > 0 && (
        <div className="sticky top-3 z-20 mb-3 flex justify-center">
          <button
            type="button"
            onClick={handleRevealClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ivory shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up"
          >
            <ArrowUpIcon className="h-4 w-4 text-sage-soft" />
            <span>{t.newPhotosPill(pendingNewCount)}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/85 px-6 py-16 text-center border border-border-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-sage">
            <CameraIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-medium text-ink">
            {t.emptyStateTitle}
          </h3>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted">
            {t.emptyStateDesc}
          </p>
          <button
            type="button"
            onClick={onEmptyUploadClick}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-semibold text-ivory shadow-sm hover:bg-sage-dark"
          >
            <CameraIcon className="h-4 w-4" />
            <span>{t.addPhoto}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Balanced Masonry Grid (2 cols mobile, 3 cols tablet, 4 cols desktop) */}
          <div
            className="grid items-start gap-2.5 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2.5 sm:gap-3">
                {col.map(({ photo, originalIndex }) => (
                  <MasonryPhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={() => onPhotoClick(originalIndex)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Load More Fallback */}
          <div
            ref={sentinelRef}
            className="mt-7 flex flex-col items-center justify-center py-2"
          >
            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="min-h-[44px] rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream-deep disabled:opacity-60"
              >
                {isLoadingMore ? t.loadingMore : t.loadMore}
              </button>
            ) : (
              <p className="text-xs font-medium tracking-wide text-ink-muted/80">
                · {t.allLoaded} ·
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function MasonryPhotoCard({
  photo,
  onClick,
}: {
  photo: GuestPhoto;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden rounded-[14px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${
        photo.isNew ? "animate-fade-in-up" : ""
      }`}
      style={{
        aspectRatio: `${photo.width} / ${photo.height}`,
        backgroundColor: photo.blurColor || "#EDE6D8",
      }}
      aria-label={`${photo.alt} — ${photo.guestName}`}
    >
      {/* Warm blur/shimmer placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 skeleton-shimmer"
          aria-hidden="true"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02] ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        }`}
      />

      {/* Subtle bottom gradient caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1D1A17]/70 via-[#1D1A17]/20 to-transparent px-3 pb-2.5 pt-8">
        <p className="truncate text-xs font-medium text-ivory drop-shadow-xs">
          {photo.guestName}
        </p>
        <p className="text-[10px] text-ivory/80">{photo.uploadedAt}</p>
      </div>
    </button>
  );
}
