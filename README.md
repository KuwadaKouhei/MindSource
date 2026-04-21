# MindSource

連想語をつなげていくマインドマップ作成 Web アプリ。

- 手動モードと、relation-word-api による連想語の自動生成モード
- 匿名でも作成・編集可能、ログインすれば Supabase に保存
- 複数人リアルタイム共同編集（Yjs + y-websocket、ライブカーソル付き）
- ツリー表示、undo/redo、PNG / SVG エクスポート

リポジトリ: <https://github.com/KuwadaKouhei/MindSource>

---

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **認証・DB**: Supabase (Email マジックリンク / Google OAuth, Postgres + RLS)
- **マップ描画**: React Flow (`@xyflow/react`) + カスタム `WordNode`
- **レイアウト**: ELK.js（階層/放射の2モード、世代別の間隔スライダー）
- **共同編集**: Yjs CRDT + `y-websocket`（独立 `collab-server` プロセス、永続化は `y-leveldb`）
- **リモートカーソル**: Yjs awareness
- **画像エクスポート**: `html-to-image` (PNG / SVG)
- **連想語 API**: 隣接プロジェクト `../relation-word-api` (chiVe) を Next の API ルート経由でプロキシ（`X-API-Key` は秘匿）

---

## 機能

### 作成フロー

- Home の「+ 新しいマインドマップ」「ログインなしで試す」からモーダル起動 → タイトルと **起点ワード** を入力して作成
- 起点ワードを入れるとエディタ起動直後に relation-word-api の `/v1/cascade` を呼んで樹形図を一括生成

### エディタ

- ドラッグで配置、ツールバー左の **☰ ツリー** でサイドに階層ツリー表示（検索・折り畳み対応）
- **ノードをダブルクリックでラベル編集**（Enter 確定 / Esc キャンセル）
- 右パネルから「子を追加」「連想を追加（1世代 expand）」「削除」（削除前に確認ダイアログ）
- **Undo / Redo**: ツールバー ↶ / ↷、ショートカット `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`（Yjs `UndoManager`）
- **再レイアウト**ボタンで設定に基づき全体配置をやり直し
- PNG / SVG エクスポート（`html-to-image`）
- **共有**ボタンで URL をクリップボードへ（同じ URL を開くとリアルタイム共同編集）

### 共同編集

- `y-websocket` + `y-leveldb` で CRDT 同期、切断中の編集もあとでマージ
- **ライブカーソル**: 他ユーザーのマウス位置を色付き矢印 + 表示名で可視化
- PresenceBar: 参加ユーザーのアバターを重ねて表示

### 自動生成

- **cascade**: 起点1語から `/v1/cascade` で DAG 一括取得 → ELK レイアウト → Y.Doc に適用
- **expand**: 選択ノード or 右パネルから `/v1/related` で1世代追加、既存語を自動除外
- 両モードとも `depth`, `top_k`, `min_score`, `pos`（品詞）, `exclude`, `use_stopwords`, `max_nodes` を設定画面で調整

### 設定（`/settings`）

- 自動モード: cascade / expand
- レイアウト: **樹形図 (hierarchical)** / 放射状 (radial)
- **世代間の距離**: 第2世代 / 第3世代以降 をそれぞれスライダー調整
- **カラースキーム**: default / cool / warm / vivid（ノード/ツリー/ミニマップに反映）
- 類似度閾値・品詞フィルタ・除外語リスト
- ログイン中は Supabase に保存、匿名時は localStorage

### アカウント

- Email マジックリンク / **Google OAuth**（Supabase 側で有効化したとき）
- `/me` でプロフィール編集（表示名 / アバター URL）と User ID 確認
- 匿名で作った下書きをログイン後にインポート（`/me` の DraftImporter）
- ログアウト時に匿名下書きを残すか削除するかを選べる
- **コラボレーター管理**: 保存版マップのツールバー「メンバー」→ UUID 指定で editor/viewer を追加・削除

### その他の UX

- **トースト通知**: relation-word-api の接続失敗、保存失敗、共有 URL コピー成功などを右下に表示
- **beforeunload フラッシュ**: タブを閉じる直前にスナップショットを `sendBeacon` で送信（2秒デバウンス中の編集も拾う）
- 削除キー (`Delete` / `Backspace`) は無効化、右パネル経由で確認ダイアログを挟む

