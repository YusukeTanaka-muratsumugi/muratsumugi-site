# ムラツムギ公式サイト

特定非営利活動法人ムラツムギの公式ウェブサイト。
ビルド不要の静的サイトです。

- **日常の更新方法 → MANUAL.md を参照**(GitHub直接編集 or Claude Codeへの指示)
- コンテンツはすべて `content/*.json`
- 写真は `assets/uploads/`
- デザインは `assets/css/style.css`、描画ロジックは `assets/js/main.js`

## 公開の仕組み

- GitHubの `main` ブランチ → Netlifyが自動デプロイ(Build command: なし / Publish directory: ルート)
- GitHub上でファイルを更新(Commit)すれば、1〜2分でサイトに反映されます

## ローカルで確認する場合

JSONを読み込む構成のため、ファイル直接オープンではなく簡易サーバーで確認します。

```
cd このフォルダ
python3 -m http.server 8000
# → http://localhost:8000 を開く
```
