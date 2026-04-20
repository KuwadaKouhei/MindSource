# MindSource デプロイガイド

MindSource は **Next.js アプリ** + **y-websocket collab サーバー** の2プロセス構成です。
本番運用では別々にホスティングします。

```text
[ブラウザ] ──▶ Vercel (Next.js + /api/word proxy) ──▶ word-api (chiVe)
    │                      │
    │                      ▼
    │                   Supabase (Auth + Postgres + RLS)
    ▼
wss://collab.example.com (y-websocket + y-leveldb on Fly.io / Render)
```

## 1. Supabase（共通）

1. [supabase.com](https://supabase.com/) で新規プロジェクト作成。
2. **SQL Editor** で順番に実行（番号順を守ってください）:
   - `supabase/migrations/0001_init.sql` — テーブル・RLS・既定ユーザ設定行の自動作成
   - `supabase/migrations/0002_ring_gaps.sql` — `user_settings.ring_gaps` カラム追加
   - `supabase/migrations/0003_default_layout_hierarchical.sql` — 既定レイアウトを樹形図に
   - `supabase/migrations/0004_ring_gaps_wider.sql` — ring_gaps の既定を `[120, 80]` に
3. **Authentication → Providers**:
   - **Email** を有効化
   - **Google** を使う場合: GCP コンソールで OAuth クライアント作成 → Supabase に Client ID / Secret を登録
4. **Authentication → URL Configuration**:
   - Site URL: `https://<your-vercel-domain>`
   - Redirect URLs に `https://<your-vercel-domain>/callback` を追加
5. **Project Settings → API** から下記を控える:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 2. word-api

先に word-api 側を稼働させ、エンドポイントを確定しておきます。

- 同リポジトリの `../word-api` を参照: `docker compose up` でローカルに立てるか、本番 URL を控える
- `/v1/ready` が `200 OK` を返すこと、`X-API-Key` ヘッダで認証できることを `curl` で確認:

  ```bash
  curl -H "X-API-Key: <YOUR_KEY>" \
    "https://<word-api-host>/v1/related?word=猫&top_k=3"
  ```

## 3. Next.js アプリ（Vercel）

### 初回セットアップ

```bash
cd d:/training2/mindsource

# Vercel CLI をインストール済みでないなら
npm i -g vercel

# GitHub 連携でプロジェクトを作成するなら Vercel ダッシュボードから
# Import Repository → KuwadaKouhei/MindSource を選ぶのが簡単
# CLI でやるなら:
vercel link
```

### 環境変数

Vercel ダッシュボード → Project → Settings → **Environment Variables** で
以下を **Production** と **Preview** 両方に登録:

| 変数 | 例 | 備考 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | anon public でOK、フロントから直接読む |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | 同上 |
| `WORD_API_BASE_URL` | `https://word-api.example.com` | サーバー側のみ |
| `WORD_API_KEY` | `prod-key-xxx` | **非公開** |
| `NEXT_PUBLIC_COLLAB_WS_URL` | `wss://mindsource-collab.fly.dev` | TLS (`wss://`) 必須 |

CLI で登録する場合:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add WORD_API_BASE_URL production
vercel env add WORD_API_KEY production
vercel env add NEXT_PUBLIC_COLLAB_WS_URL production
# Preview にも同じ値で登録する（CLI なら `production` を `preview` に変えて再実行）
```

### デプロイ

```bash
vercel deploy --prod
```

GitHub 連携が有効なら `main` への push で自動デプロイが走ります。
ビルドの typecheck/build は `.github/workflows/ci.yml` でも走るので PR 時点で確認可能。

## 4. collab-server（独立プロセス）

y-websocket は Vercel では動かせないので、別のホストに置きます。
永続化に `y-leveldb` を使うので **永続ボリューム** が必要です。

### Fly.io の例

```bash
cd collab-server
cp fly.toml.example fly.toml
# fly.toml の app / CLIENT_ORIGIN を書き換え (CLIENT_ORIGIN = Vercel のドメイン)

flyctl launch --copy-config --no-deploy
flyctl volumes create collab_data --size 1 --region nrt
flyctl secrets set CLIENT_ORIGIN="https://<your-vercel-domain>"
flyctl deploy
```

- 発行された `wss://<app>.fly.dev` を `NEXT_PUBLIC_COLLAB_WS_URL` にセット
- デプロイ後に Vercel の env を更新 → 再デプロイ

### Docker で手動運用

```bash
docker build -t mindsource-collab ./collab-server
docker run -d --name mindsource-collab \
  -p 1234:1234 \
  -v $(pwd)/collab-data:/data \
  -e CLIENT_ORIGIN=https://<your-vercel-domain> \
  mindsource-collab
```

リバースプロキシ（Caddy / nginx / Cloudflare Tunnel）で TLS 化し、`wss://` ドメインを `NEXT_PUBLIC_COLLAB_WS_URL` に指定します。

### Render（無料プラン、カード不要、Blueprint で一発）

このリポジトリには `render.yaml` (Blueprint) が含まれており、ダッシュボードだけで
デプロイできます。**既定は Free プラン** なのでカード情報は不要です。

1. [render.com](https://render.com/) でアカウント作成・GitHub 連携（カード要求なし）
2. **New → Blueprint** を選び、`KuwadaKouhei/MindSource` リポジトリを接続
3. Render が `render.yaml` を検出して内容を表示するので **Create New Resources**
4. 作成後の Service ページ → **Environment** → `CLIENT_ORIGIN` を
   `https://mindsource.vercel.app` に設定 → Save
5. 自動ビルド & デプロイが走り、URL が発行される（例: `https://mindsource-collab.onrender.com`）
6. **Vercel** 側で:

   ```powershell
   cd d:\training2\mindsource
   npx vercel env rm NEXT_PUBLIC_COLLAB_WS_URL production
   echo "wss://mindsource-collab.onrender.com" | npx vercel env add NEXT_PUBLIC_COLLAB_WS_URL production
   npx vercel deploy --prod
   ```

Free プランのトレードオフ:

- **永続ディスクなし**: `y-leveldb` のデータは再起動で消えます。MindSource はクライアントが
  2秒デバウンスで Supabase にスナップショット JSON を PUT しているので、マップ本体は
  保全されます。再起動中に飛んだ編集履歴だけ（undo の深さ）が短くなる程度の影響です。
- **15分アイドルでスリープ**: 久しぶりのアクセスは初回 30 秒ほど待つ必要あり。
  編集中は常に ws で通信するのでスリープには入りません。

常時稼働・永続化が必要になったら `render.yaml` の `plan: free` を `plan: starter`
($7/月) に変更し、コメントアウトしてある `disk:` ブロックを有効化して push してください。

### Railway

- Build command: `npm ci --prefix collab-server`
- Start command: `npx tsx collab-server/src/index.ts`
- Persistent Disk を `/data` にマウント
- `CLIENT_ORIGIN` 環境変数を設定

## 5. 動作確認チェックリスト（本番）

- [ ] `/` がロードでき、ヘッダーが表示される
- [ ] Email マジックリンク / Google OAuth でログインできる
- [ ] `/me` で自分の **User ID** が確認できる、表示名を変更できる
- [ ] `/maps/local/<id>` の匿名エディタでノードを追加・編集できる
- [ ] 自動生成（cascade）時に `/api/word/cascade` が 200 を返す（Network タブで確認）
- [ ] 2タブ（または別ブラウザ）で同じマップを開く → **リモートカーソルが見える**、編集がリアルタイム反映
- [ ] 保存版マップのツールバー「**メンバー**」から UUID でコラボレーター追加ができる
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` で undo/redo
- [ ] ツールバー **☰ ツリー** で左サイドにツリーが開く
- [ ] 設定画面で **カラースキーム** を切り替える → ノード色が変わる
- [ ] PNG / SVG エクスポート
- [ ] word-api を停止して cascade 実行 → 赤いトーストでエラー表示

## 6. 運用メモ

- **snapshot フラッシュ**: `beforeunload` / `pagehide` で `sendBeacon`。急ぎの unload でも基本届くが、モバイル Safari の backgrounding では稀に落ちるので、頻繁に保存が必要な運用なら将来的にサーバー側で Y.Doc をそのまま受け取る実装に切り替える余地あり
- **y-websocket 単独構成**は 1 プロセス前提。同時接続が増えて詰まるようなら Redis pub/sub + 複数レプリカ構成に拡張
- word-api の本番 EC2 は断続稼働の想定。定常稼働が必要なら Cloud Run / ECS Fargate へ移行（README参照）
