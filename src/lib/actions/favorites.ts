"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export type FavoriteResult = { ok: true; favorited: boolean } | { ok: false; error: string; needLogin?: boolean };

/** お気に入りの登録・解除（RLS により本人のレコードのみ操作可能） */
export async function toggleFavorite(lineupId: string, favorite: boolean): Promise<FavoriteResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase が未設定です" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です", needLogin: true };
  if (!/^[0-9a-f-]{36}$/i.test(lineupId)) return { ok: false, error: "不正なIDです" };

  if (favorite) {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: user.id, lineup_id: lineupId }, { onConflict: "user_id,lineup_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: "お気に入り登録に失敗しました" };
  } else {
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("lineup_id", lineupId);
    if (error) return { ok: false, error: "お気に入り解除に失敗しました" };
  }

  revalidatePath("/favorites");
  return { ok: true, favorited: favorite };
}
