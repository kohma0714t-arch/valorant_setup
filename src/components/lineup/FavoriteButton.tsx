"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";

export function FavoriteButton({
  lineupId,
  initial,
  isLoggedIn,
  variant = "full",
  onChange,
}: {
  lineupId: string;
  initial: boolean;
  isLoggedIn: boolean;
  variant?: "full" | "icon";
  onChange?: (favorited: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!isLoggedIn) {
      const qs = searchParams.toString();
      router.push(`/login?next=${encodeURIComponent(pathname + (qs ? `?${qs}` : ""))}`);
      return;
    }
    const next = !saved;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const res = await toggleFavorite(lineupId, next);
      if (res.ok) {
        setSaved(res.favorited);
        onChange?.(res.favorited);
      } else {
        setError(res.error);
        if (res.needLogin) router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });
  }

  const label = optimistic ? "お気に入り解除" : "お気に入り登録";

  if (variant === "icon") {
    return (
      <button
        type="button"
        id={`fav-${lineupId}`}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={label}
        title={error ?? label}
        className={`grid size-8 shrink-0 place-items-center transition-colors ${
          optimistic ? "text-gold" : "text-muted hover:text-fg"
        }`}
      >
        <Star size={17} fill={optimistic ? "currentColor" : "none"} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        id={`fav-detail-${lineupId}`}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={optimistic}
        className={`btn btn-sm ${optimistic ? "border border-gold/60 bg-gold/10 text-gold" : "btn-secondary"}`}
      >
        <Star size={15} fill={optimistic ? "currentColor" : "none"} strokeWidth={1.8} />
        {optimistic ? "Saved" : "Favorite"}
      </button>
      {!isLoggedIn && <span className="text-[11px] text-muted">ログインで登録できます</span>}
      {error && (
        <span role="alert" className="text-[11px] text-accent">
          {error}
        </span>
      )}
    </div>
  );
}
