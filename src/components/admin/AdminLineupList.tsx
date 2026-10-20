"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit2, ExternalLink, Film, ImageIcon, Trash2 } from "lucide-react";
import { deleteLineup } from "@/lib/actions/admin";
import { lineupTitle, formatDate } from "@/lib/format";
import { SideBadge, SiteBadge } from "@/components/lineup/Badges";
import type { Lineup } from "@/types/domain";

export function AdminLineupList({ initialLineups }: { initialLineups: Lineup[] }) {
  const router = useRouter();
  const [lineups, setLineups] = useState(initialLineups);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string, title: string) {
    if (!confirm(`定点「${title}」を削除（非表示）にしますか？`)) {
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteLineup(id);
      if (res.ok) {
        setLineups((list) => list.filter((l) => l.id !== id));
        router.refresh();
      } else {
        alert(res.error);
      }
      setDeletingId(null);
    });
  }

  if (lineups.length === 0) {
    return (
      <div className="card p-12 text-center space-y-3">
        <p className="font-display text-lg text-muted uppercase">NO LINEUPS FOUND</p>
        <p className="text-xs text-muted">定点がまだ登録されていません。</p>
        <Link href="/admin/lineups/new" className="btn btn-primary cut-br btn-sm mt-2">
          最初の定点を登録
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full text-left text-xs text-muted">
        <thead className="border-b border-line bg-surface-2/60 font-display text-[11px] uppercase tracking-wider text-fg">
          <tr>
            <th className="p-3">STATUS</th>
            <th className="p-3">MAP</th>
            <th className="p-3">AGENT / SKILL</th>
            <th className="p-3">SIDE / SITE</th>
            <th className="p-3">TITLE</th>
            <th className="p-3">MEDIA</th>
            <th className="p-3">DATE</th>
            <th className="p-3 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/40">
          {lineups.map((l) => {
            const title = lineupTitle(l);
            const isDeleting = deletingId === l.id;
            return (
              <tr key={l.id} className="hover:bg-surface-2/40 transition-colors">
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                      l.status === "published"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="p-3 font-mono font-medium text-fg uppercase">
                  {l.map.name_ja}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative size-6 border border-line bg-surface-2 shrink-0">
                      <Image
                        src={l.character.icon_path}
                        alt=""
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-fg font-medium">{l.character.name_ja}</span>
                    <span className="font-mono text-xs">({l.skill.slot})</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <SideBadge side={l.side} />
                    <SiteBadge code={l.site.code} />
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-fg font-medium line-clamp-1 max-w-[200px]" title={title}>
                    {title}
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-fg">
                    <Film size={12} className="text-accent" />
                    <span>{l.media.length}</span>
                  </span>
                </td>
                <td className="p-3 font-mono text-[11px]">
                  {formatDate(l.created_at)}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/lineups/${l.id}`}
                      target="_blank"
                      className="btn btn-ghost btn-sm size-7 p-0"
                      title="公開ページを確認"
                    >
                      <ExternalLink size={13} />
                    </Link>
                    <Link
                      href={`/admin/lineups/${l.id}/edit`}
                      className="btn btn-secondary btn-sm size-7 p-0"
                      title="編集"
                    >
                      <Edit2 size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(l.id, title)}
                      disabled={pending || isDeleting}
                      className="btn btn-ghost btn-sm size-7 p-0 text-accent hover:bg-accent/10"
                      title="削除（論理削除）"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
