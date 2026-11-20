"use client";

import { useState } from "react";
import type { Dictionary } from "../lib/i18n";
import type { PhotoIdeaKey } from "../lib/types";
import { CameraIcon, SparkleIcon, SunIcon } from "./Icons";

interface PhotoGuideSectionProps {
  t: Dictionary;
  onSelectIdeaToUpload: (idea: PhotoIdeaKey) => void;
}

const IDEA_KEYS: PhotoIdeaKey[] = ["candid", "decor", "group", "highlight"];

export function PhotoGuideSection({
  t,
  onSelectIdeaToUpload,
}: PhotoGuideSectionProps) {
  const [selectedIdea, setSelectedIdea] = useState<PhotoIdeaKey>("candid");

  return (
    <section
      aria-labelledby="photo-ideas-heading"
      className="mx-auto mt-6 max-w-5xl px-4 sm:px-6"
    >
      <div className="grid gap-3.5 md:grid-cols-12">
        {/* Photo Idea Chips Card */}
        <div className="rounded-2xl bg-white/85 p-4 sm:p-5 border border-border-soft md:col-span-7">
          <div className="flex items-center gap-2">
            <SparkleIcon className="h-4 w-4 text-gold" />
            <h2
              id="photo-ideas-heading"
              className="text-sm font-semibold tracking-tight text-ink sm:text-[15px]"
            >
              {t.ideasTitle}
            </h2>
          </div>

          {/* Interactive Chips */}
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="tablist"
            aria-label={t.ideasTitle}
          >
            {IDEA_KEYS.map((key) => {
              const active = selectedIdea === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedIdea(key)}
                  className={`min-h-[44px] rounded-full px-4 py-2 text-[13px] font-medium transition-all sm:text-sm ${
                    active
                      ? "bg-sage text-ivory shadow-xs"
                      : "bg-cream/80 text-ink hover:bg-cream-deep/70"
                  }`}
                >
                  {t.ideas[key].label}
                </button>
              );
            })}
          </div>

          {/* Selected Idea Prompt + Quick Action */}
          <div className="mt-3.5 flex flex-col gap-3 rounded-xl bg-ivory px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-relaxed text-ink-muted sm:text-sm">
              {t.ideas[selectedIdea].prompt}
            </p>
            <button
              type="button"
              onClick={() => onSelectIdeaToUpload(selectedIdea)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-sage-soft px-4 py-2 text-xs font-semibold text-sage-dark transition-colors hover:bg-sage hover:text-ivory"
            >
              <CameraIcon className="h-4 w-4" />
              <span>{t.captureThisIdea}</span>
            </button>
          </div>
        </div>

        {/* 3 Quick Tips Card */}
        <div className="rounded-2xl bg-sage-soft/65 p-4 sm:p-5 border border-sage/10 md:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <SunIcon className="h-4 w-4 text-sage-dark" />
            <h3 className="text-sm font-semibold tracking-tight text-ink sm:text-[15px]">
              {t.tipsTitle}
            </h3>
          </div>
          <ul className="mt-3 space-y-2.5">
            {t.tips.map((tip, i) => (
              <li
                key={tip}
                className="flex items-center gap-2.5 text-[14px] text-ink"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sage-dark shadow-2xs">
                  {i + 1}
                </span>
                <span className="leading-snug">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
