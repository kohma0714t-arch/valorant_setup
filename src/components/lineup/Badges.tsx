import type { Side, SkillSlot } from "@/types/domain";
import { SIDE_LABEL_EN } from "@/lib/format";

export function SideBadge({ side }: { side: Side }) {
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 border px-1.5 font-display text-[10px] font-semibold tracking-[0.12em] ${
        side === "attack" ? "border-accent/50 text-accent" : "border-cyan/50 text-cyan"
      }`}
    >
      <span className={`size-1.5 ${side === "attack" ? "bg-accent" : "bg-cyan"}`} />
      {SIDE_LABEL_EN[side]}
    </span>
  );
}

export function SiteBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex h-5 items-center border border-line-strong px-1.5 font-display text-[10px] font-semibold tracking-[0.12em] text-fg">
      SITE {code}
    </span>
  );
}

export function SkillKey({ slot }: { slot: SkillSlot }) {
  return (
    <span className="inline-grid size-5 place-items-center bg-fg font-mono text-[11px] font-medium text-bg">{slot}</span>
  );
}

export function PurposeTag({ name }: { name: string }) {
  return <span className="inline-flex h-5 items-center bg-surface-2 px-1.5 text-[11px] text-muted">#{name}</span>;
}
