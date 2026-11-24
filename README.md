# Daily ToDo

その日のタスクを「時間順」と「残りタスク」の2つのビューで管理する ToDo アプリ。

- **時間順**: 時刻順に並ぶタイムライン。現在時刻を過ぎた未完了タスクに「時間切れ」マーク、現在時刻ラインを表示。ドラッグで並べ替え可能（「時間順に並べ直す」で元に戻せる）
- **残りタスク**: 未完了タスクだけのリスト。ドラッグで自由に並べ替え
- **おすすめ登録**: 過去60日の登録履歴から、よく登録するタスクをいつもの時刻付きで提案。前日の未完了タスクの引き継ぎも
- **カレンダー**: 月表示で各日の完了数を確認、タップでその日のタスクへ

React + Vite + TypeScript / Supabase（未設定時は localStorage）/ GitHub Pages

## ローカル開発

```sh
npm install
cp .env.example .env.local   # Supabase を使う場合のみ値を設定
npm run dev
```

`.env.local` が無ければ localStorage モード（ログイン不要・端末ごとに保存）で動きます。

## Supabase のセットアップ

1. https://supabase.com でプロジェクトを作成（Free プラン）
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication > Providers > Email が有効になっていることを確認
   - 確認メールを省きたい場合は「Confirm email」をオフ
4. Authentication > URL Configuration の Site URL に `https://<user>.github.io/daily-todo/` を設定
5. Project Settings > API の `Project URL` と `anon public` キーを控える

## GitHub Pages へのデプロイ

リポジトリの Settings > Secrets and variables > Actions に以下を登録：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`main` に push すると GitHub Actions がビルドして Pages に公開します。
（anon キーはブラウザに公開される前提のキーで、データは RLS によりログインユーザー本人のものだけに制限されます）

スマホではブラウザの「ホーム画面に追加」でアプリのように使えます。
