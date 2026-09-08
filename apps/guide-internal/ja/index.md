# 内部ガイド

LuckyCatの成長に合わせて、顧客体験と内部設計のナレッジを揃えていきます。

## 製品方針

| ページ | 内容 |
| --- | --- |
| [コンセプト](./concept) | 存在意義、ジェネリックFinOps、対象ユーザー、お守りとしての体験 |
| [ビジネスモデル](./business-model) | 価格方針、収益案、紹介の条件、市場展開、採算の検証 |
| [開発方針](./product-strategy) | 設計原則、開発範囲、受け入れ条件、未決定事項 |

以下では、採用済みの技術とモノレポの構成を説明します。

## 主なアーキテクチャ

LuckyCatには以下の技術を採用します。ガイドサイトと最小限のアプリ・パッケージの土台は作成済みです。認証、永続化、FinOpsの業務フローはこれから実装します。

| 領域 | 利用技術・責務 |
| --- | --- |
| ガイドサイト | VitePress。英語・日本語に対応 |
| Webアプリケーション | TanStack Startによる画面とアプリケーションのルーティング |
| API | [oRPC](https://orpc.dev/)による型付きのクライアント・サーバー間通信 |
| 認証・認可 | [Better Auth](https://better-auth.com/docs/adapters/drizzle)を`packages/auth`に集約。独自実装よりも、提供される認証・セッション・アクセス制御機能を優先して活用 |
| 業務ロジック | `core`パッケージにFinOpsのドメインロジックとユースケースを集約 |
| データ永続化 | [Drizzle ORMとCloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)によるスキーマ定義とDBアクセス |

WebアプリケーションからoRPC経由でAPIを呼び出します。APIはセッション検証と認可を`packages/auth`に委譲してから、coreのユースケースを実行します。coreはUI・HTTP・認証・DBライブラリに依存させず、永続化はインターフェースを通して渡します。D1へのアクセスやサーバー側の認証コードはブラウザ向けのバンドルに含めません。

### 認証・認可の責務

Better Authの設定、プラグイン選択、セッション処理、ロール、権限、認可チェックは`packages/auth`に集約します。Better Authの既存機能を優先し、製品要件を満たせない部分だけ独自ロジックを追加します。アプリケーションはこのパッケージのインターフェースを利用し、Better Auth固有の知識を分散させません。

`packages/auth`はDrizzleアダプターを通じて`packages/db`と連携します。DBパッケージはスキーマの配置・マイグレーション・D1アクセスを担い、認証・認可のポリシーはauthパッケージが担います。ブラウザ向けのクライアント連携はサーバー専用の機能と分けて公開し、認可はサーバー側で強制します。

## モノレポの基礎構造

| パス | 目的 | 状態 |
| --- | --- | --- |
| `apps/guide` | 顧客向けのVitePressサイトとランディングページ | 作成済み |
| `apps/guide-internal` | 内部向けのVitePressサイト | 作成済み |
| `apps/web` | TanStack StartアプリケーションとoRPCクライアント | 土台のみ |
| `apps/api` | oRPCエンドポイントとauth・core・DBパッケージの組み合わせ | 土台のみ |
| `packages/auth` | Better Authの統合、認証、セッション、ロール、権限、認可のインターフェース | 土台のみ |
| `packages/core` | FinOpsのドメインロジック、ユースケース、永続化インターフェース | 土台のみ |
| `packages/db` | 認証データの永続化を含むDrizzleスキーマ、マイグレーション、D1アクセス | 土台のみ |

pnpm Workspaceで`apps/*`と`packages/*`を管理します。アプリ固有の組み立ては`apps/`、再利用する責務は`packages/`に置きます。両ガイドサイトは引き続きMarkdownからビルドします。

### 開発ツール

ワークスペースのタスク実行とキャッシュには、Turborepoに代わって**Vite+（VitePlus）**を使用します。パッケージ管理にはpnpmを継続して使用します。[Vite+ Run](https://viteplus.dev/guide/run)はパッケージの依存順にタスクを実行でき、パッケージスクリプトのキャッシュは明示的に有効化します。

Vite+はルートの開発依存として導入しており、グローバルインストールは不要です。`pnpm dev`・`pnpm typecheck`・`pnpm build`から`vp run`経由でワークスペースのタスクを実行します。型チェックとビルドはキャッシュを有効にしています。ガイドパッケージはVitePressのスクリプトを維持し、WebアプリはVite+でTanStack Startをビルドします。

### 見本の土台とCI

- `pnpm dev`で、両ガイド・Webアプリ・APIをVite+経由でまとめて起動します。
- Web: `http://127.0.0.1:3000`でTanStack StartのHello Worldを表示します。
- API: `http://127.0.0.1:8787`でCloudflare Workerをローカル実行します。`GET /`は挨拶を返し、`/rpc/hello`は認証なしのoRPCサンプルです。
- `packages/core`は挨拶を返す関数、`packages/db`はD1クライアントの生成関数を提供します。DB・スキーマ・マイグレーションはまだ作成していません。
- `packages/auth`はDB・ベースURL・シークレット・許可オリジンを受け取る、サーバー専用のBetter Auth初期化関数を提供します。認証ルート、ログイン方式、ロール、権限は有効にしておらず、APIにもまだ接続していません。
- Webの見本からoRPCはまだ呼び出しません。保護が必要な製品のエンドポイントと業務フローは、これから設計します。
- 共通パッケージはワークスペース内向けにTypeScriptソースを公開し、ビルド時にJavaScriptと型宣言を出力します。Webの生成済みルートツリーは管理対象に含め、新しいチェックアウトでも型チェックできるようにします。
- GitHub ActionsはPRと`main`へのPushで、ロックファイルを固定したインストール・`pnpm typecheck`・`pnpm build`を実行します。APIはWranglerのdry-runでビルドするため、CIにCloudflareアカウント・シークレット・デプロイ権限は不要です。

### ガイドのデプロイ

GitHub Actionsの`deploy-guides.yml`は`main`へのPushでCIと独立して実行され、両ガイドをCloudflare Workers Static Assetsへ並列にデプロイします。各ガイド自身の型チェックとビルドの成功を条件とし、リポジトリ全体のCI結果は待ちません。本番デプロイの実行は直列化し、複数のリリースが重ならないようにします。PRではビルドとWranglerのdry-run検証のみを行い、デプロイしません。各サイトは同じデプロイで英語・日本語を配信します。

| ガイド | Worker名 | 静的出力 |
| --- | --- | --- |
| 顧客向けガイド | `luckycat-guide` | `apps/guide/.vitepress/dist` |
| 内部ガイド | `luckycat-guide-internal` | `apps/guide-internal/.vitepress/dist` |

初回デプロイ前に、GitHubの`production`環境へ`CLOUDFLARE_ACCOUNT_ID`と`CLOUDFLARE_API_TOKEN`をSecretsとして設定します。APIトークンは対象アカウントに限定し、Workers Scriptsの編集権限を付与します。アカウントのworkers.devサブドメインも有効にします。認証情報はデプロイステップだけに渡し、CIでの検証には使用しません。

各ガイドの`wrangler.jsonc`でWorker名と静的ファイルの配置を定義します。デプロイ後は内部ガイドを含む両サイトがworkers.dev経由で公開されます。内部ガイドという名前にアクセス制御の効果はありません。独自ドメインやアクセス制限は未設定です。アプリケーション・APIのデプロイは別扱いで、CIではまだ設定していません。

## インフラ選定基準

運用コストを抑え、サービスを可能な限り無料で提供するために、**Cloudflare基盤を積極的に活用**します。無料提供は設計上の目標であり、すべての機能や処理量を無料で提供できると保証するものではありません。

データベースには**Cloudflare D1**を採用し、Drizzle ORMを通してアクセスします。スキーマとマイグレーションは`packages/db`で管理します。

アプリケーションのホスティングは、D1バインディングへのアクセス、TanStack Start・Better Authのランタイム互換性、運用コスト、デプロイの簡潔さを基準に検討します。実装時にはD1上でマイグレーションと認証の動作を検証します。

Cloudflareの仕様や制限が要件上許容できない場合は、該当する部分に他のクラウドプロバイダーを利用することも検討します。また、適した処理では**DuckDB WASM**などをブラウザ側で利用し、サーバー側の計算処理を減らす方法も検討します。処理要件、ブラウザのリソース消費、ユーザー体験、運用コスト全体を踏まえて評価し、これらは追加の採用決定ではなく検討候補として扱います。

ガイドはCloudflare Workers Static Assetsを使用します。アプリケーションの本番ホスティング・デプロイ設定、運用予算、例外的な構成: [未決定]。上記のCloudflareを優先する方針に沿って選定します。

---

このガイドはチームとAI開発者向けです。ソースはこのリポジトリで公開されています。
