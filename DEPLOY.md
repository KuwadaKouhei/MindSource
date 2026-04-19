# MindSource デプロイガイド

MindSource は **Next.js アプリ** + **y-websocket collab サーバー** の2プロセス構成です。
本番運用では別々にホスティングします。

## 1. Supabase（共通）

1. [supabase.com](https://supabase.com/) で新規プロジェクト作成。
2. **SQL Editor** で順番に実行:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_ring_gaps.sql`
   - `supabase/migrations/0003_default_layout_hierarchical.sql`
   - `supabase/migrations/0004_ring_gaps_wider.sql`
3. **Authentication → Providers**:
   - Email を有効化。
   - Google を使う場合: GCP コンソールで OAuth クライアント作成 → Supabase に Client ID / Secret を登録。
4. **Authentication → URL Configuration**:
   - Site URL: `https://<your-vercel-domain>`
   - Redirect URLs に `https://<your-vercel-domain>/callback` を追加。

## 2. Next.js アプリ（Vercel）

```bash
# ルートディレクトリで
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add WORD_API_BASE_URL         # ex: https://word-api.example.com
vercel env add WORD_API_KEY              # ブラウザには見せない
vercel env add NEXT_PUBLIC_COLLAB_WS_URL # ex: wss://collab.example.com
vercel deploy --prod
```

## 3. collab-server（独立プロセス）

### Fly.io の例

```bash
cd collab-server
cp fly.toml.example fly.toml
# fly.toml の app / CLIENT_ORIGIN を書き換え
flyctl launch --copy-config --no-deploy
flyctl volumes create collab_data --size 1
flyctl deploy
```

- `CLIENT_ORIGIN` は Vercel のドメイン（例: `https://your-mindsource.vercel.app`）。
- 永続ボリュームを `/data` にマウントすることで y-leveldb の状態が保存されます。
- TLS で `wss://` 化されたドメインを `NEXT_PUBLIC_COLLAB_WS_URL` に指定してください。

### Docker で手動運用する場合

```bash
docker build -t mindsource-collab ./collab-server
docker run -d --name mindsource-collab \
  -p 1234:1234 \
  -v $(pwd)/collab-data:/data \
  -e CLIENT_ORIGIN=https://your-mindsource.vercel.app \
  mindsource-collab
```

リバースプロキシ（Caddy / nginx / Cloudflare Tunnel）で `wss://` を張ってください。

## 4. word-api

[d:/training2/word-api](../word-api/README.md) の手順でデプロイ済みのエンドポイントを
`WORD_API_BASE_URL` に入れます。`/v1/ready` が 200 を返すか確認してください。

## 5. 動作確認チェックリスト

- `/` がロードできる
- ログインできる（Email マジックリンク / Google）
- `/maps/local/<id>` の匿名エディタで描画できる
- 自動生成（cascade）で word-api に届いているか（Network タブ）
- 2タブ開いて共同編集 → カーソルと更新が届く
- PNG / SVG エクスポート
