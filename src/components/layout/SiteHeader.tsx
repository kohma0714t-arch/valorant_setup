import Link from "next/link";
import { LogIn, LogOut, Shield, Star } from "lucide-react";
import { getSessionUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const user = isSupabaseConfigured ? await getSessionUser().catch(() => null) : null;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex" aria-label="メイン">
            <Link href="/#maps" id="nav-maps" className="label transition-colors hover:text-fg">
              Maps
            </Link>
            {user && (
              <Link href="/favorites" id="nav-favorites" className="label transition-colors hover:text-fg">
                Favorites
              </Link>
            )}
            {user?.isAdmin && (
              <Link href="/admin" id="nav-admin" className="label text-accent transition-colors hover:text-accent-hover">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/favorites"
                id="header-favorites"
                className="btn btn-ghost btn-sm md:hidden"
                aria-label="お気に入り"
              >
                <Star size={16} />
              </Link>
              {user.isAdmin && (
                <Link href="/admin" id="header-admin" className="btn btn-ghost btn-sm text-accent md:hidden" aria-label="管理">
                  <Shield size={16} />
                </Link>
              )}
              <div className="flex items-center gap-2.5 border-l border-line pl-3">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    referrerPolicy="no-referrer"
                    className="size-7 border border-line-strong object-cover"
                  />
                ) : (
                  <span className="grid size-7 place-items-center border border-line-strong font-display text-xs">
                    {(user.name ?? "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[140px] truncate text-sm text-muted lg:inline">{user.name}</span>
                <form action="/auth/signout" method="post">
                  <button type="submit" id="header-signout" className="btn btn-ghost btn-sm" aria-label="ログアウト">
                    <LogOut size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            isSupabaseConfigured && (
              <Link href="/login" id="header-login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
