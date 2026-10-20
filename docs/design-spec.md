# VALO SET — デザイン定義書 (docs/design-spec.md)

## 1. コンセプト & トーン＆マナー

- **印象**：VALORANT公式クライアントのような「戦術的・鋭利・ストイック」。情報が整理された作戦ボード。
- **キーワード**：Tactical / Sharp / Precise / Restrained Red
- **方向性**
  - ダーク基調。赤 `#FF4655` は「選択・強調・CTA」だけに限定して使い、面積を絞る。
  - 角丸は**ほぼ0**（2px 以下）。代わりに**斜めカット（clip-path）**でブランドらしさを出す。
  - ガラスモーフィズムやネオングラデは使わない。面（Surface）と 1px ボーダーで階層を表現。
  - 装飾は「コーナーティック」「細いグリッド線」「インデックス番号（01, 02…）」など戦術UI由来のものに限る。

## 2. カラーパレット

| Token | HEX | 用途 | コントラスト（対 bg） |
|---|---|---|---|
| `--color-bg` | `#0F1923` | ページ背景 | — |
| `--color-surface` | `#16222E` | カード・パネル | — |
| `--color-surface-2` | `#1D2B38` | ホバー・入力欄 | — |
| `--color-line` | `#2A3A49` | 1px ボーダー | — |
| `--color-line-strong` | `#3C4F61` | 強調ボーダー | — |
| `--color-fg` | `#ECE8E1` | 本文（公式のオフホワイト） | 14.5:1 (AAA) |
| `--color-muted` | `#8A9AA8` | 補足テキスト | 6.3:1 (AA) |
| `--color-accent` | `#FF4655` | CTA・選択・着弾ピン | 4.9:1 (AA, 大文字) |
| `--color-accent-hover` | `#FF5C69` | CTA hover | — |
| `--color-accent-deep` | `#BD3944` | CTA active / 押下 | — |
| `--color-cyan` | `#3CE4C8` | 開始位置ピン（マップのテレポーター色と調和） | 11:1 |
| `--color-gold` | `#E8C46A` | お気に入り（★） | 10:1 |
| `--color-attack` | `#FF4655` | 攻撃バッジ | — |
| `--color-defense` | `#3CE4C8` | 防衛バッジ | — |

## 3. タイポグラフィ

| 役割 | フォント |
|---|---|
| 見出し（欧文・数字） | **Oswald**（600/700, 大文字, 字間 +0.04em）※公式 DIN Next/Tungsten に近い縦長サンセリフ |
| 本文（和文・欧文） | **Noto Sans JP**（400/500/700） |
| 等幅（座標・ID） | **JetBrains Mono** |

| Scale | size / line-height / tracking |
|---|---|
| Display | 64–96px / 0.9 / 0.01em (Oswald 700, uppercase) |
| H1 | 40px / 1.1 / 0.02em |
| H2 | 28px / 1.2 / 0.03em |
| H3 | 20px / 1.3 / 0.04em |
| Body | 15px / 1.7 / 0 |
| Small | 13px / 1.6 |
| Caption / Label | 11px / 1.4 / 0.16em (uppercase, Oswald) |

## 4. スペーシング & レイアウト

- スケール：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px（Tailwind 標準 1=4px）
- コンテナ最大幅：1440px（検索画面はフル幅）、テキストページ 1200px
- ブレークポイント：sm 640 / md 768 / **lg 1024（PC/SP 切替）** / xl 1280

## 5. コンポーネント規約

| コンポーネント | 規約 |
|---|---|
| Button Primary | bg accent / text bg色 / Oswald uppercase / 右下 8px 斜めカット（`.cut-br`）/ hover で accent-hover + 内側の白ライン左→右スライド / active accent-deep |
| Button Secondary | 透明 + 1px line-strong / hover で border fg・bg surface-2 |
| Button Ghost | テキストのみ muted → hover fg |
| Card | bg surface / 1px line / radius 0 / hover で border line-strong + 左端 2px accent バー出現 / 選択時 border accent |
| Chip（フィルタ） | 高さ 32px / 1px line / 選択時 bg accent・text bg / Oswald 12px uppercase |
| Input / Select | bg surface-2 / 1px line / focus で border accent + 外側 1px ring |
| Pin | 開始=シアン◇、着弾=レッド●、選択時に拡大＋パルスリング、両者を破線で接続 |
| Header | 高さ 64px / bg rgba(15,25,35,.85) + 下 1px line / ロゴは赤い斜めスラッシュ + "VALO SET" |
| Panel見出し | 左にインデックス番号（`01`）+ 細い横線 |

## 6. モーション

- 基本：150–250ms `cubic-bezier(.2,.7,.2,1)`
- ページ入場：要素を 8px 下から fade-up（stagger 40ms）
- ピン選択：scale 1 → 1.35 + パルス（1.2s infinite）
- `prefers-reduced-motion` でアニメーション停止

## 7. 画像アセット

| ファイル | 用途 | 出典 |
|---|---|---|
| `public/images/brand/hero.jpg` | トップのヒーロー背景 | generate_image で生成 |
| `public/images/maps/{slug}-splash.png` | マップ選択カード | ユーザー提供 `images/map/main` |
| `public/images/maps/{slug}-mini.png` | ピン表示用俯瞰図 | ユーザー提供 `images/map/mini` |
| `public/images/agents/{slug}.png` | キャラアイコン | ユーザー提供 `images/agent` |

## 8. 実装トークン

`src/app/globals.css` の `@theme` に定義（Tailwind v4）。クラス例：`bg-bg`, `bg-surface`, `border-line`, `text-muted`, `text-accent`, `font-display`。
