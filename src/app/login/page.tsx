import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { StateMessage } from "@/components/ui/StateMessage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = {
  title: "ログイン",
  description: "VALO SET にログインしてお気に入り定点を保存・管理します。",
};

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="card tick-corners p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="label text-accent">ACCOUNT AUTHENTICATION</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-fg sm:text-3xl">
            VALO<span className="text-accent">/</span>SET LOGIN
          </h1>
          <p className="text-xs text-muted">
            Googleアカウントでログインすると、定点のお気に入り登録やパーソナライズ機能が利用可能になります。
          </p>
        </div>

        {error === "auth_failed" && (
          <div role="alert" className="border border-accent/40 bg-accent/10 p-3 text-xs text-accent">
            認証に失敗しました。もう一度お試しください。
          </div>
        )}

        {!isSupabaseConfigured ? (
          <StateMessage variant="setup" title="SUPABASE 未設定" />
        ) : (
          <div className="space-y-4">
            <GoogleSignInButton next={next} />

            <div className="space-y-2 border-t border-line/60 pt-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-gold" />
                <span>お気に入り定点の同期・管理</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-cyan" />
                <span>管理者権限による定点データの編集・登録</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-line">
          <Link href="/" className="btn btn-ghost btn-sm text-xs">
            <ArrowLeft size={14} />
            <span>トップページに戻る</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
