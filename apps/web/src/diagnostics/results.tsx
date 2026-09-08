import type { DiagnosticResult, Finding } from '@luckycat/core';

const ruleNames = { 'unattached-persistent-disk': '未接続の永続ディスク', 'unassigned-static-external-ipv4': '未割り当ての静的外部IPv4' };
const sourceNames = { disks: 'ディスク', addresses: 'IPアドレス' };
const reasonNames: Record<string, string> = {
  authentication_failed: '認証できなかったため、データを取得していません。', disabled: 'ローカル認証モードが無効です。',
  invalid_credentials: '認証情報の形式を確認できません。ローカル設定を確認してください。', token_exchange_failed: '認証用トークンを取得できませんでした。鍵の有効性と接続環境を確認してください。',
  authentication_rejected: '読み取り要求で認証が拒否されました。', access_denied_or_api_disabled: '権限が不足しているか、必要なAPIが無効です。',
  quota_limited: 'Google Cloudのクォータ制限に達しました。', retrieval_failed: 'データの取得に失敗しました。',
  collection_timeout: '取得時間の上限に達しました。', response_size_limit: '応答サイズの上限に達しました。', page_limit: '取得ページ数の上限に達しました。', record_limit: '取得件数の上限に達しました。',
  unreachable_scope: 'この範囲にアクセスできませんでした。', provider_warning: '取得元から警告があり、完全な取得を確認できません。', scope_warning: 'この範囲のデータを確認できませんでした。',
  unsupported_scope: '現在の診断では対応していない範囲です。', invalid_response: '取得元の応答形式を確認できませんでした。', invalid_scope_response: 'この範囲の応答形式を確認できませんでした。',
  missing_resource_list: '必要なリソース一覧が応答にありません。', invalid_resource_identity: '対象範囲内のリソースとして識別できませんでした。',
  conflicting_resource: '同じリソースについて矛盾した情報を取得しました。', invalid_page_token: '次ページの取得情報が不正です。', repeated_page_token: '同じページの取得が繰り返されたため停止しました。',
  missing_or_invalid_evidence: '状態または参照先の情報が不足・不正です。', missing_disk_type: 'ディスク種別を確認できません。', unsupported_disk_type: 'このディスク種別はまだ評価対象外です。',
  replication_requires_review: 'レプリケーションのあるディスクは別途確認が必要です。', unknown_disk_state: '対応していないディスク状態です。',
  missing_or_invalid_address_type: 'アドレス種別またはIPバージョンを確認できません。', unknown_address_state: '対応していないアドレス状態です。', contradictory_address_state: '予約状態と参照先の情報が矛盾しています。',
};
export const explainReason = (reason: string) => reasonNames[reason] ?? `詳細な理由を確認してください（${reason}）。`;
const time = (value: string) => new Date(value).toLocaleString('ja-JP', { timeZoneName: 'short' });
function location(resource: string) {
  const parts = resource.split('/');
  return parts[2] === 'global' ? 'グローバル' : `${parts[3]}（${parts[2] === 'zones' ? 'ゾーン' : 'リージョン'}）`;
}
function Candidate({ finding }: { finding: Finding }) {
  const r = finding.evidence;
  return <details className="candidate">
    <summary><strong>{finding.resource.split('/').at(-1)}</strong><span>{location(finding.resource)}</span><span className="badge">金額不明</span></summary>
    <div className="candidate-body">
      <p className="resource-id">{finding.resource}</p>
      <dl className="evidence-grid">
        <div><dt>取得時点</dt><dd><time dateTime={r.observedAt}>{time(r.observedAt)}</time></dd></div>
        <div><dt>取得時点の状態</dt><dd>{r.state === 'READY' ? '利用可能（READY）' : r.state === 'RESERVED' ? '予約中（RESERVED）' : r.state ?? '不明'}</dd></div>
        <div><dt>参照先</dt><dd>{r.referenceCount}件</dd></div>
        {r.diskType && <div><dt>ディスク種別・容量</dt><dd>{r.diskType} / {r.sizeGb === null || r.sizeGb === undefined ? '容量不明' : `${r.sizeGb} GiB`}</dd></div>}
        {r.ipVersion && <div><dt>アドレス種別</dt><dd>静的外部IPv4</dd></div>}
        <div><dt>削減可能額</dt><dd>不明（価格・請求データ未取得）</dd></div>
        <div><dt>連続した未使用期間</dt><dd>不明</dd></div>
      </dl>
      {r.referencesOmitted && <p className="muted">参照先0件は、Google APIで空の参照先フィールドが省略された応答に基づきます。</p>}
      {(r.ipVersionInferred || r.addressTypeDefaulted) && <p className="muted">{r.ipVersionInferred && 'IPバージョンは取得したアドレスの形式で確認しました。'}{r.addressTypeDefaulted && 'アドレス種別はGoogle APIの既定値で補完しました。'}</p>}
      <p>保持目的・再利用予定・復旧要件を確認してください。安全に削除できることを保証する結果ではありません。</p>
    </div>
  </details>;
}

