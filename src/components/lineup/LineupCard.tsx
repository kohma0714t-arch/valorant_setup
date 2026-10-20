import Image from "next/image";
import Link from "next/link";
import { Crosshair, ExternalLink, Film, ImageIcon, MapPin } from "lucide-react";
import { SideBadge, SiteBadge, SkillKey, PurposeTag } from "./Badges";
import { FavoriteButton } from "./FavoriteButton";
import { lineupTitle, formatDate } from "@/lib/format";
import type { Lineup } from "@/types/domain";

interface LineupCardProps {
  lineup: Lineup;
  index?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  isFavorited?: boolean;
  isLoggedIn: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  showMapBadge?: boolean;
  permalink?: boolean;
}

export function LineupCard({
  lineup,
  index,
  isSelected,
  isHovered,
  isFavorited = false,
  isLoggedIn,
  onSelect,
  onHover,
  showMapBadge = false,
  permalink = false,
}: LineupCardProps) {
  const title = lineupTitle(lineup);
  const active = isSelected || isHovered;
  const hasVideo = lineup.media.some((m) => m.kind === "video");
  const hasAim = lineup.media.some((m) => m.role === "aim");

  const Content = (
    <div
      className={`card card-interactive relative p-4 transition-all duration-200 ${
        isSelected ? "border-accent bg-surface-2" : ""
      }`}
      data-active={active}
      onClick={() => onSelect?.(lineup.id)}
      onMouseEnter={() => onHover?.(lineup.id)}
      onMouseLeave={() => onHover?.(null)}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(lineup.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {index !== undefined && (
            <span className="grid size-6 shrink-0 place-items-center bg-line font-mono text-[11px] font-semibold text-fg">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <div className="relative size-10 shrink-0 border border-line bg-surface-2">
            <Image
              src={lineup.character.icon_path}
              alt={lineup.character.name_ja}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold uppercase tracking-[0.02em] text-fg">
              {title}
            </h3>
            <p className="truncate text-xs text-muted">
              {lineup.character.name_ja} · {lineup.skill.name_ja}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <FavoriteButton
            lineupId={lineup.id}
            initial={isFavorited}
            isLoggedIn={isLoggedIn}
            variant="icon"
          />
          {permalink && (
            <Link
              href={`/lineups/${lineup.id}`}
              className="grid size-8 place-items-center text-muted transition-colors hover:text-fg"
              aria-label="定点パーマリンク"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {showMapBadge && (
          <span className="inline-flex h-5 items-center bg-line px-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-fg">
            {lineup.map.name_ja}
          </span>
        )}
        <SideBadge side={lineup.side} />
        <SiteBadge code={lineup.site.code} />
        <span className="inline-flex items-center gap-1 border border-line bg-surface px-1.5 py-0.5 text-[11px] text-fg">
          <SkillKey slot={lineup.skill.slot} />
          <span className="truncate max-w-[90px]">{lineup.skill.name_ja}</span>
        </span>
        {lineup.purposes.map((p) => (
          <PurposeTag key={p.id} name={p.name_ja} />
        ))}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2 text-xs text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="メディア数">
            {hasVideo ? (
              <Film size={13} className="text-accent" />
            ) : (
              <ImageIcon size={13} />
            )}
            <span>{lineup.media.length}</span>
          </span>
          {hasAim && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted" title="照準スクショあり">
              <Crosshair size={12} className="text-accent" />
              <span>AIM</span>
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-[10px]" title="着弾地点">
            <MapPin size={11} className="text-accent" />
            <span>
              ({Math.round(lineup.land_x * 100)}, {Math.round(lineup.land_y * 100)})
            </span>
          </span>
        </div>
        <time className="font-mono text-[11px] text-muted/80">{formatDate(lineup.created_at)}</time>
      </div>
    </div>
  );

  return Content;
}
