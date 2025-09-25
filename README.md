# EchoSky

ATプロトコルを基盤とした分散型掲示板システム

## 開発環境のセットアップ

### 依存関係のインストール

```sh
npm install
```

### 環境変数の設定

ローカル開発時は `.env.local` ファイルを作成して以下を設定：

```sh
# ローカル開発環境の設定
VITE_ENV=local
```

### 開発サーバーの起動

```sh
# 127.0.0.1:5173 で起動（推奨）
npm run dev

# ブラウザで自動的に開く場合
npm run dev -- --open

# または手動で127.0.0.1を指定
npm run dev -- --host 127.0.0.1 --port 5173
```

**注意**: OAuth認証のため、`http://127.0.0.1:5173` でアクセスしてください。

## OAuth設定

### ローカル開発

- `VITE_ENV=local` を設定することで、OAuth リダイレクトが `127.0.0.1:5173` に設定されます
- **重要**: RFC 8252準拠のため、`localhost` は使用できません。必ず `127.0.0.1` を使用してください
- `client-metadata.json` には本番用とローカル用（127.0.0.1）のリダイレクトURIが含まれています

### 本番環境

- `https://echosky.app` でのデプロイ用に設定済み
- OAuth クライアントメタデータは `https://echosky.app/client-metadata.json` で提供

## ビルド

本番用ビルドの作成：

```sh
npm run build
```

ビルド結果のプレビュー：

```sh
npm run preview
```

## デプロイ

CloudFlare Pages 用にアダプターが設定済みです。

### 必要な設定

1. **ドメイン**: `https://echosky.app`
2. **静的ファイル**: `/client-metadata.json` がアクセス可能であること
3. **ルーティング**: SPA ルーティングが正常に動作すること

## 技術スタック

- **フレームワーク**: SvelteKit
- **プロトコル**: ATプロト (ATProto)
- **認証**: OAuth 2.0 + PKCE + DPoP
- **スタイリング**: Tailwind CSS
- **デプロイ**: CloudFlare Pages
