"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MapBoard, type MapPin } from "./MapBoard";
import { LineupCard } from "./LineupCard";
import { LineupPanel } from "./LineupPanel";
import { FilterBar } from "./FilterBar";
import { StateMessage } from "@/components/ui/StateMessage";
import type { Character, GameMap, Lineup, LineupFilters, Purpose } from "@/types/domain";
import { MapIcon, ListIcon } from "lucide-react";

interface LineupExplorerProps {
  map: GameMap;
  characters: Character[];
  purposes: Purpose[];
  lineups: Lineup[];
  favoriteIds: string[];
  isLoggedIn: boolean;
  filters: LineupFilters;
}

export function LineupExplorer({
  map,
  characters,
  purposes,
  lineups,
  favoriteIds,
  isLoggedIn,
  filters,
}: LineupExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL queryのlineupパラメータから初期選択を取得
  const selectedFromUrl = searchParams.get("lineup");
  const [selectedId, setSelectedId] = useState<string | null>(selectedFromUrl);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

  // URL同期
  useEffect(() => {
    setSelectedId(selectedFromUrl);
  }, [selectedFromUrl]);

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("lineup", id);
    } else {
      params.delete("lineup");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const selectedLineup = useMemo(
    () => (selectedId ? lineups.find((l) => l.id === selectedId) ?? null : null),
    [selectedId, lineups]
  );

  // マップピンデータ生成
  const pins: MapPin[] = useMemo(
    () =>
      lineups.map((l, i) => ({
        id: l.id,
        start: { x: l.start_x, y: l.start_y },
        land: { x: l.land_x, y: l.land_y },
        index: i + 1,
        label: l.title ?? `${l.character.name_ja} ${l.skill.name_ja}`,
      })),
    [lineups]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* フィルタバー */}
      <FilterBar
        map={map}
        characters={characters}
        purposes={purposes}
        activeAgent={filters.agent}
        activeSide={filters.side}
        activeSite={filters.site}
        activeSkill={filters.skill}
        activePurposes={filters.purposes}
      />

      {/* スマホ用 タブ切替 */}
      <div className="flex border-b border-line bg-surface-2/40 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("map")}
          data-active={mobileTab === "map"}
          className="flex flex-1 items-center justify-center gap-2 py-3 font-display text-sm font-semibold tracking-wider uppercase border-b-2 transition-colors data-[active=true]:border-accent data-[active=true]:text-accent text-muted"
        >
          <MapIcon size={16} />
          <span>MAP VIEW ({lineups.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          data-active={mobileTab === "list"}
          className="flex flex-1 items-center justify-center gap-2 py-3 font-display text-sm font-semibold tracking-wider uppercase border-b-2 transition-colors data-[active=true]:border-accent data-[active=true]:text-accent text-muted"
        >
          <ListIcon size={16} />
          <span>LINEUPS ({lineups.length})</span>
        </button>
      </div>

      {/* メインコンテンツ: PCは左右横並び、SPはタブ切り替え */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* 左ペイン: マップビュー */}
        <div
          className={`lg:col-span-6 xl:col-span-7 p-4 sm:p-6 lg:border-r border-line flex flex-col items-center justify-start ${
            mobileTab === "map" ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="w-full max-w-[680px] space-y-3">
            <div className="flex items-center justify-between text-xs text-muted font-mono">
              <span>{map.name_en.toUpperCase()} MINIMAP</span>
              <span>{lineups.length} LINEUP(S)</span>
            </div>

            <MapBoard
              src={map.minimap_path}
              alt={`${map.name_ja} ミニマップ`}
              pins={pins}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
              showStart="active"
              dimInactive
              priority
            />

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rotate-45 border border-bg bg-cyan" />
                  <span>開始位置 (Cyan)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-bg bg-accent" />
                  <span>着弾位置 (Red)</span>
                </span>
              </div>
              <span className="hidden sm:inline">ピン選択で詳細表示</span>
            </div>
          </div>
        </div>

        {/* 右ペイン: 定点一覧 ＆ 詳細パネル */}
        <div
          className={`lg:col-span-6 xl:col-span-5 flex flex-col min-h-0 bg-bg ${
            mobileTab === "list" ? "block" : "hidden lg:flex"
          }`}
        >
          {lineups.length === 0 ? (
            <div className="p-8">
              <StateMessage
                title="該当する定点が見つかりません"
                variant="empty"
              >
                検索条件を変更するか、フィルタをリセットしてください。
              </StateMessage>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 flex-1 min-h-0">
              {/* 一覧リスト */}
              <div
                className={`overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-14rem)] ${
                  selectedLineup ? "xl:col-span-6" : "xl:col-span-12"
                }`}
              >
                {lineups.map((l, idx) => (
                  <LineupCard
                    key={l.id}
                    lineup={l}
                    index={idx + 1}
                    isSelected={l.id === selectedId}
                    isHovered={l.id === hoveredId}
                    isFavorited={favSet.has(l.id)}
                    isLoggedIn={isLoggedIn}
                    onSelect={handleSelect}
                    onHover={setHoveredId}
                    permalink
                  />
                ))}
              </div>

              {/* 詳細プレビュー（デスクトップ） */}
              <div
                className={`hidden xl:block border-l border-line p-4 overflow-y-auto ${
                  selectedLineup ? "xl:col-span-6" : "hidden"
                }`}
              >
                {selectedLineup && (
                  <LineupPanel
                    lineup={selectedLineup}
                    onClose={() => handleSelect(null)}
                    isFavorited={favSet.has(selectedLineup.id)}
                    isLoggedIn={isLoggedIn}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* スマホ / タブレット用 詳細モーダル (ボトムシート) */}
      {selectedLineup && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm lg:hidden p-2 sm:p-4">
          <div className="max-h-[85vh] overflow-hidden flex flex-col">
            <LineupPanel
              lineup={selectedLineup}
              onClose={() => handleSelect(null)}
              isFavorited={favSet.has(selectedLineup.id)}
              isLoggedIn={isLoggedIn}
              isModal
            />
          </div>
        </div>
      )}
    </div>
  );
}
