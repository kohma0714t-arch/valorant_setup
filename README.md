# VALO SET (VALORANT 定点共有Webアプリケーション)

VALORANTにおけるキャラクターごとの定点情報を、ミニマップを中心とした直感的な操作で検索・閲覧できるWebアプリケーションです。

---

## 🛠 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイリング**: Tailwind CSS v4
- **バックエンド / DB**: Supabase (PostgreSQL, Row Level Security, Supabase Auth, Supabase Storage)
- **アイコン**: Lucide React
- **バリデーション**: Zod

---

## 🚀 セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します：

```bash
cp .env.example .env.local
```

`.env.local` の内容：
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Supabase のセットアップ

1. [Supabase](https://supabase.com) で新規プロジェクトを作成します。
2. **SQL Editor** を開き、以下のSQLスクリプトを順番に実行します：
   - `supabase/migrations/0001_init.sql`（テーブル、RLSポリシー、Storageバケット、トリガー）
   - `supabase/seed.sql`（マップ・サイト・エージェント・スキル・用途のマスタデータ）
3. **Authentication 設定**:
   - Supabaseダッシュボードの **Authentication → Providers → Google** を有効化します（Google Cloud Console で OAuth Client ID / Secret を発行して設定）。
   - **Redirect URLs** に `http://localhost:3000/auth/callback`（本番ではデプロイ先URL）を追加します。
4. **管理者権限の付与**:
   - Googleログイン後、Supabaseの SQL Editor で自身のユーザーIDを `admins` テーブルに登録します：
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'your-email@gmail.com';
     ```

### 4. ローカル開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 5. ビルド & 型チェック

```bash
npm run typecheck
npm run build
```

---

## 🌟 主な機能

1. **マップ連動検索 (`/maps/[slug]`)**
   - ミニマップ上の着弾ピンと右ペインの定点一覧がリアルタイム連動。
   - エージェント、攻防（ATTACK / DEFENSE）、サイト（A / B / C）、スキル（C / Q / E / X）、用途タグ（#索敵, #解除阻止 など）による多角的な絞り込み。
   - PCでは左右分割、モバイルでは「MAP VIEW / LINEUPS」タブ切替＋ボトムシート詳細。
2. **定点詳細 & メディアギャラリー (`/lineups/[id]`)**
   - 再現手順動画（mp4/webm）および照準ゲーム内スクリーンショットの閲覧。
   - 開始位置・着弾位置の座標（%）および照準メモの表示。
3. **お気に入り機能 (`/favorites`)**
   - Googleログインユーザーはワンクリックでお気に入りを登録・解除・一覧確認。
4. **管理者定点登録・管理 (`/admin`)**
   - マップ上のクリックで直感的に開始位置・着弾位置を指定できる座標ピッカー。
   - 動画（≤50MB）および画像（≤5MB）の直接アップロード。
   - 論理削除（非表示）による安全なデータ管理。

---

## 📁 ディレクトリ構成

```text
valo_set/
├── docs/
│   ├── spec.md               # 実装設計書
│   └── design-spec.md        # デザイン定義書
├── public/
│   └── images/               # 静的画像アセット（マップ、エージェント、ブランド）
├── src/
│   ├── app/
│   │   ├── admin/            # 管理者用画面（定点一覧・新規登録・編集）
│   │   ├── auth/             # 認証ルート（callback, signout）
│   │   ├── favorites/        # お気に入り一覧画面
│   │   ├── lineups/[id]/     # 定点パーマリンク詳細画面
│   │   ├── login/            # ログイン画面
│   │   ├── maps/[slug]/      # マップ別定点検索画面
│   │   ├── globals.css       # Tailwind v4 デザイントークン
│   │   ├── layout.tsx        # ルートレイアウト
│   │   └── page.tsx          # トップページ
│   ├── components/
│   │   ├── admin/            # 管理者用フォーム・テーブル
│   │   ├── auth/             # 認証ボタン
│   │   ├── layout/           # ヘッダー・フッター・ロゴ
│   │   ├── lineup/           # マップボード・カード・フィルタ・ギャラリー
│   │   └── ui/               # 汎用ステートメッセージ
│   ├── lib/
│   │   ├── actions/          # Server Actions (admin, favorites)
│   │   ├── supabase/         # Supabase Client, Server, Proxy
│   │   ├── format.ts         # フォーマット・ラベルヘルパー
│   │   ├── queries.ts        # データ取得クエリ
│   │   └── validation.ts     # Zod バリデーション
│   ├── types/
│   │   └── domain.ts         # ドメイン型定義
│   └── proxy.ts              # Next.js 16 Proxy（セッション更新）
├── supabase/
│   ├── migrations/           # DBマイグレーションSQL
│   └── seed.sql              # マスタデータseed
└── valo_specification.md     # 元仕様書
```
