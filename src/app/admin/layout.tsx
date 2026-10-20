import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getSessionUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "管理者コンソール",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-[1200px] p-6">
        <div className="card p-8 text-center space-y-3">
          <p className="font-display text-lg text-accent">SUPABASE NOT CONFIGURED</p>
          <p className="text-sm text-muted">.env.local を設定してください。</p>
        </div>
      </main>
    );
  }

  const user = await getSessionUser().catch(() => null);

  // 未ログインまたは非管理者へのガード
  if (!user || !user.isAdmin) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="card tick-corners p-8 space-y-4">
          <span className="grid size-12 place-items-center border border-accent bg-accent/10 text-accent mx-auto">
            <ShieldAlert size={24} />
          </span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-fg">
            ACCESS DENIED
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            このエリアは管理者権限（<code className="font-mono text-fg">admins</code> テーブルへの登録）を持つアカウントのみアクセス可能です。
          </p>
          <div className="pt-2">
            <Link href="/" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} />
              <span>トップに戻る</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center bg-accent text-bg font-display font-bold text-xs">
            ADM
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-fg">
              ADMIN CONSOLE
            </h1>
            <p className="text-xs text-muted">
              定点マスタ・データ管理（Admin: {user.name}）
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="btn btn-ghost btn-sm text-xs">
            定点一覧
          </Link>
          <Link href="/admin/lineups/new" className="btn btn-primary btn-sm cut-br text-xs">
            + 定点新規登録
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
