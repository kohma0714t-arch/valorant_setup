import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { LineupPanel } from "@/components/lineup/LineupPanel";
import { MapBoard } from "@/components/lineup/MapBoard";
import { getFavoriteIds, getLineup, getSessionUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { lineupTitle } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lineup = isSupabaseConfigured ? await getLineup(id).catch(() => null) : null;
  if (!lineup) return { title: "定点が見つかりません" };
  const title = lineupTitle(lineup);
  return {
    title: `${title} - ${lineup.map.name_ja}`,
    description: `VALORANT ${lineup.map.name_ja} / ${lineup.character.name_ja} の定点詳細。再現手順・動画・照準スクリーンショットを確認できます。`,
  };
}

export default async function LineupDetailPage({ params }: PageProps) {
  if (!isSupabaseConfigured) notFound();

  const { id } = await params;
  const [lineup, user] = await Promise.all([
    getLineup(id),
    getSessionUser().catch(() => null),
  ]);

  if (!lineup) {
    notFound();
  }

  const favoriteIds: string[] = await getFavoriteIds(user?.id).catch(() => []);
  const isFavorited = favoriteIds.includes(lineup.id);

  const pins = [
    {
      id: lineup.id,
      start: { x: lineup.start_x, y: lineup.start_y },
      land: { x: lineup.land_x, y: lineup.land_y },
      label: lineupTitle(lineup),
    },
  ];

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/maps/${lineup.map.slug}?lineup=${lineup.id}`}
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={16} />
          <span>{lineup.map.name_ja} のマップで見る</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 左: 詳細パネル */}
        <div className="lg:col-span-7 xl:col-span-8">
          <LineupPanel
            lineup={lineup}
            isFavorited={isFavorited}
            isLoggedIn={Boolean(user)}
          />
        </div>

        {/* 右: マップ位置プレビュー */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-fg">
              MAP POSITION
            </h3>
            <MapBoard
              src={lineup.map.minimap_path}
              alt={`${lineup.map.name_ja} ミニマップ`}
              pins={pins}
              selectedId={lineup.id}
              showStart="all"
            />
            <div className="flex items-center justify-around text-xs text-muted pt-1">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rotate-45 border border-bg bg-cyan" />
                <span>開始位置</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-bg bg-accent" />
                <span>着弾位置</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
