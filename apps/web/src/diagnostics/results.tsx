import type { DiagnosticResult, Finding } from '@luckycat/core';
import { resultStyles } from './styles';

export type DiagnosticLocale = 'ja' | 'en';

const ruleNamesJa = {
  'unattached-persistent-disk': '未接続の永続ディスク',
  'unassigned-static-external-ipv4': '未割り当ての静的外部IPv4',
};
const sourceNamesJa = { disks: 'ディスク', addresses: 'IPアドレス' };
const reasonNames: Record<string, string> = {
  unsupported_prototype_price: 'この種類の仮単価は未設定です。',
  invalid_capacity: '容量を確認できないため算出していません。',
  authentication_failed: '認証できなかったため、データを取得していません。',
  disabled: 'ローカル認証モードが無効です。',
  invalid_credentials: '認証情報の形式を確認できません。ローカル設定を確認してください。',
  token_exchange_failed:
    '認証用トークンを取得できませんでした。鍵の有効性と接続環境を確認してください。',
  authentication_rejected: '読み取り要求で認証が拒否されました。',
  access_denied_or_api_disabled: '権限が不足しているか、必要なAPIが無効です。',
  quota_limited: 'Google Cloudのクォータ制限に達しました。',
  retrieval_failed: 'データの取得に失敗しました。',
  collection_timeout: '取得時間の上限に達しました。',
  response_size_limit: '応答サイズの上限に達しました。',
  page_limit: '取得ページ数の上限に達しました。',
  record_limit: '取得件数の上限に達しました。',
  unreachable_scope: 'この範囲にアクセスできませんでした。',
  provider_warning: '取得元から警告があり、完全な取得を確認できません。',
  scope_warning: 'この範囲のデータを確認できませんでした。',
  unsupported_scope: '現在の診断では対応していない範囲です。',
  invalid_response: '取得元の応答形式を確認できませんでした。',
  invalid_scope_response: 'この範囲の応答形式を確認できませんでした。',
  missing_resource_list: '必要なリソース一覧が応答にありません。',
  invalid_resource_identity: '対象範囲内のリソースとして識別できませんでした。',
  conflicting_resource: '同じリソースについて矛盾した情報を取得しました。',
  invalid_page_token: '次ページの取得情報が不正です。',
  repeated_page_token: '同じページの取得が繰り返されたため停止しました。',
  missing_or_invalid_evidence: '状態または参照先の情報が不足・不正です。',
  missing_disk_type: 'ディスク種別を確認できません。',
  unsupported_disk_type: 'このディスク種別はまだ評価対象外です。',
  replication_requires_review: 'レプリケーションのあるディスクは別途確認が必要です。',
  unknown_disk_state: '対応していないディスク状態です。',
  missing_or_invalid_address_type: 'アドレス種別またはIPバージョンを確認できません。',
  unknown_address_state: '対応していないアドレス状態です。',
  contradictory_address_state: '予約状態と参照先の情報が矛盾しています。',
};
const englishReasons: Record<string, string> = {
  unsupported_prototype_price: 'No prototype rate is available for this type.',
  invalid_capacity: 'Capacity could not be confirmed, so no amount was calculated.',
  authentication_failed: 'Data was not retrieved because authentication failed.',
  disabled: 'Local authentication mode is disabled.',
  invalid_credentials:
    'The credential format could not be verified. Check the local configuration.',
  token_exchange_failed:
    'An access token could not be obtained. Check the credentials and connection.',
  authentication_rejected: 'Authentication was rejected by the read request.',
  access_denied_or_api_disabled: 'Permissions are missing or a required API is disabled.',
  quota_limited: 'A Google Cloud quota limit was reached.',
  retrieval_failed: 'Data retrieval failed.',
  collection_timeout: 'The collection time limit was reached.',
  response_size_limit: 'The response size limit was reached.',
  page_limit: 'The page limit was reached.',
  record_limit: 'The record limit was reached.',
  unreachable_scope: 'This scope could not be reached.',
  provider_warning: 'The provider returned a warning; complete collection could not be confirmed.',
  scope_warning: 'Data in this scope could not be confirmed.',
  unsupported_scope: 'This scope is not supported by the current diagnostic.',
  invalid_response: 'The provider response format could not be verified.',
  invalid_scope_response: 'The response format for this scope could not be verified.',
  missing_resource_list: 'The required resource list is missing.',
  invalid_resource_identity: 'The resource could not be identified within the target scope.',
  conflicting_resource: 'Conflicting information was received for the same resource.',
  invalid_page_token: 'The next-page token is invalid.',
  repeated_page_token: 'Collection stopped because a page token was repeated.',
  missing_or_invalid_evidence: 'State or reference information is missing or invalid.',
  missing_disk_type: 'The disk type could not be confirmed.',
  unsupported_disk_type: 'This disk type is not yet evaluated.',
  replication_requires_review: 'Replicated disks require separate review.',
  unknown_disk_state: 'This disk state is not supported.',
  missing_or_invalid_address_type: 'The address type or IP version could not be confirmed.',
  unknown_address_state: 'This address state is not supported.',
  contradictory_address_state: 'The reservation state contradicts the reference information.',
};
export const explainReason = (reason: string, locale: DiagnosticLocale = 'ja') =>
  (locale === 'ja' ? reasonNames : englishReasons)[reason] ??
  (locale === 'ja'
    ? `詳細な理由を確認してください（${reason}）。`
    : `Review the reason (${reason}).`);