export function DiagnosticResults({ result }: { result: DiagnosticResult }) {
  const count = result.rules.reduce((sum, rule) => sum + rule.candidates.length, 0);
  const complete = result.status === 'evaluated';
  const title = result.authentication === 'failed' ? '認証に失敗しました' : complete ? (count ? '見直し候補があります' : '評価範囲内で該当なし')
    : result.status === 'partially_evaluated' ? '一部を評価できませんでした' : '診断を評価できませんでした';
  return <section className="diagnostic-results" aria-label="診断結果">
    <header className={`result-banner ${complete ? 'complete' : 'incomplete'}`}>
      <p className="eyebrow">診断結果 · {result.project}</p><h3>{title}</h3>
      <p>{complete ? '今回取得・評価できた範囲の結果です。環境全体に問題がないことを保証しません。' : '未取得・未評価の範囲が残っています。候補の件数だけで判断しないでください。'}</p>
      {result.status !== 'not_evaluated' && <p><strong>確認できた候補：{count}件</strong> · 金額は不明</p>}
      <p className="muted">実行：<time dateTime={result.startedAt}>{time(result.startedAt)}</time> 〜 <time dateTime={result.completedAt}>{time(result.completedAt)}</time></p>
      {result.authenticationReason && <p>{explainReason(result.authenticationReason)}</p>}
    </header>
    {result.rules.map(rule => <section className="rule-result" key={rule.rule} aria-label={ruleNames[rule.rule]}>
      <h4>{ruleNames[rule.rule]} <span className="badge">{rule.status === 'evaluated' ? '評価済み' : rule.status === 'partially_evaluated' ? '一部未評価' : '未評価'}</span></h4>
      <p>{rule.source === 'disks' ? '利用可能な状態で、取得時点の参照先がない永続ディスクです。' : '予約中の静的外部IPv4で、取得時点の参照先がないものです。'} <span className="muted">ルール v{rule.version}</span></p>
      {rule.candidates.map(finding => <Candidate key={finding.resource} finding={finding} />)}
      {rule.candidates.length === 0 && <p className="empty-result">{rule.conclusion === 'no_matching_candidates' ? '評価範囲内で該当する候補はありませんでした。' : '候補の有無は未確認です。未評価の理由を確認してください。'}</p>}
      <p className="muted">評価できたリソース：{rule.evaluatedResources}件</p>
      {rule.unevaluated.length > 0 && <details className="gaps" open><summary>未評価のリソース（{rule.unevaluated.length}件）</summary><ul>{rule.unevaluated.map((item, i) => <li key={`${item.resource}-${i}`}><span className="resource-id">{item.resource}</span><br />{explainReason(item.reason)}</li>)}</ul></details>}
    </section>)}
    <section aria-label="取得範囲" className="collection-results"><h4>取得範囲と不足している情報</h4>
      {result.sources.map(source => <details key={source.source} open={source.status !== 'complete' || source.issues.length > 0}>
        <summary>{sourceNames[source.source]}：{source.status === 'complete' ? '取得完了' : source.status === 'partial' ? '一部取得' : source.status === 'failed' ? '取得失敗' : '未取得'}</summary>
        <p>取得済み：{source.receivedResources}件 / {source.pages}ページ。取得範囲：{source.scopes.length}スコープ。</p>
        <p className="muted">取得：{time(source.startedAt)} 〜 {time(source.completedAt)}</p>
        {source.issues.length > 0 && <ul>{source.issues.map((issue, i) => <li key={i}>{explainReason(issue.reason)}{issue.scope && <><br /><span className="resource-id">{issue.scope}</span></>}</li>)}</ul>}
        {source.scopes.length > 0 && <details><summary>取得した範囲を表示</summary><ul>{source.scopes.map(scope => <li key={scope}>{scope}</li>)}</ul></details>}
      </details>)}
    </section>
    <details className="json-result"><summary>診断JSONを表示</summary><p>リソース識別子を含むため、公開先へ貼り付けないでください。</p><pre>{JSON.stringify(result, null, 2)}</pre></details>
  </section>;
}
