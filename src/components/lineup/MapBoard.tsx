"use client";

import Image from "next/image";
import type { MouseEvent, ReactNode } from "react";

export interface MapPin {
  id: string;
  start: { x: number; y: number };
  land: { x: number; y: number };
  index?: number;
  label?: string;
}

interface Props {
  src: string;
  alt: string;
  pins: MapPin[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** 背景クリックで座標を取得（管理画面の位置指定用） */
  onPick?: (pt: { x: number; y: number }) => void;
  /** 開始位置ピンを表示する対象 */
  showStart?: "active" | "all";
  dimInactive?: boolean;
  overlay?: ReactNode;
  className?: string;
  priority?: boolean;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * 正規化座標（0〜1）でピンを描画するマップボード。
 * 画像サイズに依存せず、%指定で配置するためレスポンシブに追従する。
 */
export function MapBoard({
  src,
  alt,
  pins,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onPick,
  showStart = "active",
  dimInactive = false,
  overlay,
  className = "",
  priority,
}: Props) {
  const activeIds = new Set([selectedId, hoveredId].filter(Boolean) as string[]);
  const hasActive = activeIds.size > 0;

  function handlePick(e: MouseEvent<HTMLDivElement>) {
    if (!onPick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onPick({
      x: Number(clamp((e.clientX - rect.left) / rect.width).toFixed(5)),
      y: Number(clamp((e.clientY - rect.top) / rect.height).toFixed(5)),
    });
  }

  const linePins = pins.filter((p) => showStart === "all" || activeIds.has(p.id));

  return (
    <div
      className={`tick-corners relative aspect-square w-full select-none border border-line bg-[#121d27] ${
        onPick ? "cursor-crosshair" : ""
      } ${className}`}
      onClick={handlePick}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <Image src={src} alt={alt} fill priority={priority} sizes="(min-width:1024px) 60vw, 100vw" className="pointer-events-none object-contain p-[2%]" draggable={false} />

      {/* 軌跡ライン */}
      <svg viewBox="0 0 1000 1000" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="var(--color-accent)" />
          </marker>
        </defs>
        {linePins.map((p) => {
          const active = activeIds.has(p.id);
          return (
            <line
              key={p.id}
              x1={p.start.x * 1000}
              y1={p.start.y * 1000}
              x2={p.land.x * 1000}
              y2={p.land.y * 1000}
              stroke={active ? "var(--color-fg)" : "var(--color-muted)"}
              strokeOpacity={active ? 0.9 : 0.45}
              strokeWidth={active ? 3 : 2}
              strokeDasharray="10 8"
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>

      {/* 開始位置ピン */}
      {linePins.map((p) => (
        <span
          key={`s-${p.id}`}
          className="pointer-events-none absolute z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-bg bg-cyan shadow-[0_0_0_1px_var(--color-cyan)]"
          style={{ left: `${p.start.x * 100}%`, top: `${p.start.y * 100}%` }}
          title="開始位置"
        />
      ))}

      {/* 着弾位置ピン */}
      {pins.map((p) => {
        const selected = p.id === selectedId;
        const active = activeIds.has(p.id);
        const Tag = onSelect ? "button" : "span";
        return (
          <Tag
            key={`l-${p.id}`}
            {...(onSelect
              ? {
                  type: "button" as const,
                  id: `pin-${p.id}`,
                  "aria-label": p.label ? `${p.label} の着弾位置` : "着弾位置",
                  "aria-pressed": selected,
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    onSelect(p.id);
                  },
                  onMouseEnter: () => onHover?.(p.id),
                  onMouseLeave: () => onHover?.(null),
                  onFocus: () => onHover?.(p.id),
                  onBlur: () => onHover?.(null),
                }
              : {})}
            className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-[10px] font-medium leading-none transition-all duration-200 ${
              active ? "z-30 size-7 border-fg bg-accent text-bg" : "z-20 size-[22px] border-bg bg-accent text-bg hover:scale-110"
            } ${dimInactive && hasActive && !active ? "opacity-35" : ""}`}
            style={{ left: `${p.land.x * 100}%`, top: `${p.land.y * 100}%` }}
          >
            {selected && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 size-full animate-pulse-ring rounded-full border-2 border-accent" />
            )}
            {p.index ?? ""}
          </Tag>
        );
      })}

      {overlay}
    </div>
  );
}
