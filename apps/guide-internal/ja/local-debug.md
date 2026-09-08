# ローカルでのGoogle Cloud検証

開発専用の接続確認は、通常のGoogle APIキーではなく**サービスアカウントのJSON鍵**を使い、OIDCサーバーを必要としません。実装済みの開発用の土台であり、顧客向け診断は引き続き**v0.1予定・未提供**です。

## 設定

開発とテストにはNode.js 24を使います。Git管理対象外の`apps/api/.dev.vars`に次を設定します。

```dotenv
GOOGLE_AUTH_MODE="local-service-account"
GOOGLE_DEBUG_PROJECTS="your-debug-project"
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","client_email":"reader@your-debug-project.iam.gserviceaccount.com","private_key":"REPLACE_WITH_YOUR_LOCAL_KEY"}'
```

値はプレースホルダーです。利用が許可された既存の開発用サービスアカウントの完全なJSONを1つのJSON文字列として設定し、PEM内の改行のエスケープを維持します。実鍵は追跡対象ファイルに含めず、ブラウザのフォーム、ソースコード、コマンド、ログへ貼り付けません。鍵の同梱や他のチェックアウトからの自動探索は行いません。モードを未設定にすると確認を無効にできます。IAM変更やAPI有効化は自動では行いません。

検証が許可されたプロジェクトだけを、カンマ区切りで明示します。サービスアカウントには[診断設計](./diagnostics)に記載したCompute APIの一覧権限が必要です。読み取り用OAuthスコープで元の鍵の別用途まで制限できるわけではないため、IAMも適切に制限した開発用認証情報を使います。鍵の所属プロジェクトを診断対象として自動承認しません。

## 起動と確認

リポジトリのルートで`pnpm dev`を実行します。ローカルAPIは`wrangler.local.jsonc`で`127.0.0.1:8787`に起動し、`127.0.0.1:3000`の開発用Web画面にGoogle Cloud確認パネルを表示します。通常のAPIビルドは`wrangler.jsonc`を使い、デバッグルートやWorkflowのバインディングを含みません。ローカル設定をデプロイしたり、認証のないデバッグ機能を自分のマシンの外へ公開したりしないでください。

設定状態を読み込んで許可済みのプロジェクトを選び、APIから直接、またはローカルWorkflow経由での確認を明示的に実行します。Workflowの結果は状態確認ボタンで取得します。サーバー起動、設定状態の読み込み、結果の閲覧だけではGoogle Cloudに接続しません。有効な鍵で確認ボタンを押すとGoogleのトークン取得先とCompute APIへ接続するため、Workers・Workflowsがローカル動作でも読み取りクォータを消費します。

JSON鍵で署名した情報を短期トークンへ交換し、ディスク・アドレス・VMの一覧をそれぞれ最大1ページだけ確認します。各要求にはタイムアウトがあり、自動再試行や全件スキャンは行いません。認証失敗、読み取り確認の成功・不完全、権限拒否／API無効、クォータ制限、その他の取得失敗を区別します。確認成功は診断完了、全権限の監査、検知0件の証明ではありません。リソースの中身や一覧はブラウザへ返しません。

## 境界と検証

- 標準のWeb Cryptoとfetchを使い、WorkerとWorkflowのステップで認証情報のインターフェースを共有します。Worker内で別プロセスの起動やファイル読み取りは不要です。
- トークンのキャッシュはプロバイダーのインスタンス内に限定し、有効期限に余裕を持って更新します。鍵・トークン・Googleの生エラーをAPIの結果やWorkflowの入出力に含めません。認証情報の取得はステップ内で行い、独立した永続化されるステップの戻り値にはしません。
- ローカルWorkflowsは、指定したプロジェクト、機密情報を除いた確認結果、時刻を`.wrangler/`配下へ保存します。開発データとして扱い、不要になったローカル状態はサーバーを停止してから削除します。
- `packages/auth`と本番のWIF設計は別に維持します。デバッグモードは顧客向けの導入やテナント認可を実装するものではありません。
- `pnpm test`は生成したテスト鍵とGoogleの模擬応答を使い、署名、有効期限、エラー、プロジェクト制限、読み取り確認の意味を検証します。実鍵やクラウド接続は不要です。実際のGoogle Cloud接続と最小権限のIAMは、明示的に承認したプロジェクトで別途検証します。

Googleの[サービスアカウントOAuth](https://developers.google.com/identity/protocols/oauth2/service-account)、Cloudflareの[ローカルシークレット](https://developers.cloudflare.com/workers/configuration/secrets/)と[ローカルWorkflows](https://developers.cloudflare.com/workflows/build/local-development/)も参照してください。
