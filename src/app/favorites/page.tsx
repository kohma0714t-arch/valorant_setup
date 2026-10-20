import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { LineupCard } from "@/components/lineup/LineupCard";
import { StateMessage } from "@/components/ui/StateMessage";
import { getFavoriteLineups, getSessionUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "お気に入り定点一覧",
  description: "お気に入りに登録したVALORANTの定点一覧です。",
};

export default async function FavoritesPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-[1200px] p-6">
        <StateMessage variant="setup" title="SUPABASE が未設定です" />
      </main>
    );
  }

  const user = await getSessionUser().catch(() => null);
  if (!user) {
    redirect("/login?next=/favorites");
  }

  const favoriteLineups = await getFavoriteLineups().catch(() => []);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
      <div className="mb-8 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center bg-gold/15 text-gold border border-gold/40">
            <Star size={20} fill="currentColor" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-fg sm:text-4xl">
              MY FAVORITES
            </h1>
            <p className="text-sm text-muted">
              保存した定点 ({favoriteLineups.length} 件)
            </p>
          </div>
        </div>
      </div>

      {favoriteLineups.length === 0 ? (
        <StateMessage
          title="お気に入りに登録された定点はありません"
          variant="empty"
          action={
            <Link href="/#maps" className="btn btn-primary cut-br">
              マップから定点を探す
            </Link>
          }
        >
          各定点カードや詳細画面の★ボタンを押すとお気に入りに登録され、ここで一覧確認できます。
        </StateMessage>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteLineups.map((lineup) => (
            <LineupCard
              key={lineup.id}
              lineup={lineup}
              isFavorited={true}
              isLoggedIn={true}
              showMapBadge
              permalink
            />
          ))}
        </div>
      )}
    </main>
  );
}
