"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Crosshair, MapPin, X } from "lucide-react";
import { MediaGallery } from "./MediaGallery";
import { FavoriteButton } from "./FavoriteButton";
import { SideBadge, SiteBadge, SkillKey, PurposeTag } from "./Badges";
import { lineupTitle, formatDate } from "@/lib/format";
import type { Lineup } from "@/types/domain";

interface LineupPanelProps {
  lineup: Lineup | null;
  onClose?: () => void;
  isFavorited?: boolean;
  isLoggedIn: boolean;
  className?: string;
  isModal?: boolean;
}

export function LineupPanel({
  lineup,
  onClose,
  isFavorited = false,
  isLoggedIn,
  className = "",
  isModal = false,
}: LineupPanelProps) {
  if (!lineup) {
    return (
      <div
        className={`flex h-full min-h-[360px] flex-col items-center justify-center border border-line bg-surface/30 p-8 text-center text-muted ${className}`}
      >
        <Crosshair size={32} strokeWidth={1.5} className="mb-3 text-muted/60" />
        <p className="font-display text-base font-semibold uppercase tracking-wider text-fg">
          NO LINEUP SELECTED
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted">
          マップ上のピンまたはリストから定点を選択すると、詳細や動画・照準スクショが表示されます。
        </p>
      </div>
    );
  }

  const title = lineupTitle(lineup);

  return (
    <div
      className={`card flex flex-col border border-line bg-surface overflow-hidden ${
        isModal ? "shadow-2xl" : ""
      } ${className}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent">DETAIL</span>
          <span className="h-3 w-px bg-line" />
          <span className="font-mono text-xs text-muted">{lineup.map.name_ja}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/lineups/${lineup.id}`}
            className="btn btn-ghost btn-sm text-xs"
            title="単体ページで開く"
          >
            <span>Share</span>
            <ArrowUpRight size={14} />
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm size-8 p-0"
              aria-label="閉じる"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* メディアギャラリー */}
        <MediaGallery media={lineup.media} title={title} />

        {/* タイトル & エージェント情報 */}
        <div className="space-y-2 border-b border-line/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 border border-line bg-surface-2">
                <Image
                  src={lineup.character.icon_path}
                  alt={lineup.character.name_ja}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-[0.02em] text-fg">
                  {title}
                </h2>
                <p className="text-xs text-muted">
                  {lineup.character.name_ja} ({lineup.character.name_en})
                </p>
              </div>
            </div>

            <FavoriteButton
              lineupId={lineup.id}
              initial={isFavorited}
              isLoggedIn={isLoggedIn}
              variant="full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <SideBadge side={lineup.side} />
            <SiteBadge code={lineup.site.code} />
            <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 px-2 py-0.5 text-xs text-fg">
              <SkillKey slot={lineup.skill.slot} />
              <span>{lineup.skill.name_ja}</span>
            </span>
            {lineup.purposes.map((p) => (
              <PurposeTag key={p.id} name={p.name_ja} />
            ))}
          </div>
        </div>

        {/* 照準メモ（あれば） */}
        {lineup.aim_note && (
          <div className="rounded-none border border-line bg-surface-2/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-1">
              <Crosshair size={13} />
              <span>AIM NOTE</span>
            </div>
            <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">
              {lineup.aim_note}
            </p>
          </div>
        )}

        {/* 座標情報 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="border border-line bg-surface-2/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <span className="size-2 rotate-45 border border-bg bg-cyan" />
              <span className="font-display tracking-wider">START POSITION</span>
            </div>
            <p className="font-mono text-fg text-sm">
              X: {(lineup.start_x * 100).toFixed(1)}% / Y: {(lineup.start_y * 100).toFixed(1)}%
            </p>
          </div>
          <div className="border border-line bg-surface-2/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <span className="size-2 rounded-full border border-bg bg-accent" />
              <span className="font-display tracking-wider">LAND POSITION</span>
            </div>
            <p className="font-mono text-fg text-sm">
              X: {(lineup.land_x * 100).toFixed(1)}% / Y: {(lineup.land_y * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 登録日時 */}
        <div className="text-right text-[11px] font-mono text-muted/70">
          Created: {formatDate(lineup.created_at)}
        </div>
      </div>
    </div>
  );
}