---

## クイックスタート

### 1. 依存インストール

```bash
cd d:/training2/mindsource
npm install
cd collab-server && npm install && cd ..
```

### 2. Supabase プロジェクト

1. [supabase.com](https://supabase.com/) で新規プロジェクト作成
2. SQL Editor で下記を順番に実行:
   - `supabase/migrations/0001_init.sql` （テーブル・RLS）
   - `supabase/migrations/0002_ring_gaps.sql` （`user_settings.ring_gaps` カラム追加）
   - `supabase/migrations/0003_default_layout_hierarchical.sql` （既定レイアウトを樹形図に）
   - `supabase/migrations/0004_ring_gaps_wider.sql` （ring_gaps の既定を `[120, 80]` に）
3. Authentication → Providers:
   - **Email** を有効化
   - **Google** を使う場合: GCP OAuth クライアント作成 → Client ID / Secret を Supabase に登録
4. Authentication → URL Configuration:
   - Site URL に開発用の `http://localhost:3000` を設定
   - Redirect URLs に `http://localhost:3000/callback` を追加

### 3. `.env.local`

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

# 連想語 API（サーバー側専用、ブラウザには渡さない）
RELATION_WORD_API_BASE_URL=http://localhost:8000       # ローカル: ../relation-word-api を docker compose up
# 本番利用時: RELATION_WORD_API_BASE_URL=https://13-193-92-78.nip.io  等
RELATION_WORD_API_KEY=dev-key-1

# ブラウザから直接繋ぐ WebSocket。本番では wss:// を使う
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:1234
```

### 4. 起動

```bash
# Next.js + collab-server を同時起動
npm run dev:collab
```

- Next: <http://localhost:3000>
- collab-server: `ws://localhost:1234`
- relation-word-api: <http://localhost:8000>（`../relation-word-api` で `docker compose up` 済みが前提）

Next だけ起動するときは `npm run dev`。

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    # Home
│   ├── (auth)/login, callback
│   ├── me                          # マイページ（プロフィール・マップ一覧・ドラフトインポート）
│   ├── settings                    # 自動生成・レイアウト・色の設定
│   ├── maps/[id]                   # 保存済みエディタ
│   ├── maps/local/[localId]        # 匿名ドラフトエディタ
│   └── api/
│       ├── word/{related,cascade}  # relation-word-api プロキシ（X-API-Key 秘匿）
│       ├── maps/...                # マップ CRUD + スナップショット + import
│       ├── maps/[id]/collaborators # コラボレーター CRUD（オーナーのみ）
│       ├── settings                # user_settings CRUD
│       └── profile                 # profiles CRUD
├── components/
│   ├── editor/                     # Canvas, Toolbar, NodeInspector, PresenceBar,
│   │                               #   RemoteCursors, TreePanel, CollaboratorsModal, EditorClient
│   ├── flow/                       # WordNode + ColorSchemeContext
│   ├── layout/LayoutRunner.ts      # ELK ラッパ + overlap 解決 + findFreePosition
│   ├── home/NewMapModal.tsx
│   ├── settings/SettingsForm.tsx
│   ├── me/                         # ProfileEditor, DraftImporter, SignOutButton, DeleteMapButton
│   └── ui/                         # Header, Toaster, ConfirmDialog, LoginForm
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── relation-word-api/{server,client,types}.ts
│   ├── yjs/{doc,binding,provider,nodeRenameBridge}.ts
│   ├── storage/localDraft.ts       # idb-keyval
│   ├── settings/{schema,defaults}.ts
│   └── flow/{convert,colors}.ts
├── hooks/
│   ├── useMindmap.ts               # Y.Doc ↔ React Flow + UndoManager
│   ├── useAutoGen.ts               # cascade / expand
│   └── useSettings.ts
└── proxy.ts                        # Supabase セッション自動更新 (Next 16 proxy)
collab-server/
├── src/index.ts                    # y-websocket + y-leveldb
├── Dockerfile                      # Fly.io / Render などで利用
└── fly.toml.example
supabase/migrations/                # 0001 〜 0004 の SQL
```

---

## 仕組み

### 状態管理の仕組み

- **Y.Doc がライブ状態の権威**。`Y.Map<nodeId, Node>` / `Y.Map<edgeId, Edge>` / `Y.Map<meta>` を持つ
- React Flow の `onNodesChange/onEdgesChange` → `ydoc.transact()` で Y.Map を更新
- Y.Map の observer で React state を書き戻し → コラボ経由の変更も UI に反映
- **UndoManager** (`yjs` の `Y.UndoManager`) で編集をスタック管理、`captureTimeout: 300ms`

### 永続化の仕組み

- **ログイン時**: Y.Doc は y-websocket 経由で他クライアントと同期。2秒デバウンスで JSON スナップショットを `/api/maps/[id]/snapshot` に PUT
- **匿名時**: Y.Doc はメモリのみ、2秒デバウンスで IndexedDB（`idb-keyval`）に保存
- **タブ閉じ**: `beforeunload` / `pagehide` で最新スナップショットを `sendBeacon` / IDB 書き込みでフラッシュ
- collab-server 側は独自に `y-leveldb` で状態を保存し、再起動後も最新を返す

### 自動生成の仕組み

- **cascade**: `/v1/cascade` → DAG を React Flow のノード/エッジに変換 → ELK でレイアウト → 測定後に `useNodesInitialized` で再レイアウト
- **expand**: `/v1/related` → 既存語を `exclude` に入れて取得 → 親の真下に配置、`findFreePosition` で衝突回避

### レイアウトの仕組み

- **ELK layered**（樹形図）: 世代ごとに行 Y を再計算、各世代の行高はその世代の一番大きいノードに合わせる
- **放射**: 世代ごとの弦長と最小リング間隔から半径を計算、**兄弟間は MIN_GAP 確保**
- 最終段で `resolveOverlaps`（ペア反復で軸方向に押し分け）してノード矩形の重なりを保証解消
- `ring_gaps` 設定で世代別のリング間隔を UI から直接調整可能

### コラボの仕組み

- room id = `mindmaps.id`（保存済）または `local:<nanoid>`（匿名）
- awareness フィールド:
  - `user`: `{ id, name, color }` → PresenceBar でアバター表示
  - `cursor`: マウス位置（ワールド座標）→ RemoteCursors が画面変換して描画

---

## 動作確認シナリオ

1. `npm run dev:collab` で両プロセス起動（`../relation-word-api` が別途稼働している前提）
2. `/` → 「ログインなしで試す」モーダルでタイトルと起点ワード「猫」を入れて作成 → 樹形図が自動生成
3. ノードをダブルクリックしてラベル編集
4. `Ctrl+Z` で元に戻す
5. 右下のミニマップ、左の **☰ ツリー**、ツールバーの **再レイアウト** / **PNG** / **SVG** を確認
6. 設定画面でカラースキームや世代間距離を変更 → 再レイアウトで反映
7. メールでログイン → `/me` で表示名を設定 / ドラフトをインポート
8. 保存版マップでツールバー「メンバー」→ UUID 指定でコラボレーター追加
9. 2 つのブラウザ（または incognito）で同じ共有 URL を開く → カーソルが見え、編集が即時反映
10. relation-word-api を停止してから自動生成 → 赤いトーストで「接続できません」が表示される

---

## 本番デプロイ

詳細は [DEPLOY.md](./DEPLOY.md) 参照。

- **Next.js → Vercel**: `vercel deploy --prod`、env に Supabase / relation-word-api / collab WS URL
- **collab-server → Fly.io / Render / 自前 VPS**: `collab-server/Dockerfile` + `fly.toml.example` を雛形に、`y-leveldb` 用の永続ボリュームをマウント
- Supabase の Redirect URLs に本番ドメインを追加

---

## 既知の制約

- relation-word-api 本番エンドポイント（nip.io の EC2）は断続稼働。開発時はローカル `http://localhost:8000` が安定
- y-websocket 単独構成は 1 プロセス前提。水平スケールには Redis pub/sub アダプタ等が必要
- スナップショット同期はクライアント任せ（2秒デバウンス + unload 時 beacon）。極端に速いタブ閉じで最新が届かない可能性は残る
- React Flow は v12 系（`@xyflow/react`）。旧 `reactflow` パッケージではない

---

## ライセンス

MIT — [LICENSE](./LICENSE)