const usd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const copy = (locale: DiagnosticLocale) => (ja: string, en: string) => (locale === 'ja' ? ja : en);
const time = (value: string, locale: DiagnosticLocale) =>
  new Date(value).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US', { timeZoneName: 'short' });
function Candidate({ finding, locale }: { finding: Finding; locale: DiagnosticLocale }) {
  const t = copy(locale),
    r = finding.evidence,
    amount = finding.amount;
  const parts = finding.resource.split('/');
  const location =
    parts[2] === 'global'
      ? t('グローバル', 'Global')
      : `${parts[3]}${t(`（${parts[2] === 'zones' ? 'ゾーン' : 'リージョン'}）`, ` (${parts[2] === 'zones' ? 'zone' : 'region'})`)}`;
  return (
    <details className="candidate">
      <summary>
        <strong>{parts.at(-1)}</strong>
        <span>{location}</span>
        <span className="candidate-amount">
          {amount.status === 'estimated'
            ? t(`約${usd(amount.monthlyUsd)}/月（仮）`, `~${usd(amount.monthlyUsd)}/mo (prototype)`)
            : t('金額不明', 'Amount unknown')}
        </span>
      </summary>
      <div className="candidate-body">
        <p className="resource-id">{finding.resource}</p>
        <dl className="evidence-grid">
          <div>
            <dt>{t('取得時点', 'Observed at')}</dt>
            <dd>
              <time dateTime={r.observedAt}>{time(r.observedAt, locale)}</time>
            </dd>
          </div>
          <div>
            <dt>{t('取得時点の状態', 'Observed state')}</dt>
            <dd>
              {r.state === 'READY'
                ? t('利用可能（READY）', 'Ready (READY)')
                : r.state === 'RESERVED'
                  ? t('予約中（RESERVED）', 'Reserved (RESERVED)')
                  : (r.state ?? t('不明', 'Unknown'))}
            </dd>
          </div>
          <div>
            <dt>{t('参照先', 'References')}</dt>
            <dd>
              {r.referenceCount === null
                ? t('不明', 'Unknown')
                : t(`${r.referenceCount}件`, `${r.referenceCount}`)}
            </dd>
          </div>
          {r.diskType && (
            <div>
              <dt>{t('ディスク種別・容量', 'Disk type / capacity')}</dt>
              <dd>
                {r.diskType} /{' '}
                {r.sizeGb == null ? t('容量不明', 'Capacity unknown') : `${r.sizeGb} GiB`}
              </dd>
            </div>
          )}
          {r.ipVersion && (
            <div>
              <dt>{t('アドレス種別', 'Address type')}</dt>
              <dd>{t('静的外部IPv4', 'Static external IPv4')}</dd>
            </div>
          )}
          <div>
            <dt>{t('概算月額（仮）', 'Estimated monthly cost (prototype)')}</dt>
            <dd>
              {amount.status === 'estimated'
                ? t(`約${usd(amount.monthlyUsd)} USD/月`, `~${usd(amount.monthlyUsd)} USD/month`)
                : explainReason(amount.reason, locale)}
            </dd>
          </div>
          {amount.status === 'estimated' && (
            <div>
              <dt>{t('計算の内訳', 'Calculation')}</dt>
              <dd>
                {usd(amount.unitPriceUsd)} × {amount.quantity}{' '}
                {amount.unit === 'GiB-month'
                  ? t('GiB（月額）', 'GiB (monthly)')
                  : t('時間／月', 'hours/month')}
              </dd>
            </div>
          )}
          <div>
            <dt>{t('連続した未使用期間', 'Continuous unused duration')}</dt>
            <dd>{t('不明', 'Unknown')}</dd>
          </div>
        </dl>
        {r.referencesOmitted && (
          <p className="muted">
            {t(
              '参照先0件は、Google APIで空の参照先フィールドが省略された応答に基づきます。',
              'Zero references is based on a Google API response that omitted the empty references field.',
            )}
          </p>
        )}
        {(r.ipVersionInferred || r.addressTypeDefaulted) && (
          <p className="muted">
            {r.ipVersionInferred &&
              t(
                'IPバージョンは取得したアドレスの形式で確認しました。',
                'The IP version was confirmed from the address format. ',
              )}
            {r.addressTypeDefaulted &&
              t(
                'アドレス種別はGoogle APIの既定値で補完しました。',
                'The address type uses the Google API default.',
              )}
          </p>
        )}
        <p className="review-note">
          {t(
            '保持目的・再利用予定・復旧要件を確認してください。安全に削除できることを保証する結果ではありません。',
            'Check retention needs, reuse plans, and recovery requirements. This finding does not guarantee that deletion is safe.',
          )}
        </p>
      </div>
    </details>
  );
}

