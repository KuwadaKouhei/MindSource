# Handoff: MindSource (ホーム + エディタ)

## Overview

MindSource は、起点ワードから AI が日本語の連想語ネットワークを自動生成するマインドマップ Web サービスです。このハンドオフには以下2つの画面が含まれます:

1. **ホーム(ランディング)画面** — `MindSource Home.html` : 未ログインでも即座に利用開始できる入口。プロダクト価値の提示と `自動生成(cascade)` への誘導、ログイン / ログインなし試用の2導線。
2. **エディタ画面** — `MindSource Editor.html` : 実際にマインドマップを編集する画面。左にツリーアウトラインパネル、中央にキャンバス、右に Node Inspector、上下にツールバー / ステータスバー。

両画面は同一デザイン言語で統一されています (ダーク・サイバー / HUD 風)。

## About the Design Files

同梱されている2つの HTML ファイルは **HTML で作られたデザインリファレンス** です。最終的な見た目・インタラクション・コピーを示すためのプロトタイプであり、プロダクションコードとしてそのまま貼り付けるものではありません。

**タスクは、ターゲットコードベースの既存環境 (React / Next.js / Vue など) でこれらのデザインを再現すること** です。既存のコンポーネントライブラリ、スタイリング規約、アイコンセットがあればそれを使ってください。もしプロジェクトがまだ空の場合は、推奨スタック (Next.js + TypeScript + Tailwind CSS もしくは CSS Modules、キャンバス描画は `react-flow` または `d3-force`) を選定してください。

## Fidelity

**High-fidelity (hifi)**: 最終的な配色・タイポグラフィ・余白・アニメーション・コピーまで作り込み済み。ピクセルパーフェクトに再現することを想定してください。既存のデザインシステム / トークンに近いものがあればそちらに合わせて OK。

## 全体の美学 / アートディレクション (両画面共通)

- **テーマ**: ダーク・サイバー / HUD(ヘッドアップディスプレイ)風。ターミナル・コマンドデッキの世界観
- **支配色**: 深いネイビーブラック背景 + シアン(`#4fd1ff`)のアクセント
- **フォント**:
  - 日本語本文・見出し: `Noto Sans JP` (400/500/700/900)
  - 英数字・コード・ラベル: `JetBrains Mono` (400/500/700)
- **装飾パターン**:
  - L字のコーナーマーク(発光するシアン)
  - ドット付き MONO uppercase タグ(ドットがパルス点滅)
  - clip-path で角を1箇所欠いたボタン・カード・パネル
  - 常時ゆっくり動くサブリミナル演出(スキャンライン、ロゴ回転、グロー呼吸、LIVE フリッカー、カーソル点滅)
- **モーション原則**: 派手に動かさない。ノードのポップイン、線のダッシュループ、IntersectionObserver による stagger フェードなど、「生きている UI」を感じさせる演出のみ

---

## Screen 1: Home (`MindSource Home.html`)

単一のスクロール型ランディング。セクション構成:

### 1. Top Nav (sticky)
- `position: sticky; top: 0`、`backdrop-filter: blur(12px)`、背景 `rgba(5,8,15,0.8)`、下線 `1px solid var(--line)`
- 左: 二重円ロゴ(外周破線が12sで回転)+ `MINDSOURCE_` + `v0.4.2 // AI-ASSISTED NETWORK SYNTH`
- 右: `› usage` `› features` リンク、`ログイン` ghost ボタン(小)

### 2. Hero
- タグ `● AI-DRIVEN ASSOCIATION NETWORK`
- h1 (62px / weight 900 / letter-spacing -2px): `一語から、` + `思考のネットワーク`(シアン) + `を合成する。`
- サブ: `> type a seed word to synthesize the network`
- **起点ワード入力**: ボーダー `1.5px solid var(--cyan)`、L字コーナー、3sグロー呼吸、左 `$` シジル + 入力欄 + 右 `自動生成 (cascade)` グラデーションボタン
- サジェストチップ: `コーヒー / 東京 / 宇宙 / 記憶 / 旅行 / 音楽` (クリックでデモグラフ再描画)
- 補足: `[NO_AUTH_REQUIRED] ● ログインなしで使えます · 後からアカウント連携して保存もOK`
- CTA: `> ログイン` (primary) + `> ログインなしで試す` (ghost)

