import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LineupExplorer } from "@/components/lineup/LineupExplorer";
import { StateMessage } from "@/components/ui/StateMessage";
import {
  getCharacters,
  getFavoriteIds,
  getMapBySlug,
  getPurposes,
  getSessionUser,
  parseFilters,
  searchLineups,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const map = isSupabaseConfigured ? await getMapBySlug(slug).catch(() => null) : null;
  if (!map) return { title: "マップが見つかりません" };
  return {
    title: `${map.name_ja} (${map.name_en}) の定点一覧`,
    description: `VALORANT ${map.name_ja}（${map.name_en}）の定点・ラインナップをマップから検索。`,
  };
}

export default async function MapPage({ params, searchParams }: PageProps) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-[1440px] p-6">
        <StateMessage variant="setup" title="SUPABASE が未設定です">
          Supabaseの接続設定を完了してください。
        </StateMessage>
      </main>
    );
  }

  const { slug } = await params;
  const rawQuery = await searchParams;
  const filters = parseFilters(rawQuery);

  const [map, characters, purposes, user] = await Promise.all([
    getMapBySlug(slug),
    getCharacters(),
    getPurposes(),
    getSessionUser().catch(() => null),
  ]);

  if (!map) {
    notFound();
  }

  const [lineups, favoriteIds] = await Promise.all([
    searchLineups(map, filters).catch(() => []),
    getFavoriteIds(user?.id).catch(() => []),
  ]);

  return (
    <main>
      <LineupExplorer
        map={map}
        characters={characters}
        purposes={purposes}
        lineups={lineups}
        favoriteIds={favoriteIds}
        isLoggedIn={Boolean(user)}
        filters={filters}
      />
    </main>
  );
}
