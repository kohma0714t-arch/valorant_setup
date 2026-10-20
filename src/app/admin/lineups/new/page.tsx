import { LineupForm } from "@/components/admin/LineupForm";
import { getCharacters, getMaps, getPurposes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewLineupPage() {
  const [maps, characters, purposes] = await Promise.all([
    getMaps(),
    getCharacters(),
    getPurposes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-fg">
          NEW LINEUP REGISTRATION
        </h2>
        <p className="text-xs text-muted">
          マップ・エージェント・攻防・スキル・開始位置・着弾位置および動画/画像を指定して定点を登録します。
        </p>
      </div>

      <LineupForm maps={maps} characters={characters} purposes={purposes} />
    </div>
  );
}