### 3. Live Preview (ネットワークグラフデモ)
- `network_synth.wasm` タグ + `nodes · depth · ● LIVE` ステータス
- SVG動的描画: 中心円 → 一次ノード8個(円周配置) → 先頭3つに二次ノード2つずつ
- 接続線はシアン破線で `lineDash` が流れる、ノードは `nodePop` で順次登場、ハローが 2s でパルス

### 4. How-to Pipeline (使い方)
- `// 01 使い方 / how_it_works.md` ヘッダ
- 6ステップを `grid-template-columns: repeat(6, 1fr)` で横並び、45度回転矢印で連結:
  1. 新規マップを開く
  2. 起点ワード → 自動生成 (cascade)
  3. ダブルクリックで拡張 (expand)
  4. 手動で編集
  5. 共有URLで共同編集
  6. PNG / SVG で出力

### 5. Features
- 5枚のカードを3列グリッドで配置、hover で2px浮上 + 左端に発光バーがスライドイン
- 内容: **自動生成** `AUTO_GEN` / **リアルタイム共同編集** `SYNC` / **画像エクスポート** `EXPORT` / **匿名でもOK** `ANON` / **カスタマイズ** `CONFIG`

### 6. CTA Band
- `● Ready / init` タグ + h2 `さあ、最初の一語を。` + サブ `> no account · no credit card · just type` + CTAボタン2つ

### 7. Footer
- `© 2026 MindSource · STATUS: ● ONLINE` + Docs / GitHub / Privacy / Contact

---

## Screen 2: Editor (`MindSource Editor.html`)

3カラムレイアウト: `grid-template-rows: 52px 1fr 28px` (上: ツールバー / 中: メイン / 下: ステータスバー)
メイン: `grid-template-columns: 260px 1fr 320px` (左: ツリーパネル / 中: キャンバス / 右: Node Inspector)
ツリーパネルを閉じると `0 1fr 320px` に 0.25s トランジション、閉じる際はキャンバスを再レイアウト。

### 1. Toolbar (上部 52px)
左から順にグルーピング、各グループ間は縦の `1px solid var(--line)` で区切り:

- **ロゴグループ**: 二重円ロゴ(12sで回転)+ `MS_`
- **ドキュメント**: ≡ ツリー表示トグルボタン(active時シアン発光)+ `● Untitled` タイトル入力フィールド(琥珀ドット=未保存)
- **AI 操作**: `$ 起点ワード` 入力 + `▶ 自動生成 (cascade)` (active) + `+ 展開 (expand)` + `↻ 再レイアウト`
- **履歴**: Undo / Redo アイコン
- **(flex spacer)**
- **プレゼンス**: 共同編集者アバター3つ(Y=自分シアン / K=琥珀 / M=ピンク)、各右下に緑のオンライン●
- **エクスポート**: `↓ PNG` / `↓ SVG` / `◆ 共有` (primary)

すべてのボタンは `clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)` で角欠き。

### 2. Tree Panel (左 260px) — 「ツリー表示」ボタンでトグル
- ヘッダ: `/ ツリー` タイトル + `/ outline · 15 nodes` + 検索入力 (`filter…` プレースホルダ、mono 11px)
- ボディ: ツリー構造を再帰的にインデント表示
  - 各行: chevron(折畳) + ドット(root=琥珀 / 通常=シアンディム) + ラベル + sim値 (mono 9.5px)
  - 選択行: シアン背景グラデーション + 左に2pxの発光バー
  - 子ノードを持つグループには縦のガイドライン (`::before`, `var(--line)`)
  - 折畳時は chevron が -90deg 回転
  - 検索は再帰マッチ(親が一致しなくても子孫が一致すれば表示)
- フッタ: `↓ 全展開` / `↑ 全折畳` ボタン
- ショートカット: `T` キーでトグル

