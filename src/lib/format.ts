import type { Lineup, MediaKind, Side } from "@/types/domain";

export const SIDE_LABEL: Record<Side, string> = {
  attack: "攻撃",
  defense: "防衛",
};

export const SIDE_LABEL_EN: Record<Side, string> = {
  attack: "ATTACK",
  defense: "DEFENSE",
};

export const MEDIA_ROLE_LABEL = {
  execution: "実行動画 / 手順",
  aim: "照準スクリーンショット",
  other: "その他",
} as const;

/** メディア登録条件（docs/spec.md §0-6） */
export const MEDIA_LIMITS: Record<MediaKind, { maxBytes: number; mimes: readonly string[]; label: string }> = {
  video: { maxBytes: 50 * 1024 * 1024, mimes: ["video/mp4", "video/webm"], label: "mp4 / webm・50MBまで" },
  image: { maxBytes: 5 * 1024 * 1024, mimes: ["image/png", "image/jpeg", "image/webp"], label: "png / jpg / webp・5MBまで" },
};

export function mediaKindOf(mime: string): MediaKind | null {
  if (MEDIA_LIMITS.video.mimes.includes(mime)) return "video";
  if (MEDIA_LIMITS.image.mimes.includes(mime)) return "image";
  return null;
}

/** タイトル未入力時の自動生成（例: サイファー Aサイト 防衛 スパイカメラ） */
export function lineupTitle(
  l: Pick<Lineup, "title" | "side"> & {
    character: { name_ja: string };
    site: { code: string };
    skill: { name_ja: string };
  },
): string {
  if (l.title && l.title.trim()) return l.title;
  return autoTitle(l.character.name_ja, l.site.code, l.side, l.skill.name_ja);
}

export function autoTitle(character: string, siteCode: string, side: Side, skill: string): string {
  return `${character} ${siteCode}サイト ${SIDE_LABEL[side]} ${skill}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** open redirect 対策：同一オリジンの相対パスのみ許可 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
