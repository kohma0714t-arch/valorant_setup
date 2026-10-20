"use client";

import { useState } from "react";
import { Crosshair, Film, ImageIcon, ImageOff } from "lucide-react";
import { MEDIA_ROLE_LABEL } from "@/lib/format";
import { mediaPublicUrl } from "@/lib/supabase/env";
import type { LineupMedia } from "@/types/domain";

/** 定点の動画・スクリーンショット表示（読込失敗時はフォールバック表示） */
export function MediaGallery({ media, title }: { media: LineupMedia[]; title: string }) {
  // 実行動画 → 照準 → その他 の順で先頭を選択
  const ordered = [...media].sort((a, b) => roleRank(a) - roleRank(b) || a.sort_order - b.sort_order);
  const [activeId, setActiveId] = useState(ordered[0]?.id);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const active = ordered.find((m) => m.id === activeId) ?? ordered[0];

  if (!active) {
    return (
      <div className="hatch grid aspect-video place-items-center border border-line text-sm text-muted">
        メディアが登録されていません
      </div>
    );
  }

  const url = mediaPublicUrl(active.storage_path);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video overflow-hidden border border-line bg-black">
        {failed[active.id] ? (
          <div role="alert" className="hatch flex size-full flex-col items-center justify-center gap-2 text-sm text-muted">
            <ImageOff size={22} />
            メディアを読み込めませんでした
            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-fg underline underline-offset-4">
              直接開く
            </a>
          </div>
        ) : active.kind === "video" ? (
          <video
            key={active.id}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="size-full object-contain"
            onError={() => setFailed((f) => ({ ...f, [active.id]: true }))}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={active.id}
            src={url}
            alt={`${title} - ${MEDIA_ROLE_LABEL[active.role]}`}
            className="size-full object-contain"
            onError={() => setFailed((f) => ({ ...f, [active.id]: true }))}
          />
        )}
        <span className="label absolute left-2 top-2 flex items-center gap-1.5 bg-bg/85 px-2 py-1 !text-fg backdrop-blur">
          {active.role === "aim" ? <Crosshair size={12} className="text-accent" /> : null}
          {MEDIA_ROLE_LABEL[active.role]}
        </span>
      </div>

      {ordered.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="メディア一覧">
          {ordered.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                id={`media-thumb-${m.id}`}
                onClick={() => setActiveId(m.id)}
                aria-pressed={m.id === active.id}
                className={`relative grid h-14 w-24 shrink-0 place-items-center overflow-hidden border bg-surface-2 transition-colors ${
                  m.id === active.id ? "border-accent" : "border-line hover:border-line-strong"
                }`}
              >
                {m.kind === "image" && !failed[m.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPublicUrl(m.storage_path)} alt="" className="size-full object-cover" loading="lazy" />
                ) : m.kind === "video" ? (
                  <Film size={18} className="text-muted" />
                ) : (
                  <ImageIcon size={18} className="text-muted" />
                )}
                <span className="absolute bottom-0 left-0 bg-bg/85 px-1 font-mono text-[10px] text-muted">
                  {String(i + 1).padStart(2, "0")}
                  {m.role === "aim" ? " AIM" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function roleRank(m: LineupMedia) {
  if (m.role === "execution") return m.kind === "video" ? 0 : 1;
  if (m.role === "aim") return 2;
  return 3;
}
