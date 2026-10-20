/** ドメイン型（docs/spec.md §3 に対応） */

export type Side = "attack" | "defense";
export type SkillSlot = "C" | "Q" | "E" | "X";
export type MediaKind = "video" | "image";
export type MediaRole = "execution" | "aim" | "other";
export type LineupStatus = "draft" | "published";

export interface Site {
  id: string;
  code: string;
  sort_order: number;
}

export interface GameMap {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  minimap_path: string;
  splash_path: string;
  sort_order: number;
  sites: Site[];
}

export interface Skill {
  id: string;
  slot: SkillSlot;
  name_ja: string;
  name_en: string;
}

export interface Character {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  role: string;
  icon_path: string;
  sort_order: number;
  skills: Skill[];
}

export interface Purpose {
  id: string;
  slug: string;
  name_ja: string;
  sort_order: number;
}

export interface LineupMedia {
  id: string;
  kind: MediaKind;
  role: MediaRole;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
}

export interface Lineup {
  id: string;
  title: string | null;
  side: Side;
  start_x: number;
  start_y: number;
  land_x: number;
  land_y: number;
  aim_note: string | null;
  status: LineupStatus;
  created_at: string;
  updated_at: string;
  map: Pick<GameMap, "id" | "slug" | "name_ja" | "name_en" | "minimap_path">;
  character: Pick<Character, "id" | "slug" | "name_ja" | "name_en" | "icon_path">;
  site: Pick<Site, "id" | "code">;
  skill: Skill;
  purposes: Purpose[];
  media: LineupMedia[];
}

export interface LineupFilters {
  agent?: string; // character slug
  side?: Side;
  site?: string; // site code
  skill?: SkillSlot;
  purposes: string[]; // purpose slugs
}

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}
