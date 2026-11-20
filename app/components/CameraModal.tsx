"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "../lib/i18n";
import {
  CameraIcon,
  CheckIcon,
  CloseIcon,
  GalleryIcon,
  RefreshIcon,
} from "./Icons";

interface CameraModalProps {
  t: Dictionary;
  onCapture: (file: File) => void;
  onFallbackGallery: () => void;
  onClose: () => void;
}

export function CameraModal({
  t,
  onCapture,
  onFallbackGallery,
  onClose,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (capturedUrl) return;
    let cancelled = false;

    async function startCamera() {
      stopStream();
      setIsReady(false);
      setError(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setError(t.cameraFallbackNotice);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setError(t.cameraFallbackNotice);
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, capturedUrl, stopStream, t.cameraFallbackNotice]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handleShutter = () => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `wedding-cam-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        setCapturedFile(file);
        setCapturedUrl(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedFile(null);
  };

  const handleConfirm = () => {
    if (!capturedFile) return;
    onCapture(capturedFile);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.openCamera}
      className="fixed inset-0 z-[60] flex flex-col bg-[#141210] text-ivory animate-fade-in"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-ivory/90">
          {t.cameraTipStrip}
        </span>
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          aria-label={t.closeLightbox}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-ivory hover:bg-white/20"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Viewfinder or Preview */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3">
        {error ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <CameraIcon className="h-6 w-6 text-ivory" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ivory/90">{error}</p>
            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
                onFallbackGallery();
              }}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-ivory px-5 text-sm font-semibold text-ink hover:bg-white"
            >
              <GalleryIcon className="h-4 w-4 text-sage-dark" />
              <span>{t.pickGallery}</span>
            </button>
          </div>
        ) : capturedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedUrl}
            alt="Preview"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`max-h-full max-w-full rounded-2xl object-cover ${
              facingMode === "user" ? "-scale-x-100" : ""
            }`}
          />
        )}
      </div>

      {/* Bottom Controls */}
      {!error && (
        <div className="flex items-center justify-center gap-6 px-6 pb-safe pt-5">
          {capturedUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex min-h-[50px] flex-1 max-w-[160px] items-center justify-center gap-2 rounded-full bg-white/15 px-5 text-sm font-semibold text-ivory hover:bg-white/25"
              >
                <RefreshIcon className="h-4 w-4" />
                <span>{t.retakePhoto}</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex min-h-[50px] flex-1 max-w-[180px] items-center justify-center gap-2 rounded-full bg-sage px-5 text-sm font-semibold text-ivory hover:bg-sage-dark"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{t.usePhoto}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "environment" ? "user" : "environment"
                  )
                }
                aria-label={t.switchCamera}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-ivory hover:bg-white/25"
              >
                <RefreshIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleShutter}
                disabled={!isReady}
                aria-label={t.takePhoto}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-ivory bg-ivory/20 p-1.5 transition-transform active:scale-95 disabled:opacity-40"
              >
                <span className="h-full w-full rounded-full bg-ivory" />
              </button>

              <div className="h-12 w-12" aria-hidden="true" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
