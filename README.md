# 🎬 NITRO — デプロイ手順書

## 今日中に公開するための完全ガイド

---

## ⏱️ 所要時間：約15〜20分

---

## STEP 1: Replicateアカウント作成 & APIキー取得（5分）

1. https://replicate.com にアクセス
2. 右上「Sign up」でGitHubアカウントでサインアップ（無料）
3. ログイン後、右上アイコン → **「API tokens」**
4. **「Create token」** をクリック
5. トークンをコピーして保存（`r8_xxxxxx` という形式）

> 💡 **無料クレジット**: サインアップで$5のクレジットが付与されます。
> AnimateDiff Lightning は1回約$0.01〜$0.05 → 約100〜500回無料で生成可能！

---

## STEP 2: GitHubにリポジトリ作成（3分）

1. https://github.com/new にアクセス
2. Repository name: `nitro-ai`
3. Private（非公開）を推奨
4. 「Create repository」

ターミナルで：
```bash
cd /path/to/nitro  # このフォルダ
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nitro-ai.git
git push -u origin main
```

---

## STEP 3: Vercelにデプロイ（5分）

1. https://vercel.com にアクセス
2. 「Sign up」→ GitHubでログイン（無料）
3. 「New Project」→ `nitro-ai` リポジトリを選択
4. **「Environment Variables」** セクションで以下を追加：

| Key | Value |
|-----|-------|
| `REPLICATE_API_TOKEN` | `r8_あなたのトークン` |

5. 「Deploy」ボタンをクリック
6. 2〜3分待つと完成！

**あなたのURL**: `https://nitro-ai.vercel.app`（またはカスタムドメイン）

---

## STEP 4: 動作確認（2分）

1. `https://nitro-ai.vercel.app` → LPが表示されることを確認
2. `https://nitro-ai.vercel.app/app` → 生成スタジオが表示されることを確認
3. 日本語プロンプトを入力 → 生成ボタンを押す
4. 1〜3分で動画が生成されればOK！

---

## 🔧 カスタムドメインの設定（任意）

Vercelダッシュボード → プロジェクト → Settings → Domains

`nitro.jp` や `nitrostudio.ai` などを設定可能。

---

## 💰 マネタイズの準備（Stripe）

準備できたらStripeを追加できます：

1. https://stripe.com/jp でアカウント作成
2. 環境変数に `STRIPE_SECRET_KEY` を追加
3. 決済ページを `/app/upgrade` に追加

（コードは後で追加します）

---

## 📊 生成モデルについて

| モデル | 特徴 | コスト |
|--------|------|--------|
| **AnimateDiff Lightning** | 高速・アニメ系が得意 | ~$0.02/回 |
| **MusicGen** | BGM生成 | ~$0.01/回 |

### モデルを変更したい場合

`api/generate.js` の `MODELS.primary.version` を変更：

```js
// 他の選択肢（Replicate探して最新versionを使用）:
// "deforum-art/deforum_stable_diffusion:..."  
// "cjwbw/damo-text-to-video:..."
```

---

## 🐛 よくあるトラブル

### 「REPLICATE_API_TOKEN が設定されていません」
→ Vercelの環境変数を確認。設定後、Vercelでリデプロイ。

### 生成が始まらない
→ Replicateのダッシュボードでエラーログを確認。
→ https://replicate.com/deployments

### 動画が生成されるがダウンロードできない
→ Replicateの生成URLは一時的です。S3/R2への保存は次のステップで追加します。

---

## 🚀 次のステップ（マネタイズ）

1. **Stripe決済** → 有料プランの実装
2. **Supabase認証** → ユーザーアカウント管理
3. **Cloudflare R2** → 動画の永続保存
4. **レート制限強化** → サーバーサイドの上限管理

準備できたらいつでも対応します！
# NITRO
