# ムラツムギ公式サイト

特定非営利活動法人ムラツムギの公式ウェブサイト。
ビルド不要の静的サイト + Decap CMS 構成です。

- 日常の更新方法 → **MANUAL.md** を参照
- コンテンツはすべて `content/*.json`
- デザインは `assets/css/style.css`、描画ロジックは `assets/js/main.js`

## 初回公開手順(Netlify)

1. このフォルダをGitHubの新しいリポジトリ(例 `muratsumugi-site`)にプッシュする
2. [Netlify](https://app.netlify.com/) で「Add new site → Import an existing project」からそのリポジトリを選ぶ
   - Build command: なし(空欄) / Publish directory: `/`(ルート)
3. デプロイ完了後、サイト設定で以下を有効化する
   - **Identity** を有効化(Site configuration → Identity → Enable)
   - Identity → Registration を **Invite only** に設定
   - Identity → Services → **Git Gateway** を有効化
4. Identity → Invite users からメンバーのメールアドレスを招待
5. 招待メールのリンクからパスワードを設定すると、`/admin/` にログインできるようになります

## ローカルで確認する場合

このサイトはJSONを読み込むため、ファイルを直接開くのではなく簡易サーバーで確認します。

```
cd このフォルダ
python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## Claudeによる管理

Claude Code でこのリポジトリを開き、日本語で指示すれば更新できます(MANUAL.md 3章参照)。
