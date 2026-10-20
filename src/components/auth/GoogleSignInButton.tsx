"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    try {
      setLoading(true);
      setError(null);
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setError("Supabase環境変数が設定されていません");
        setLoading(false);
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message ?? "予期せぬエラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        id="google-signin-btn"
        onClick={handleSignIn}
        disabled={loading}
        className="btn btn-secondary w-full justify-center gap-3 border-line-strong hover:border-fg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9c0-.4 0-.8 0-1.2z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 6.4 10.4 6.4z"
          />
        </svg>
        <span>{loading ? "CONNECTING..." : "GOOGLE でログイン"}</span>
      </button>

      {error && (
        <p role="alert" className="text-center text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
