# フレームワーク別 CWV改善ヒント

SKILL.mdのレビューで問題を検出した際、フレームワークに応じた具体的な改善案を出すための参照資料。

## 目次

1. React / Next.js
2. Vue / Nuxt
3. Svelte / SvelteKit
4. Laravel Blade
5. WordPress
6. 素のHTML/CSS/JS

---

## 1. React / Next.js

### 判定条件
- `.jsx` / `.tsx` ファイル
- `import React` / `from 'react'` / `from 'next'`
- `use client` / `use server` ディレクティブ

### LCP改善
- `<img>` → `next/image` の `<Image>` に置き換え。WebP自動変換、レスポンシブサイズ生成、lazy loadingデフォルト化。
- ファーストビューの画像には `priority` 属性を付与（内部的にpreload + fetchpriority="high"）。
- Server Componentsを活用し、LCP要素がHTMLに含まれるようにする。`'use client'`が不要なコンポーネントはServer Componentのまま。
- `next/dynamic` でファーストビュー外のコンポーネントを遅延読み込み。`ssr: false`はLCP要素を含むコンポーネントには使わない。

### INP改善
- `useTransition` / `startTransition` で検索・フィルタ等の非緊急更新を分離。
- `React.memo`、`useMemo`、`useCallback` で不要な再レンダリングを防ぐ。ただし全コンポーネントへのmemo適用は過剰最適化。
- 大量リスト表示には `react-window` や `@tanstack/react-virtual` を検討。
- イベントハンドラ内の重い処理は `requestIdleCallback` や Web Worker へオフロード。

### CLS改善
- `next/image` の `<Image>` はwidth/height必須なので画像由来のCLSを構造的に防げる。
- `next/font` でWebフォントを読み込むとフォールバックフォントのメトリクス自動調整でFOUT由来のCLSを軽減。
- Suspenseの`fallback`にスケルトンUIを指定し、非同期コンテンツの領域を確保。

---

## 2. Vue / Nuxt

### 判定条件
- `.vue` ファイル
- `<template>` / `<script setup>` 構文
- `from 'vue'` / `from 'nuxt'`

### LCP改善
- Nuxtの場合、`<NuxtImg>` / `<NuxtPicture>`（@nuxt/image）を使用。`preload`プロパティでLCP画像を優先読み込み。
- SSR（Nuxtのデフォルト）を維持。`<ClientOnly>`でLCP要素を囲まない。
- `defineAsyncComponent` でファーストビュー外のコンポーネントを遅延読み込み。

### INP改善
- `computed` でリアクティブデータの派生値をキャッシュ。`watch`での毎回再計算を避ける。
- `v-once` で静的コンテンツの再レンダリングを防止。
- `v-memo`（Vue 3.2+）で条件付きメモ化。
- 大量リスト表示には `vue-virtual-scroller` を検討。
- テキスト入力のデバウンスは `watchDebounced`（VueUse）が手軽。

### CLS改善
- `<NuxtImg>` にwidth/height指定でアスペクト比を確保。
- `<Transition>` での要素の出入り時、`position: absolute`や固定高さで後続要素への影響を防止。
- `v-if` / `v-show` の使い分け: レイアウトに影響する要素は `v-show`（display: none）のほうがCLSを防ぎやすい。

---

## 3. Svelte / SvelteKit

### 判定条件
- `.svelte` ファイル
- `$:` リアクティブ宣言
- `from '$app'` / `from '@sveltejs/kit'`

### LCP改善
- SvelteKitはデフォルトSSR。`+page.server.ts`でデータを取得すればLCP要素の描画データがHTMLに含まれる。
- `@sveltejs/enhanced-img`（Svelte 5+）で画像の自動最適化。

### INP改善
- Svelteはコンパイル時最適化のためReactほど再レンダリング問題は起きにくい。ただしリアクティブ宣言が広範囲の更新を引き起こしていないか注意。
- 大量リスト表示には `svelte-virtual-list` を検討。

### CLS改善
- 画像のwidth/height明示は同じ。
- `{#await}` ブロックのpendingスロットにスケルトンUIを配置して領域確保。

---

## 4. Laravel Blade

### 判定条件
- `.blade.php` ファイル
- `@extends` / `@section` / `@yield` / `{{ }}` 構文
- `@vite` / `@livewireStyles` 等のディレクティブ

### LCP改善
- 素の`<img>`なので `<link rel="preload" as="image">` を`<head>`内に手動追加。`fetchpriority="high"`も併用。
- 画像のWebP変換はIntervention ImageまたはCDN（CloudFront等）で自動変換。
- `@vite`で読み込むJS/CSSの肥大化を確認。`npm run build`後のサイズチェック。
- Livewire使用時、初期表示データはBladeで直接レンダリングし、Livewireの初期化完了を待たない構成に。

### INP改善
- Livewireのwire:click等はサーバーラウンドトリップ発生。`wire:loading`でインジケータを表示してフィードバック。
- Alpine.jsの`x-data`内の処理が重くないか確認。大量データ操作はサーバーサイドに任せる。

### CLS改善
- `<img>`にwidth/height必須。フレームワークの自動ガードがないためレビューで見落としやすい。
- Webフォントは`<link rel="preload" as="font" crossorigin>`で事前読み込み、`font-display: optional`を検討。

---

## 5. WordPress

### 判定条件
- `wp_enqueue_script` / `wp_enqueue_style` / `the_content()` / `get_template_part()` 等のWordPress関数

### LCP改善
- WordPress 5.5+はデフォルトで`loading="lazy"`付与。ファーストビューLCP画像では除外し`fetchpriority="high"`を付与。
- `wp_enqueue_script`の第5引数を`true`でフッター移動、または`strategy`パラメータ（WP 6.3+）で`defer`指定。
- 不要プラグインのCSS/JSをフロントで除外（`wp_dequeue_script` / `wp_dequeue_style`）。

### INP改善
- プラグイン由来のJSによるメインスレッド占有を確認。DevToolsのPerformanceパネルでLong Task発生源を特定。
- jQuery依存プラグインが多い場合、jQuery読み込み自体がLong Taskになり得る。

### CLS改善
- `the_post_thumbnail()`の出力にwidth/heightが含まれているか確認（WordPress 5.5+はデフォルトで含む）。
- 広告やウィジェット挿入領域を`min-height`で確保。
- Google Fontsを`<link>`で読み込む場合、`font-display: swap`がデフォルトだがCLS原因になり得る。

---

## 6. 素のHTML/CSS/JS

### 判定条件
- 上記いずれのフレームワークにも該当しない場合

### LCP改善
- LCP画像に`<link rel="preload" as="image" href="..." type="image/webp">`を`<head>`に配置。
- `fetchpriority="high"`をLCP画像の`<img>`に付与。
- `<script>`には`defer`または`async`を付与。ファーストビューに不要なJSは`defer`で遅延。
- クリティカルCSSをインライン化、残りは非同期読み込み。

### INP改善
- 重い処理はWeb Workerへオフロード。
- `requestAnimationFrame`でDOM更新をバッチ処理。
- `input`イベントのリスナーにデバウンス適用。

### CLS改善
- すべての`<img>`にwidth/height指定。`aspect-ratio`併用でレスポンシブ時も領域維持。
- `<iframe>`にもwidth/height指定。
- 動的挿入要素の領域をCSSで事前確保。
- Webフォントは`<link rel="preload" as="font" crossorigin>`で事前読み込み。
