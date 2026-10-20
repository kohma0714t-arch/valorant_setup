"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { lineupInputSchema, mediaInputSchema, type LineupInput, type MediaInput } from "@/lib/validation";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * 画面側の管理者チェック（UX 用）。
 * 最終的な権限保証は DB の RLS（is_admin()）で行うため、ここを通過しても RLS で拒否され得る。
 */
async function requireAdmin(): Promise<{ supabase: SupabaseClient; userId: string } | { error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { error: "Supabase が未設定です" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return { error: "管理者権限がありません" };
  return { supabase, userId: user.id };
}

function revalidateLineupPages(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/maps/[slug]", "page");
  revalidatePath("/favorites");
  if (id) revalidatePath(`/lineups/${id}`);
}

/** 定点の新規作成・更新。新規は draft で作成し、メディア登録後に publishLineup で公開する */
export async function saveLineup(input: LineupInput): Promise<Result<{ id: string }>> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = lineupInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  const v = parsed.data;
  const { supabase, userId } = auth;

  const row = {
    title: v.title,
    map_id: v.mapId,
    character_id: v.characterId,
    side: v.side,
    site_id: v.siteId,
    skill_id: v.skillId,
    start_x: v.start.x,
    start_y: v.start.y,
    land_x: v.land.x,
    land_y: v.land.y,
    aim_note: v.aimNote,
  };

  let id = v.id;
  if (id) {
    const { error } = await supabase.from("lineups").update(row).eq("id", id).is("deleted_at", null);
    if (error) return { ok: false, error: `定点の更新に失敗しました：${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("lineups")
      .insert({ ...row, status: "draft", created_by: userId })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: `定点の登録に失敗しました：${error?.message ?? ""}` };
    id = data.id as string;
  }

  // 用途は全置換
  const { error: delErr } = await supabase.from("lineup_purposes").delete().eq("lineup_id", id);
  if (delErr) return { ok: false, error: `用途の更新に失敗しました：${delErr.message}` };
  if (v.purposeIds.length) {
    const { error: insErr } = await supabase
      .from("lineup_purposes")
      .insert(v.purposeIds.map((purpose_id) => ({ lineup_id: id, purpose_id })));
    if (insErr) return { ok: false, error: `用途の登録に失敗しました：${insErr.message}` };
  }

  return { ok: true, id: id! };
}

/** ブラウザから Storage へアップロード済みのファイルを lineup_media に登録 */
export async function attachMedia(lineupId: string, items: MediaInput[]): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const rows = [];
  for (const item of items) {
    const parsed = mediaInputSchema.safeParse(item);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "メディア情報が不正です" };
    const m = parsed.data;
    if (!m.storagePath.startsWith(`lineups/${lineupId}/`)) return { ok: false, error: "保存先パスが不正です" };
    rows.push({
      lineup_id: lineupId,
      kind: m.kind,
      role: m.role,
      storage_path: m.storagePath,
      mime_type: m.mimeType,
      size_bytes: m.sizeBytes,
      sort_order: m.sortOrder,
    });
  }
  if (!rows.length) return { ok: true };

  const { error } = await auth.supabase.from("lineup_media").insert(rows);
  if (error) return { ok: false, error: `メディアの登録に失敗しました：${error.message}` };
  return { ok: true };
}

/** メディアの削除（DB行＋Storage実体） */
export async function removeMedia(mediaIds: string[]): Promise<Result> {
  if (!mediaIds.length) return { ok: true };
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supabase } = auth;

  const { data, error } = await supabase.from("lineup_media").delete().in("id", mediaIds).select("storage_path");
  if (error) return { ok: false, error: `メディアの削除に失敗しました：${error.message}` };
  const paths = (data ?? []).map((r) => r.storage_path as string);
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  return { ok: true };
}

/** メディアが1件以上あれば公開。0件なら draft に戻してエラーを返す */
export async function publishLineup(lineupId: string): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supabase } = auth;

  const { count, error } = await supabase
    .from("lineup_media")
    .select("id", { count: "exact", head: true })
    .eq("lineup_id", lineupId);
  if (error) return { ok: false, error: `メディア件数の確認に失敗しました：${error.message}` };

  const status = (count ?? 0) > 0 ? "published" : "draft";
  const { error: upErr } = await supabase.from("lineups").update({ status }).eq("id", lineupId);
  if (upErr) return { ok: false, error: `公開状態の更新に失敗しました：${upErr.message}` };

  revalidateLineupPages(lineupId);
  if (status === "draft") return { ok: false, error: "動画またはスクリーンショットを1件以上登録してください（下書きとして保存しました）" };
  return { ok: true };
}

/** 論理削除 */
export async function deleteLineup(lineupId: string): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { error } = await auth.supabase
    .from("lineups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lineupId);
  if (error) return { ok: false, error: `削除に失敗しました：${error.message}` };
  revalidateLineupPages(lineupId);
  return { ok: true };
}