### 3. Canvas (中央、残りすべて)
- 背景: 24pxドットグリッド + 斜めの2つの放射グラデーション + CRT スキャンラインオーバーレイ + 10sで縦に流れるスキャンビーム
- 4隅に L字コーナーマーク(発光シアン)
- **ツリー描画**:
  - ルート(`コーヒー`)= 最上段、1世代目2ノード(`ドリップ` / `アイスコーヒー`)= 中段、2世代目12ノード = 下段
  - 2世代目の横間隔 `< 120px` で自動的に **tight モード** に入り、2行に千鳥配置 + ノードを `.compact` (小さめ、sim値非表示、ラベル省略)
  - 接続線は直交エルボー (`M x y1 L x midY L x2 midY L x2 y2`)、シアン半透明、選択ツリー上は発光強化
  - ノード: `bg3` + `line2` 枠 + clip-path 角欠き、hover で枠シアンディム、選択時はシアングラデ + 発光 + ドットがシアンに
  - ルートノードは太字 + 琥珀ドット + シアン発光
- **トースト** (右上): `⚠ HINT / ノードを選択すると編集パネルが表示されます`
- **ズームコントロール** (左下): `+ / %表示 / - / fit`
- **ミニマップ** (右下、200×120px): `● LIVE` ヘッダ、ノード・リンクを縮小プロット、現在のビューポート矩形

### 4. Node Inspector (右 320px)
- ヘッダ: `● Node Inspector` タグ + ノード名(18px 700) + `id: n_8a3f · depth 1 · parent: コーヒー`
- **Stat Grid**: Similarity / Children / POS / Sources の4指標 (mono 16px cyan)
- **/ label セクション**: ラベル入力 + メモ textarea
- **/ children セクション**: 子ノード一覧(ドット + ラベル + sim + hover で×削除ボタン)、下に `+ 子ノード追加` と `✓ 1世代 expand` ボタン
- **/ actions セクション**: `複製` / `再配置` / `削除`(削除はhoverでピンク)

### 5. Status Bar (下部 28px)
Mono 10.5px、左から: `CONN: ● yjs · synced` / `NODES: 24` / `EDGES: 23` / `DEPTH: 2` / `MODEL: chiVe-1.2` / `THRESH: 0.42` / (spacer) / `SELECTED: ドリップ` / `SAVED: 2s ago`

## Interactions & Behavior (Editor)

- **ノードクリック**: そのノードを選択 → canvas + tree outline + Inspector タイトルが同期
- **ツリー行クリック**: 対応するキャンバスノードを選択、chevron クリックは折畳トグル
- **ツリー検索**: 入力のたびに再帰フィルタリング
- **ツリーパネル トグル**: `T` or ヘッダボタン、グリッドが 0.25s トランジション後 `render()` 再実行でキャンバス再レイアウト
- **ウィンドウリサイズ**: `render()` 再呼び出し、tight モードの自動判定も再評価
- **ズームボタン**: CSS `transform: scale()` で canvas をスケール(0.5〜1.8)
- **サブリミナル演出**: スキャンビーム 10s、ロゴ外周 12s 回転、タグ/ドット 1.8s パルス、LIVE は 4s CRT フリッカー、カーソル `_` 1s 点滅、接続線ダッシュ 1.5s

## State Management (Editor)

```ts
type Node = {
  id: string;
  label: string;
  sim: number;       // 0-1 類似度スコア
  depth: number;
  parent?: string;
  children?: Node[];
  root?: boolean;
  selected?: boolean;
  memo?: string;
  x?: number; y?: number; // computed by layout
};

// グローバル状態
tree: Node                    // ツリーデータ
selectedId: string            // 選択中のノードID
collapsed: Set<string>        // 折畳中のノードID
filter: string                // ツリー検索文字列
zoom: number                  // 0.5-1.8
treePanelOpen: boolean        // ツリーパネル表示状態
```

必要な API / ハンドラ:
- `POST /api/mindmap` (seed で新規作成)
- `POST /api/expand` (ノード1世代拡張)
- `POST /api/cascade` (自動生成)
- `PATCH /api/node/:id` (ラベル・メモ・位置更新)
- `DELETE /api/node/:id`
- `POST /api/mindmap/:id/export?format=png|svg`
- Yjs or similar CRDT でリアルタイム共同編集同期

## Design Tokens (両画面共通)

