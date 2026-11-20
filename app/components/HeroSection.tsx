"use client";

import Image from "next/image";
import type { Dictionary } from "../lib/i18n";
import type { Locale } from "../lib/types";
import { CameraIcon } from "./Icons";

interface HeroSectionProps {
  t: Dictionary;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  totalPhotos: number;
  onAddPhotoClick: () => void;
}

export function HeroSection({
  t,
  locale,
  onLocaleChange,
  totalPhotos,
  onAddPhotoClick,
}: HeroSectionProps) {
  return (
    <header className="w-full">
      {/* Subtle top bar */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-xl font-semibold tracking-wide text-ink">
            {t.monogram}
          </span>
          <span className="h-3.5 w-px bg-ink/15" aria-hidden="true" />
          <span className="text-xs font-medium text-ink-muted">
            {t.photosShared(totalPhotos)}
          </span>
        </div>

        {/* Bilingual toggle (ID default, EN optional) */}
        <div
          className="inline-flex items-center rounded-full bg-cream p-0.5 border border-border-soft"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => onLocaleChange("id")}
            className={`min-h-[34px] min-w-[38px] rounded-full px-2.5 text-xs font-semibold transition-colors ${locale === "id"
              ? "bg-white text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
              }`}
            aria-pressed={locale === "id"}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => onLocaleChange("en")}
            className={`min-h-[34px] min-w-[38px] rounded-full px-2.5 text-xs font-semibold transition-colors ${locale === "en"
              ? "bg-white text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
              }`}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
        </div>
      </div>

      {/* Editorial Hero Card */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[22px] bg-cream shadow-[0_14px_40px_-20px_rgba(36,33,29,0.22)]">
          {/* Background prewedding image — prioritized for fast LCP */}
          <div className="relative h-[430px] w-full sm:h-[460px]">
            <Image
              src="/images/hero.jpg"
              alt={`${t.coupleNames} — ${t.heroBadge}`}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 1024px"
              className="object-cover object-[50%_28%]"
            />
            {/* Soft warm editorial gradient overlay for crisp typography contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/85 via-[#1E1B18]/35 to-[#1E1B18]/15"
              aria-hidden="true"
            />

            {/* Hero Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
              <div className="flex justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/90 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-xs">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sage"
                    aria-hidden="true"
                  />
                  {t.heroBadge}
                </span>
              </div>

              <div className="mx-auto max-w-xl text-center sm:mx-0 sm:text-left">
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-ivory/85 sm:text-sm">
                  {t.eventDate} · {t.eventLocation}
                </p>
                <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ivory sm:text-6xl leading-[1.05]">
                  {t.coupleNames}
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ivory/90 sm:text-base">
                  {t.heroGreeting}
                </p>
                <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-ivory sm:text-base">
                  {t.heroCtaText}
                </p>

                {/* Primary Hero CTA (desktop & quick-tap above the fold) */}
                <div className="mt-5 flex justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={onAddPhotoClick}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full bg-ivory px-6 py-3 text-[15px] font-semibold text-ink shadow-md transition-all hover:bg-white active:scale-[0.98]"
                  >
                    <CameraIcon className="h-5 w-5 text-sage" />
                    <span>{t.addPhoto}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Short Steps: Scan -> Foto -> Tampil */}
        <section
          aria-label={t.stepsTitle}
          className="mt-4 rounded-2xl bg-white/80 px-4 py-3.5 border border-border-soft"
        >
          <ol className="grid grid-cols-3 gap-2">
            {t.steps.map((step, index) => (
              <li
                key={step.label}
                className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-center sm:gap-2.5 sm:text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-xs font-bold text-sage-dark">
                  {index + 1}
                </span>
                <div className="mt-1.5 sm:mt-0">
                  <p className="text-[13px] font-semibold text-ink leading-tight sm:text-sm">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-muted sm:text-xs">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </header>
  );
}
