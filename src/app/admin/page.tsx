import { AdminLineupList } from "@/components/admin/AdminLineupList";
import { getAdminLineups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const lineups = await getAdminLineups().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-fg">
            REGISTERED LINEUPS
          </h2>
          <p className="text-xs text-muted">
            登録済み定点：合計 {lineups.length} 件（論理削除されたものは非表示）
          </p>
        </div>
      </div>

      <AdminLineupList initialLineups={lineups} />
    </div>
  );
}
