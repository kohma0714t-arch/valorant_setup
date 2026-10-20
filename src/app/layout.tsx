import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_JP, Oswald } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-oswald" });
const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto", preload: false });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "VALO SET — VALORANT 定点検索",
    template: "%s | VALO SET",
  },
  description:
    "VALORANTの定点（ラインナップ）をマップ上から直感的に検索。サイファー・ヴァイパー・ソーヴァ・フェイドの定点を、攻撃/防衛・サイト・スキル・用途で絞り込み、動画とスクリーンショットで再現方法を確認できます。",
  openGraph: {
    title: "VALO SET — VALORANT 定点検索",
    description: "マップから探す、VALORANTの定点共有サイト。",
    images: ["/images/brand/hero.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1923",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${oswald.variable} ${noto.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
