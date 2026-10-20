import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import type {
  Character,
  GameMap,
  Lineup,
  LineupFilters,
  LineupMedia,
  Purpose,
  SessionUser,
  Side,
  SkillSlot,
} from "@/types/domain";

/** 定点取得時の共通 select（関連を埋め込み） */
const LINEUP_SELECT = `
  id, title, side, start_x, start_y, land_x, land_y, aim_note, status, created_at, updated_at,
  map:maps!inner(id, slug, name_ja, name_en, minimap_path),
  character:characters!inner(id, slug, name_ja, name_en, icon_path),
  site:sites!inner(id, code),
  skill:skills!inner(id, slot, name_ja, name_en),
  lineup_purposes(purpose:purposes(id, slug, name_ja, sort_order)),
  lineup_media(id, kind, role, storage_path, mime_type, size_bytes, sort_order)
`;

export class QueryError extends Error {}

function fail(context: string, error: { message: string } | null): never {
  throw new QueryError(`${context}: ${error?.message ?? "unknown error"}`);
}

// PostgREST の生レコード → ドメイン型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLineup(row: any): Lineup {
  const purposes: Purpose[] = (row.lineup_purposes ?? [])
    .map((lp: { purpose: Purpose | null }) => lp.purpose)
    .filter(Boolean)
    .sort((a: Purpose, b: Purpose) => a.sort_order - b.sort_order);
  const media: LineupMedia[] = [...(row.lineup_media ?? [])].sort(
    (a: LineupMedia, b: LineupMedia) => a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    title: row.title,
    side: row.side,
    start_x: Number(row.start_x),
    start_y: Number(row.start_y),
    land_x: Number(row.land_x),
    land_y: Number(row.land_y),
    aim_note: row.aim_note,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    map: row.map,
    character: row.character,
    site: row.site,
    skill: row.skill,
    purposes,
    media,
  };
}

// ---------------------------------------------------------------------
// セッション
// ---------------------------------------------------------------------
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name as string) ?? (meta.name as string) ?? user.email ?? null,
    avatarUrl: (meta.avatar_url as string) ?? null,
    isAdmin: isAdmin === true,
  };
});

// ---------------------------------------------------------------------
// マスタ
// ---------------------------------------------------------------------
export const getMaps = cache(async (): Promise<GameMap[]> => {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("maps")
    .select("id, slug, name_ja, name_en, minimap_path, splash_path, sort_order, sites(id, code, sort_order)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) fail("maps", error);
  return (data ?? []).map((m) => ({
    ...m,
    sites: [...(m.sites ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  })) as GameMap[];
});

export async function getMapBySlug(slug: string): Promise<GameMap | null> {
  const maps = await getMaps();
  return maps.find((m) => m.slug === slug) ?? null;
}

export const getCharacters = cache(async (): Promise<Character[]> => {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("characters")
    .select("id, slug, name_ja, name_en, role, icon_path, sort_order, skills(id, slot, name_ja, name_en)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) fail("characters", error);
  const slotOrder: SkillSlot[] = ["C", "Q", "E", "X"];
  return (data ?? []).map((c) => ({
    ...c,
    skills: [...(c.skills ?? [])].sort(
      (a, b) => slotOrder.indexOf(a.slot as SkillSlot) - slotOrder.indexOf(b.slot as SkillSlot),
    ),
  })) as Character[];
});

export const getPurposes = cache(async (): Promise<Purpose[]> => {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("purposes").select("id, slug, name_ja, sort_order").order("sort_order");
  if (error) fail("purposes", error);
  return (data ?? []) as Purpose[];
});

// ---------------------------------------------------------------------
// 検索条件（URL クエリ）の正規化
// ---------------------------------------------------------------------
type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(params: RawParams): LineupFilters {
  const side = first(params.side);
  const skill = first(params.skill)?.toUpperCase();
  const purpose = first(params.purpose);
  return {
    agent: first(params.agent) || undefined,
    side: side === "attack" || side === "defense" ? (side as Side) : undefined,
    site: first(params.site)?.toUpperCase() || undefined,
    skill: skill && ["C", "Q", "E", "X"].includes(skill) ? (skill as SkillSlot) : undefined,
    purposes: purpose ? purpose.split(",").filter(Boolean) : [],
  };
}

// ---------------------------------------------------------------------
// 定点
// ---------------------------------------------------------------------
export async function searchLineups(map: GameMap, filters: LineupFilters): Promise<Lineup[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const [characters, purposes] = await Promise.all([getCharacters(), getPurposes()]);

  const purposeIds = purposes.filter((p) => filters.purposes.includes(p.slug)).map((p) => p.id);
  const select = purposeIds.length
    ? `${LINEUP_SELECT}, purpose_filter:lineup_purposes!inner(purpose_id)`
    : LINEUP_SELECT;

  let q = supabase
    .from("lineups")
    .select(select)
    .eq("map_id", map.id)
    .is("deleted_at", null)
    .eq("status", "published");

  const character = filters.agent ? characters.find((c) => c.slug === filters.agent) : undefined;
  if (filters.agent) {
    if (!character) return [];
    q = q.eq("character_id", character.id);
  }
  if (filters.side) q = q.eq("side", filters.side);
  if (filters.site) {
    const site = map.sites.find((s) => s.code === filters.site);
    if (!site) return [];
    q = q.eq("site_id", site.id);
  }
  if (filters.skill) {
    if (character) {
      const skill = character.skills.find((s) => s.slot === filters.skill);
      if (skill) q = q.eq("skill_id", skill.id);
    } else {
      q = q.eq("skill.slot", filters.skill);
    }
  }
  if (purposeIds.length) q = q.in("purpose_filter.purpose_id", purposeIds);

  const { data, error } = await q.order("created_at", { ascending: false }).limit(300);
  if (error) fail("lineups", error);
  return (data ?? []).map(toLineup);
}

export async function getLineup(id: string, opts: { includeDraft?: boolean } = {}): Promise<Lineup | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  let q = supabase.from("lineups").select(LINEUP_SELECT).eq("id", id).is("deleted_at", null);
  if (!opts.includeDraft) q = q.eq("status", "published");
  const { data, error } = await q.maybeSingle();
  if (error) fail("lineup", error);
  return data ? toLineup(data) : null;
}

/** 管理画面用：下書き含む全件（論理削除済みは除外） */
export async function getAdminLineups(mapSlug?: string): Promise<Lineup[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  let q = supabase.from("lineups").select(LINEUP_SELECT).is("deleted_at", null);
  if (mapSlug) q = q.eq("map.slug", mapSlug);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(500);
  if (error) fail("admin lineups", error);
  return (data ?? []).map(toLineup);
}

// ---------------------------------------------------------------------
// お気に入り
// ---------------------------------------------------------------------
export async function getFavoriteIds(userId: string | undefined): Promise<string[]> {
  if (!userId) return [];
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("favorites").select("lineup_id").eq("user_id", userId);
  if (error) fail("favorites", error);
  return (data ?? []).map((r) => r.lineup_id as string);
}

export async function getFavoriteLineups(supabaseOverride?: SupabaseClient): Promise<Lineup[]> {
  const supabase = supabaseOverride ?? (await getServerSupabase());
  if (!supabase) return [];
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, lineup:lineups!inner(${LINEUP_SELECT})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) fail("favorite lineups", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => toLineup(r.lineup));
}
