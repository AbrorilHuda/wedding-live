"use client";

import type { Dictionary } from "../lib/i18n";
import { CameraIcon, WifiOffIcon } from "./Icons";

interface StickyUploadBarProps {
  t: Dictionary;
  onClick: () => void;
  activeUploadCount: number;
  offlineQueueCount: number;
  hidden?: boolean;
}

export function StickyUploadBar({
  t,
  onClick,
  activeUploadCount,
  offlineQueueCount,
  hidden = false,
}: StickyUploadBarProps) {
  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-4 pb-safe pt-6 bg-gradient-to-t from-ivory via-ivory/92 to-transparent">
      {/* Compact live status pill when uploads are queued/running in background */}
      {(activeUploadCount > 0 || offlineQueueCount > 0) && (
        <button
          type="button"
          onClick={onClick}
          className="pointer-events-auto mb-2.5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-ivory shadow-md animate-fade-in"
        >
          {offlineQueueCount > 0 ? (
            <>
              <WifiOffIcon className="h-3.5 w-3.5 text-amber-300" />
              <span>
                {offlineQueueCount} {t.statusOffline}
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {t.statusUploading} ({activeUploadCount})
              </span>
            </>
          )}
        </button>
      )}

      {/* Primary single action button — thumb-reachable & accessible (>= 54px) */}
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex min-h-[54px] w-full max-w-md items-center justify-center gap-2.5 rounded-full bg-sage px-6 py-3.5 text-base font-semibold text-ivory shadow-[0_10px_28px_-6px_rgba(66,85,64,0.55)] transition-all hover:bg-sage-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      >
        <CameraIcon className="h-5 w-5" />
        <span>{t.addPhoto}</span>
      </button>
    </div>
  );
}
