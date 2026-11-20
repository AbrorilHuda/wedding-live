import type { Dictionary } from "../lib/i18n";
import { ShieldIcon } from "./Icons";

interface FooterSectionProps {
  t: Dictionary;
}

export function FooterSection({ t }: FooterSectionProps) {
  return (
    <footer className="mx-auto mt-14 max-w-5xl px-4 pb-28 sm:px-6">
      <div className="rounded-2xl bg-cream/70 px-6 py-8 text-center border border-border-soft">
        <p className="font-serif text-3xl font-medium tracking-wide text-ink">
          {t.monogram}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
          {t.footerThanks}
        </p>
        <p className="mt-2 font-serif text-lg italic text-ink">
          {t.footerSignature}
        </p>

        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-ivory/90 px-4 py-2 text-xs text-ink-muted border border-border-soft">
          <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-sage" />
          <span>{t.footerPrivacy}</span>
        </div>
      </div>
    </footer>
  );
}
