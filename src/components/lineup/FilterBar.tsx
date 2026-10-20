"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FilterX, RotateCcw } from "lucide-react";
import { SIDE_LABEL_EN } from "@/lib/format";
import type { Character, GameMap, Purpose, Side, SkillSlot } from "@/types/domain";

interface FilterBarProps {
  map: GameMap;
  characters: Character[];
  purposes: Purpose[];
  activeAgent?: string;
  activeSide?: Side;
  activeSite?: string;
  activeSkill?: SkillSlot;
  activePurposes: string[];
}

export function FilterBar({
  map,
  characters,
  purposes,
  activeAgent,
  activeSide,
  activeSite,
  activeSkill,
  activePurposes,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedAgent = characters.find((c) => c.slug === activeAgent);
  const availableSkills = selectedAgent ? selectedAgent.skills : [];

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === "") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });
      // フィルタ変更時は選択中の個別 lineup は一旦解除
      current.delete("lineup");
      const qs = current.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const togglePurpose = useCallback(
    (slug: string) => {
      const set = new Set(activePurposes);
      if (set.has(slug)) {
        set.delete(slug);
      } else {
        set.add(slug);
      }
      const arr = Array.from(set);
      updateFilters({ purpose: arr.length > 0 ? arr.join(",") : null });
    },
    [activePurposes, updateFilters]
  );

  const resetAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasFilter =
    Boolean(activeAgent) ||
    Boolean(activeSide) ||
    Boolean(activeSite) ||
    Boolean(activeSkill) ||
    activePurposes.length > 0;

  return (
    <div className="border-b border-line bg-surface/50 p-4 space-y-3">
      {/* 1行目: エージェント選択 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label mr-1 hidden sm:inline">AGENT:</span>
        <button
          type="button"
          onClick={() => updateFilters({ agent: null, skill: null })}
          data-active={!activeAgent}
          className="chip"
        >
          ALL
        </button>
        {characters.map((c) => {
          const active = c.slug === activeAgent;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => updateFilters({ agent: active ? null : c.slug, skill: null })}
              data-active={active}
              className="chip !pl-1.5"
            >
              <div className="relative size-5 border border-line bg-surface-2">
                <Image src={c.icon_path} alt={c.name_ja} fill sizes="20px" className="object-cover" />
              </div>
              <span>{c.name_en}</span>
            </button>
          );
        })}
      </div>

      {/* 2行目: 攻防 / サイト / スキル / リセット */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 攻防 */}
        <span className="label mr-1 hidden sm:inline">SIDE:</span>
        {(["attack", "defense"] as Side[]).map((s) => {
          const active = s === activeSide;
          return (
            <button
              key={s}
              type="button"
              onClick={() => updateFilters({ side: active ? null : s })}
              data-active={active}
              className="chip"
            >
              <span
                className={`size-1.5 ${s === "attack" ? "bg-accent" : "bg-cyan"}`}
              />
              <span>{SIDE_LABEL_EN[s]}</span>
            </button>
          );
        })}

        <span className="mx-1 h-4 w-px bg-line hidden sm:block" />

        {/* サイト */}
        <span className="label mr-1 hidden sm:inline">SITE:</span>
        {map.sites.map((s) => {
          const active = s.code === activeSite;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => updateFilters({ site: active ? null : s.code })}
              data-active={active}
              className="chip font-mono"
            >
              SITE {s.code}
            </button>
          );
        })}

        {/* 選択キャラ固有スキル（キャラ選択時のみ表示） */}
        {availableSkills.length > 0 && (
          <>
            <span className="mx-1 h-4 w-px bg-line hidden sm:block" />
            <span className="label mr-1 hidden sm:inline">SKILL:</span>
            {availableSkills.map((sk) => {
              const active = sk.slot === activeSkill;
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => updateFilters({ skill: active ? null : sk.slot })}
                  data-active={active}
                  className="chip"
                >
                  <span className="font-mono text-xs font-bold">{sk.slot}</span>
                  <span className="truncate max-w-[80px]">{sk.name_ja}</span>
                </button>
              );
            })}
          </>
        )}

        {hasFilter && (
          <button
            type="button"
            onClick={resetAll}
            className="btn btn-ghost btn-sm ml-auto text-xs text-muted hover:text-accent"
            title="フィルタをリセット"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* 3行目: 用途タグ */}
      {purposes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/40">
          <span className="label mr-1">PURPOSE:</span>
          {purposes.map((p) => {
            const active = activePurposes.includes(p.slug);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePurpose(p.slug)}
                data-active={active}
                className="chip h-7 px-2 text-xs"
              >
                #{p.name_ja}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
