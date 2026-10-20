import { z } from "zod";
import { MEDIA_LIMITS } from "@/lib/format";

const coord = z.number().min(0).max(1);
const uuid = z.string().uuid();

/** 管理者：定点保存の入力 */
export const lineupInputSchema = z.object({
  id: uuid.optional(),
  title: z
    .string()
    .trim()
    .max(80, "タイトルは80文字以内で入力してください")
    .optional()
    .transform((v) => (v ? v : null)),
  mapId: uuid,
  characterId: uuid,
  side: z.enum(["attack", "defense"]),
  siteId: uuid,
  skillId: uuid,
  purposeIds: z.array(uuid).max(10),
  start: z.object({ x: coord, y: coord }),
  land: z.object({ x: coord, y: coord }),
  aimNote: z
    .string()
    .trim()
    .max(200, "照準メモは200文字以内で入力してください")
    .optional()
    .transform((v) => (v ? v : null)),
});

export type LineupInput = z.input<typeof lineupInputSchema>;

/** 管理者：アップロード済みメディアの登録 */
export const mediaInputSchema = z
  .object({
    storagePath: z.string().regex(/^lineups\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm|png|jpg|jpeg|webp)$/i),
    kind: z.enum(["video", "image"]),
    role: z.enum(["execution", "aim", "other"]),
    mimeType: z.string(),
    sizeBytes: z.number().int().positive(),
    sortOrder: z.number().int().min(0),
  })
  .superRefine((m, ctx) => {
    const limit = MEDIA_LIMITS[m.kind];
    if (!limit.mimes.includes(m.mimeType)) {
      ctx.addIssue({ code: "custom", message: `対応していないファイル形式です（${limit.label}）` });
    }
    if (m.sizeBytes > limit.maxBytes) {
      ctx.addIssue({ code: "custom", message: `ファイルサイズが上限を超えています（${limit.label}）` });
    }
  });

export type MediaInput = z.input<typeof mediaInputSchema>;
