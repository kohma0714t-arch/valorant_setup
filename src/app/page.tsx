import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Crosshair, MapPinned, PlayCircle } from "lucide-react";
import { SetupNotice, StateMessage } from "@/components/ui/StateMessage";
import { getCharacters, getMaps } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { pad2 } from "@/lib/format";
import type { Character, GameMap } from "@/types/domain";

export default async function HomePage() {
  let maps: GameMap[] = [];
  let characters: Character[] = [];
  let failed = false;
  if (isSupabaseConfigured) {
    try {
      [maps, characters] = await Promise.all([getMaps(), getCharacters()]);
    } catch {
      failed = true;
    }
  }

  return (
    <main>
      {/* ---------- HERO ---------- */}
      <section className="relative isolate overflow-hidden border-b border-line">
        <Image
          src="/images/brand/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-right opacity-90"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
        <div className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />

        <div className="mx-auto flex min-h-[520px] max-w-[1440px] flex-col justify-center px-4 py-20 sm:px-6 lg:min-h-[600px]">
          <p className="label mb-5 flex animate-fade-up items-center gap-3 text-accent">
            <span className="h-px w-10 bg-accent" />
            Lineup Database
          </p>
          <h1 className="max-w-3xl animate-fade-up font-display text-[52px] font-bold uppercase leading-[0.92] tracking-[0.01em] [animation-delay:60ms] sm:text-7xl lg:text-[96px]">
            定点を、
            <br />
            <span className="text-accent">マップ</span>から探す。
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-[15px] leading-relaxed text-muted [animation-delay:120ms] sm:text-base">
            ピンを押せば、そこに届く定点がすぐ見つかる。キャラクター・攻防・サイト・スキル・用途で絞り込み、
            動画と照準スクリーンショットで再現手順まで確認できます。
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:180ms]">
            <Link href="#maps" id="hero-cta-maps" className="btn btn-primary cut-br">
              マップを選ぶ
              <ArrowUpRight size={16} />
            </Link>
            {isSupabaseConfigured && (
              <Link href="/favorites" id="hero-cta-favorites" className="btn btn-secondary">
                お気に入り
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- MAPS ---------- */}
      <section id="maps" className="mx-auto max-w-[1440px] scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading index="01" title="Select Map" sub="マップを選択" />

        {!isSupabaseConfigured ? (
          <SetupNotice className="mt-10" />
        ) : failed ? (
          <StateMessage variant="error" title="データを取得できませんでした" className="mt-10">
            通信状況を確認して、ページを再読み込みしてください。
          </StateMessage>
        ) : maps.length === 0 ? (
          <StateMessage title="マップが登録されていません" className="mt-10">
            <code className="font-mono">supabase/seed.sql</code> を実行してマスタデータを登録してください。
          </StateMessage>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {maps.map((m, i) => (
              <li key={m.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <MapCard map={m} index={i + 1} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="border-y border-line bg-surface/40">
        <div className="mx-auto grid max-w-[1440px] gap-px bg-line sm:grid-cols-3">
          {[
            { icon: MapPinned, t: "Pin → List", d: "マップ上のピンと一覧が連動。着弾地点から逆引きできます。" },
            { icon: Crosshair, t: "Aim Shot", d: "照準位置はゲーム内スクリーンショットで正確に確認。" },
            { icon: PlayCircle, t: "Step Video", d: "開始位置 → 照準 → 使用 → 着弾 の流れを動画で再現。" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-4 bg-bg px-6 py-8">
              <Icon className="mt-1 shrink-0 text-accent" size={22} strokeWidth={1.6} />
              <div>
                <p className="font-display text-lg font-semibold uppercase tracking-[0.06em]">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- AGENTS ---------- */}
      {characters.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading index="02" title="Agents" sub="対応キャラクター" />
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {characters.map((c) => (
              <li key={c.id} className="card group flex items-center gap-4 p-4">
                <Image
                  src={c.icon_path}
                  alt={c.name_ja}
                  width={64}
                  height={64}
                  className="size-14 border border-line bg-surface-2 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold uppercase tracking-[0.06em]">{c.name_en}</p>
                  <p className="text-sm text-muted">{c.name_ja}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted/80">{c.skills.map((s) => s.slot).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function SectionHeading({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div className="flex items-end gap-5">
      <span className="font-mono text-sm text-accent">{index}</span>
      <div className="flex-1">
        <h2 className="font-display text-3xl font-bold uppercase tracking-[0.03em] sm:text-4xl">{title}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
      <span className="mb-3 hidden h-px flex-1 bg-line sm:block" />
    </div>
  );
}

function MapCard({ map, index }: { map: GameMap; index: number }) {
  return (
    <Link
      href={`/maps/${map.slug}`}
      id={`map-card-${map.slug}`}
      className="card card-interactive group block overflow-hidden"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={map.splash_path}
          alt={`${map.name_ja}（${map.name_en}）`}
          fill
          sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-[var(--ease-tactical)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
        <span className="absolute left-3 top-3 bg-bg/80 px-2 py-0.5 font-mono text-[11px] text-muted backdrop-blur">
          {pad2(index)}
        </span>
        <Image
          src={map.minimap_path}
          alt=""
          width={72}
          height={72}
          className="absolute right-3 top-3 size-16 opacity-0 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)] transition-opacity duration-300 group-hover:opacity-90"
        />
      </div>
      <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-1">
        <div>
          <p className="font-display text-3xl font-bold uppercase leading-none tracking-[0.04em]">{map.name_en}</p>
          <p className="mt-1.5 text-sm text-muted">{map.name_ja}</p>
        </div>
        <div className="flex items-center gap-1">
          {map.sites.map((s) => (
            <span key={s.id} className="grid size-6 place-items-center border border-line-strong font-display text-xs">
              {s.code}
            </span>
          ))}
          <ArrowUpRight
            size={18}
            className="ml-2 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          />
        </div>
      </div>
    </Link>
  );
}
