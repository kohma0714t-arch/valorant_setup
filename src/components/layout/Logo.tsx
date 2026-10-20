import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="VALO SET ホーム">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
        <path d="M2 3h6l7 14-3 6z" fill="var(--color-accent)" />
        <path d="M24 3h-6l-3.2 6.4 3 6z" fill="var(--color-fg)" className="transition-colors group-hover:fill-accent" />
      </svg>
      <span className="font-display text-[19px] font-bold leading-none tracking-[0.12em]">
        VALO<span className="text-accent">/</span>SET
      </span>
    </Link>
  );
}