export function DiagnosticResults({
  result,
  locale = 'ja',
}: {
  result: DiagnosticResult;
  locale?: DiagnosticLocale;
}) {
  const t = copy(locale);
  const ruleNames =
    locale === 'ja'
      ? ruleNamesJa
      : {
          'unattached-persistent-disk': 'Unattached persistent disks',
          'unassigned-static-external-ipv4': 'Unassigned static external IPv4',
        };
  const sourceNames =
    locale === 'ja' ? sourceNamesJa : { disks: 'Disks', addresses: 'IP addresses' };
  const candidates = result.rules.flatMap((rule) => rule.candidates);
  const count = candidates.length;
  const estimated = candidates.flatMap((finding) =>
    finding.amount.status === 'estimated' ? [finding.amount.monthlyUsd] : [],
  );
  const subtotal = estimated.reduce((sum, value) => sum + value, 0);
  const complete = result.status === 'evaluated';
  const title =
    result.authentication === 'failed'
      ? t('認証に失敗しました', 'Authentication failed')
      : complete
        ? count
          ? t('見直し候補があります', 'Candidates for review')
          : t('評価範囲内で該当なし', 'No matches within the evaluated scope')
        : result.status === 'partially_evaluated'
          ? t('一部を評価できませんでした', 'Some scopes could not be evaluated')
          : t('診断を評価できませんでした', 'The diagnostic could not be evaluated');
  return (
    <section
      className="diagnostic-results"
      lang={locale}
      aria-label={t('診断結果', 'Diagnostic results')}
    >
      <style>{resultStyles}</style>
      <header className={`result-banner ${complete ? 'complete' : 'incomplete'}`}>
        <p className="eyebrow">
          {t('診断結果', 'Diagnostic results')} · {result.project}
        </p>
        <h2>{title}</h2>
        <p>
          {complete
            ? t(
                '今回取得・評価できた範囲の結果です。環境全体に問題がないことを保証しません。',
                'Results cover only the data retrieved and evaluated in this run. They do not establish that the entire environment is issue-free.',
              )
            : t(
                '未取得・未評価の範囲が残っています。候補の件数だけで判断しないでください。',
                'Some scopes remain uncollected or unevaluated. Do not judge the result by the candidate count alone.',
              )}
        </p>
        <p className="muted">
          {t('実行', 'Run')}:{' '}
          <time dateTime={result.startedAt}>{time(result.startedAt, locale)}</time> –{' '}
          <time dateTime={result.completedAt}>{time(result.completedAt, locale)}</time>
        </p>
        {result.authenticationReason && <p>{explainReason(result.authenticationReason, locale)}</p>}
      </header>
      {result.status !== 'not_evaluated' && (
        <div className="result-overview">
          <div className="candidate-count">
            <p className="eyebrow">{t('見直し候補', 'Candidates for review')}</p>
            <p>
              <strong>{t(`確認できた候補：${count}件`, `${count} candidates found`)}</strong>
            </p>
            <p className="muted">
              {t('取得時点の状態に基づく判定', 'Based on the observed current state')}
            </p>
          </div>
          {count > 0 && (
            <section
              className="prototype-estimate"
              aria-label={t('仮の価格推定', 'Prototype price estimate')}
            >
              <p className="eyebrow">
                {t('価格推定は仮実装 · USD', 'Prototype price estimate · USD')}
              </p>
              <h3>{t('概算月額の小計', 'Estimated monthly subtotal')}</h3>
              <p className="estimate-total">
                {estimated.length
                  ? t(`約${usd(subtotal)}/月`, `~${usd(subtotal)}/month`)
                  : t('金額不明', 'Amount unknown')}
              </p>
              <p>
                {t(
                  `算出済み ${estimated.length}件 ／ 金額不明 ${count - estimated.length}件`,
                  `${estimated.length} priced / ${count - estimated.length} amounts unknown`,
                )}
              </p>
              <p className="muted">
                {t(
                  '算出済みの候補だけの小計です。実請求額や確定した削減額ではありません。',
                  'Subtotal of priced candidates only. Not actual billing or confirmed savings.',
                )}
              </p>
              <details>
                <summary>{t('概算の前提を確認', 'Estimate assumptions')}</summary>
                <p>
                  {t(
                    '画面の利用感を確認するための固定単価による概算です。現在の状態が続く場合の費用を概算しています。削除・解放でき、代替費用が発生しなければ削減の目安になります。',
                    'Fixed rates provide a prototype estimate for evaluating the UI. They estimate the cost if the current state continues. Savings depend on being able to release the resource without replacement costs.',
                  )}
                </p>
                <p>
                  {t(
                    '地域差・割引・無料枠・BYOIPなどの個別条件は未反映です。IPv4は月730時間、リージョンのディスクはゾーンの2倍の仮単価を使います。未取得・未評価の範囲や金額不明の候補は小計に含みません。',
                    'Regional differences, discounts, free tiers, and BYOIP are not reflected. IPv4 assumes 730 hours/month; regional disks use twice the zonal prototype rate. Uncollected or unevaluated scopes and unpriced candidates are excluded.',
                  )}
                </p>
              </details>
            </section>
          )}
        </div>
      )}
      <div className="candidate-list-heading">
        <h3>{t('候補と判定根拠', 'Candidates and evidence')}</h3>
        <p className="muted">
          {t(
            '候補の行を開いて根拠を確認してください。',
            'Open a candidate row to review its evidence.',
          )}
        </p>
      </div>
      {result.rules.map((rule) => (
        <section className="rule-result" key={rule.rule} aria-label={ruleNames[rule.rule]}>
          <h4>
            {ruleNames[rule.rule]}{' '}
            <span className="badge">
              {rule.status === 'evaluated'
                ? t('評価済み', 'Evaluated')
                : rule.status === 'partially_evaluated'
                  ? t('一部未評価', 'Partly unevaluated')
                  : t('未評価', 'Not evaluated')}
            </span>
          </h4>
          <p className="muted">
            {rule.source === 'disks'
              ? t(
                  '利用可能な状態で、取得時点の参照先がない永続ディスクです。',
                  'Persistent disks in the ready state with no references at observation time.',
                )
              : t(
                  '予約中の静的外部IPv4で、取得時点の参照先がないものです。',
                  'Reserved static external IPv4 addresses with no references at observation time.',
                )}{' '}
            · {t('ルール', 'Rule')} v{rule.version}
          </p>
          {rule.candidates.map((finding) => (
            <Candidate key={finding.resource} finding={finding} locale={locale} />
          ))}
          {rule.candidates.length === 0 && (
            <p className="empty-result">
              {rule.conclusion === 'no_matching_candidates'
                ? t(
                    '評価範囲内で該当する候補はありませんでした。',
                    'No matching candidates within the evaluated scope.',
                  )
                : t(
                    '候補の有無は未確認です。未評価の理由を確認してください。',
                    'Whether candidates exist is unknown. Review the reasons for missing evaluation.',
                  )}
            </p>
          )}
          <p className="muted">
            {t(
              `評価できたリソース：${rule.evaluatedResources}件`,
              `Resources evaluated: ${rule.evaluatedResources}`,
            )}
          </p>
          {rule.unevaluated.length > 0 && (
            <details className="gaps" open>
              <summary>
                {t(
                  `未評価のリソース（${rule.unevaluated.length}件）`,
                  `Unevaluated resources (${rule.unevaluated.length})`,
                )}
              </summary>
              <ul>
                {rule.unevaluated.map((item, i) => (
                  <li key={`${item.resource}-${i}`}>
                    <span className="resource-id">{item.resource}</span>
                    <br />
                    {explainReason(item.reason, locale)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      ))}
      <section aria-label={t('取得範囲', 'Collection scope')} className="collection-results">
        <h3>{t('取得範囲と不足している情報', 'Collection scope and missing information')}</h3>
        {result.sources.map((source) => (
          <details
            key={source.source}
            open={source.status !== 'complete' || source.issues.length > 0}
          >
            <summary>
              {sourceNames[source.source]}:{' '}
              {source.status === 'complete'
                ? t('取得完了', 'Complete')
                : source.status === 'partial'
                  ? t('一部取得', 'Partial')
                  : source.status === 'failed'
                    ? t('取得失敗', 'Failed')
                    : t('未取得', 'Not collected')}
            </summary>
            <p>
              {t(
                `取得済み：${source.receivedResources}件 / ${source.pages}ページ。取得範囲：${source.scopes.length}スコープ。`,
                `Retrieved: ${source.receivedResources} resources / ${source.pages} pages. Coverage: ${source.scopes.length} scopes.`,
              )}
            </p>
            <p className="muted">
              {t('取得', 'Collection')}: {time(source.startedAt, locale)} –{' '}
              {time(source.completedAt, locale)}
            </p>
            {source.issues.length > 0 && (
              <ul>
                {source.issues.map((issue, i) => (
                  <li key={i}>
                    {explainReason(issue.reason, locale)}
                    {issue.scope && (
                      <>
                        <br />
                        <span className="resource-id">{issue.scope}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {source.scopes.length > 0 && (
              <details>
                <summary>{t('取得した範囲を表示', 'Show collected scopes')}</summary>
                <ul>
                  {source.scopes.map((scope) => (
                    <li key={scope}>{scope}</li>
                  ))}
                </ul>
              </details>
            )}
          </details>
        ))}
      </section>
      <details className="json-result">
        <summary>{t('診断JSONを表示', 'Show diagnostic JSON')}</summary>
        <p>
          {t(
            'リソース識別子を含むため、公開先へ貼り付けないでください。',
            'Contains resource identifiers. Do not paste into public destinations.',
          )}
        </p>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </section>
  );
}