```css
/* Colors */
--bg:        #05080f;
--bg2:       #0a1020;
--bg3:       #0e1628;
--bg4:       #121d33;   /* editor only (node hover) */
--line:      #1b2a44;
--line2:     #2a4066;
--text:      #dfe8f5;
--muted:     #6b7a93;
--muted2:    #8fa0bd;
--cyan:      #4fd1ff;   /* primary accent */
--cyan-dim:  #2a7a9a;
--cyan-deep: #15405a;
--amber:     #ffb84d;   /* root / unsaved marker */
--pink:      #ff6b9d;   /* danger / presence */
--green:     #4ade80;   /* online indicator */

/* Effects */
--glow:      0 0 12px rgba(79,209,255,0.55);
--glow-sm:   0 0 6px  rgba(79,209,255,0.4);

/* Typography */
body: "Noto Sans JP", sans-serif
mono: "JetBrains Mono", monospace
Hero h1:          62px / 900 / -2px
Section h2:       34px / 800 / -1px
Panel title:      18px / 700
Node (standard):  12.5px / 500
Node (compact):   11.5px (tight モード)
Node (root):      13px / 700
Tag (mono):       11px / letter-spacing 2px / uppercase
Stat value:       16px mono / 700 / cyan
Status bar:       10.5px mono

/* Clip-path (角欠き) */
Button:  polygon(6-10px 0, 100% 0, 100% calc(100% - 6-10px), calc(100% - 6-10px) 100%, 0 100%, 0 6-10px)

/* Animations */
Scan beam:     8-10s linear infinite
Logo rotate:   12s linear infinite
Tag pulse:     1.8s ease-in-out infinite
Glow breathe:  3s ease-in-out infinite
LIVE flicker:  4s stepped infinite
Cursor blink:  1s step-end infinite
Line dash:     1.5s linear infinite
Node pop:      0.5s cubic-bezier(.2,.7,.3,1.3)
Halo pulse:    2s ease-in-out infinite
Panel trans:   0.25s ease (tree panel open/close)
```

## Assets

両画面とも自己完結 (外部画像なし):
- **Google Fonts**: `Noto Sans JP` (400/500/700/900) + `JetBrains Mono` (400/500/700)
- **ロゴ**: インライン SVG 二重円マーク
- **アイコン**: すべてインライン `<svg>` (Lucide 互換の線画 24px viewBox)。既存ライブラリへの置き換え推奨マッピング:
  - 自動生成 → `Sparkles` / `Zap`
  - 展開 → `Plus`
  - 再レイアウト → `RefreshCw`
  - Undo/Redo → `Undo2` / `Redo2`
  - PNG/SVG → `Download`
  - 共有 → `Share2`
  - ツリー → `ListTree`
  - 削除 → `Trash2`
  - 複製 → `Copy`
  - 検索 → `Search`
- **ネットワーク描画**: 現状は命令的に SVG を構築。本番では `react-flow` 推奨(ノード・エッジ・ミニマップ・ズーム全部カバー)。
- **辞書データ**: サンプルはハードコード。本番では word-api (chiVe) のレスポンスに差し替え。

## Files

- `MindSource Home.html` — ランディングページ (完全な HTML/CSS/JS、依存は Google Fonts のみ)
- `MindSource Editor.html` — エディタ画面 (同上)

## 実装上の推奨事項

1. **コンポーネント分割 (Editor)**: `<Toolbar>` `<TreePanel>` `<TreeItem>` `<Canvas>` `<MindMapNode>` `<MindMapLink>` `<Minimap>` `<ZoomControls>` `<NodeInspector>` `<StatusBar>` `<PresenceAvatars>`
2. **キャンバス描画**: `react-flow` を使えばノードドラッグ / ミニマップ / ズーム / パン / コネクタが標準装備。カスタムノードに `.node` のスタイルを適用
3. **リアルタイム同期**: `yjs` + `y-websocket` もしくは `liveblocks`、プレゼンスアバターはそのまま Yjs awareness で表示
4. **アクセシビリティ**: ボタンの `aria-label`、`prefers-reduced-motion` で scan/pulse/flicker を無効化、ダーク UI のコントラスト比 AAA 以上維持 (`#dfe8f5` on `#05080f` は OK)
5. **レスポンシブ**: エディタは `≥ 1280px` を想定。`< 1024px` ではツリーパネルを自動折畳、`< 768px` では Node Inspector も drawer 化
6. **デザイントークン**: Tailwind なら `theme.extend.colors.cyan.DEFAULT = '#4fd1ff'` を含め、上記CSSカスタムプロパティを同名でエクスポート
7. **SEO / OGP** (Home): `<title>`、description、og:image (ヒーローのスクリーンショット)、JSON-LD
