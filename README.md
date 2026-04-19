# MindSource

連想語をつなげていくマインドマップ作成Webアプリ。

- 手動モードと自動モード(word-apiを使った連想語の自動生成)
- 匿名でも作成・編集可能、保存はログイン必須
- 複数人リアルタイム共同編集(Yjs + y-websocket)
- PNG / SVG エクスポート

## 技術スタック

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Supabase (Auth + Postgres + RLS) — 認証・マインドマップのスナップショット保存
- React Flow (`@xyflow/react`) — マップ描画・編集
- ELK.js — レイアウト(階層/放射)
- Yjs + y-websocket — リアルタイムコラボ(独立 collab-server)
- html-to-image — PNG/SVGエクスポート
- 連想語API: 隣の `../word-api` をプロキシ経由で利用(X-API-Keyは秘匿)

## セットアップ

### 1. 依存インストール

```bash
cd d:/training2/mindsource
npm install
cd collab-server && npm install && cd ..
```

### 2. Supabase プロジェクト

1. [supabase.com](https://supabase.com/) で新規プロジェクト作成
2. SQL Editor で `supabase/migrations/0001_init.sql` を実行
3. Authentication → Providers で Email を有効化
   - Redirect URL に `http://localhost:3000/callback` を追加

### 3. `.env.local`

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# word-api (同リポジトリの ../word-api を立てる or 本番エンドポイント)
# ローカル: ../word-api で docker compose up
WORD_API_BASE_URL=http://localhost:8000
WORD_API_KEY=dev-key-1
# 本番: WORD_API_BASE_URL=https://13-193-92-78.nip.io (断続稼働)

NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:1234
```

### 4. 起動

```bash
# Next.js + collab-server を同時起動
npm run dev:collab
```

- Next: <http://localhost:3000>
- collab-server: `ws://localhost:1234`

Next.jsだけ起動する場合:

```bash
npm run dev
```

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                  # Home
│   ├── (auth)/login, callback
│   ├── me                        # マイページ
│   ├── settings                  # 自動生成の設定
│   ├── maps/new                  # 新規マップ→リダイレクト
│   ├── maps/[id]                 # 保存済みエディタ
│   ├── maps/local/[localId]      # 匿名ドラフトエディタ
│   └── api/
│       ├── word/{related,cascade}  # word-api プロキシ
│       ├── maps/...                 # マップCRUD
│       └── settings                 # ユーザ設定
├── components/
│   ├── editor/   # Canvas, Toolbar, NodeInspector, PresenceBar, EditorClient
│   ├── flow/     # WordNode (カスタムノード)
│   ├── layout/   # LayoutRunner (ELK)
│   ├── home/, settings/, me/, ui/
├── lib/
│   ├── supabase/      # ssr helpers
│   ├── word-api/      # server (key付与) / client / types
│   ├── yjs/           # doc, binding, provider
│   ├── storage/       # localDraft (IndexedDB)
│   ├── settings/      # schema + defaults
│   └── flow/          # cascade/related → React Flow 変換
├── hooks/ useMindmap, useAutoGen, useSettings
└── middleware.ts     # Supabase セッション自動更新
collab-server/
└── src/index.ts      # y-websocket + y-leveldb 永続化
supabase/
└── migrations/0001_init.sql
```

## 仕組み

### マインドマップの状態

- **Yjs Y.Doc がライブ状態の権威**。`Y.Map<nodeId, Node>` と `Y.Map<edgeId, Edge>` にノード/エッジを格納。
- React Flow は `onNodesChange/onEdgesChange` で Y.Doc を更新し、Y.Doc の observer で React state を書き戻す。
- 一括挿入(自動生成)も同じ `ydoc.transact` で行うため、ローカルと同期が1本化される。

### 永続化

- **ログイン時**: Y.Doc は y-websocket 経由で他クライアントと同期、2秒デバウンスでクライアントから `/api/maps/[id]/snapshot` に JSON を PUT。
- **匿名時**: 同じく Y.Doc はメモリに持ち、2秒デバウンスで IndexedDB (idb-keyval) に保存。
- collab-server 側は `y-leveldb` で独自に永続化し、再起動後も state を保つ。

### 自動生成

- **cascade**: 起点1語 → `/v1/cascade` → DAG 全体を一括取得 → ELKレイアウト → Y.Docに上書き。
- **expand**: 選択ノード or ダブルクリック → `/v1/related` → 既存語を除外して1世代追加。
- どちらも `src/hooks/useAutoGen.ts`。

### 共同編集

- room id = `mindmaps.id`(保存済) or `local:<nanoid>`(匿名)。
- カーソル等の presence は awareness で配信、`PresenceBar` がアバターを表示。

### 匿名→ログイン移行

- 匿名下書きは IDB に `mindsource:draft:<localId>` で保存。
- ログイン後に `/me` を開くと `DraftImporter` が表示され、一括取り込み or 破棄を選べる。

## 動作確認シナリオ

1. `npm run dev:collab` で両プロセス起動
2. `/` のトップから「ログインなしで試す」→ 匿名エディタが開く
3. ツールバーに「猫」を入れて `自動生成 (cascade)` → DAGが描画される
4. ノードを右パネルで編集、子ノード追加、削除、線の接続
5. メールでログイン → `/me` に「ローカルドラフトが N 件あります」→ 取り込み → 保存版として管理
6. 共有URLを別ブラウザで開く → カーソルが見え、編集が即時反映
7. 設定画面で閾値やレイアウトを変えて cascade 再実行
8. PNG / SVG エクスポート

## 本番デプロイ(概要)

- Next app: Vercel に deploy。env に `NEXT_PUBLIC_SUPABASE_*`, `WORD_API_*`, `NEXT_PUBLIC_COLLAB_WS_URL` を登録。
- collab-server: Fly.io / Render / VPS に常駐。TLS背後で `wss://` 化、`CLIENT_ORIGIN` を Vercel ドメインに。永続ボリュームに `data/` をマウント。
- Supabase: Auth の Redirect URL を本番ドメインに追加。

## 既知の制約

- word-api の本番エンドポイントは断続稼働(README 参照)。開発時はローカル `http://localhost:8000` が安定。
- y-websocket 単独構成は1プロセス前提。スケールアウト時は Redis アダプタ等が必要。
- snapshot 同期はクライアント任せ、2秒デバウンス。タブを素早く閉じた場合、最新がDBに届かないことがあり得る。
