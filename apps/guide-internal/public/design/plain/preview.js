/* Isolated presentation reference, not a DiagnosticResult fixture or evaluator.
 * Keep real acquisition/evaluation/pricing in the application. No network/storage. */
(() => {
  const app = document.getElementById('app');
  let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ja';
  let scenario = 'findings';
  const l = (ja, en) => (language === 'ja' ? ja : en);
  const usd = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const observed = '2026-09-08 09:00 JST';
  const scenarios = [
    ['findings', '候補あり', 'Findings'],
    ['many', '候補50件', '50 findings'],
    ['empty', '該当なし', 'No matches'],
    ['partial', '部分取得', 'Partial collection'],
    ['unknown', '金額不明', 'Unknown amounts'],
    ['auth', '認証失敗', 'Authentication failed'],
    ['error', '通信失敗', 'Transport failed'],
    ['loading', '読み込み中', 'Loading'],
  ];
  // Fixed presentation data only; amounts are not calculated from cloud resources.
  const sample = [
    {
      name: 'demo-cache-disk',
      kind: 'disk',
      type: 'pd-standard',
      capacity: '200 GiB',
      value: 8,
      basis: '$0.04 × 200 GiB',
      zone: 'asia-northeast1-a',
    },
    {
      name: 'demo-reserved-ip',
      kind: 'ip',
      value: 7.3,
      basis: '$0.01 × 730 h',
      zone: 'asia-northeast1',
    },
    {
      name: 'demo-review-disk',
      kind: 'disk',
      type: 'pd-extreme',
      capacity: '500 GiB',
      value: null,
      basis: null,
      zone: 'asia-northeast1-a',
    },
  ];
  const pairs = (entries) =>
    entries.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
  function candidate(item) {
    const disk = item.kind === 'disk';
    const rule = disk ? 'unattached-persistent-disk' : 'unassigned-static-external-ipv4';
    const path = `projects/luckycat-demo/${disk ? 'zones' : 'regions'}/${item.zone}/${disk ? 'disks' : 'addresses'}/${item.name}`;
    const kind = disk
      ? l('未接続の永続ディスク', 'Unattached persistent disk')
      : l('未割り当ての静的外部IPv4', 'Unassigned static external IPv4');
    return `<details class="candidate">
      <summary><div><span class="name">${item.name}</span><span class="type secondary">${kind}</span></div>
        <span class="secondary">${item.zone}</span><span class="money"><span>${item.value === null ? l('金額不明', 'Amount unknown') : `${usd(item.value)} / ${l('月', 'mo')}`}</span><span class="secondary">${l('根拠を確認', 'Review evidence')}</span></span></summary>
      <div class="evidence"><p class="resource">${path}</p><dl>${pairs([
        [l('取得時点', 'Observed at'), observed],
        [
          l('状態 / 参照先', 'State / references'),
          `${disk ? 'READY' : 'RESERVED'} / ${l('参照先0件', '0 references')}`,
        ],
        [l('ルール / バージョン', 'Rule / version'), `<span class="resource">${rule} / v1</span>`],
        [l('構成', 'Configuration'), disk ? `${item.type} / ${item.capacity}` : 'EXTERNAL / IPV4'],
        [
          l('連続した未使用期間', 'Continuous unused duration'),
          l('不明（現在の状態のみ）', 'Unknown (current state only)'),
        ],
        [
          l('概算の内訳（仮）', 'Prototype estimate basis'),
          item.value === null
            ? l(
                'この見本では単価未設定のため算出していません。',
                'No price is configured in this sample.',
              )
            : `${item.basis} = ${usd(item.value)} USD/${l('月', 'month')}`,
        ],
      ])}</dl><p class="review">${l('保持目的・再利用予定・復旧要件を確認してください。現在の参照先がないことは、安全に削除できる証明ではありません。', 'Check retention purpose, planned reuse, and recovery requirements. No current references does not prove that deletion is safe.')}</p></div>
    </details>`;
  }
  function content() {
    if (['auth', 'error', 'loading'].includes(scenario)) {
      const loading = scenario === 'loading';
      return `<section class="notice ${loading ? '' : 'error'}" role="${loading ? 'status' : 'alert'}">
        <h2>${loading ? l('診断中です', 'Diagnosis in progress') : scenario === 'auth' ? l('認証できませんでした', 'Authentication failed') : l('診断結果を受け取れませんでした', 'Could not receive the result')}</h2>
        <p>${loading ? l('以前の結果は表示していません。この見本は自動で完了しません。上の状態を切り替えてください。', 'Previous results are hidden. This mock does not complete automatically; choose another state above.') : scenario === 'auth' ? l('データは未取得・未評価です。認証情報と接続設定を確認してから、再度診断してください。', 'Data was not collected or evaluated. Check credentials and connection settings before trying again.') : l('候補の有無は未確認です。接続を確認してください。通信失敗は、サーバー側の診断停止を意味しません。', 'Findings are unconfirmed. Check the connection. A transport failure does not prove the server stopped the diagnosis.')}</p>
        <p>${l('これは表示のみの見本です。接続確認・再試行は行いません。', 'Presentation only: no connection check or retry is performed.')}</p></section>`;
    }
    let rows =
      scenario === 'empty'
        ? []
        : scenario === 'many'
          ? Array.from({ length: 50 }, (_, index) => ({
              ...sample[index % 3],
              name: `${sample[index % 3].name}-${String(index + 1).padStart(2, '0')}`,
            }))
          : sample.map((item) => ({ ...item, value: scenario === 'unknown' ? null : item.value }));
    const priced = rows.filter((item) => item.value !== null);
    const subtotal = priced.reduce((sum, item) => sum + item.value, 0);
    const partial = scenario === 'partial';
    return `${partial ? `<section class="notice warning" role="status"><h2>${l('候補が見つかりましたが、一部を取得できていません', 'Findings available; some scope could not be collected')}</h2><p>${l('ディスクの europe-west1-b はアクセス不可でした。取得・評価できた候補は残しています。下の取得範囲を確認してください。', 'Disk scope europe-west1-b was inaccessible. Valid findings remain visible. Review collection coverage below.')}</p></section>` : ''}
      <dl class="summary">${pairs([
        [
          l('確認できた候補', 'Observed candidates'),
          `${rows.length}<small> ${l('件', 'items')}</small>`,
        ],
        [
          l('候補リソースの概算月額・算出分のみ', 'Candidate monthly cost · priced portion'),
          `<span class="amount">${!rows.length ? '—' : priced.length ? usd(subtotal) : l('金額不明', 'Unknown')}</span>${priced.length ? '<small> USD</small>' : ''}`,
        ],
        [
          l('取得・評価', 'Collection / evaluation'),
          `<small>${partial ? l('一部未完了', 'Partially complete') : l('対象範囲は完了', 'Complete within scope')}</small>`,
        ],
      ])}</dl>
      <p class="pricing-note">${l('価格推定は仮実装。', 'Price estimation is a prototype.')} ${l(`算出済み ${priced.length}件 / 金額不明 ${rows.length - priced.length}件。`, `Priced ${priced.length} / unknown ${rows.length - priced.length}.`)} ${l('固定単価による現在の状態が続く場合の概算費用です。実請求・実現済み削減額ではなく、地域差・割引等は未反映です。', 'Fixed-rate cost estimate if the current state continues. Not actual billing or realized savings; regional rates, discounts, and other conditions are not reflected.')}</p>
      ${
        rows.length
          ? `<section aria-labelledby="findings-heading"><div class="list-heading"><h2 id="findings-heading">${l('見直し候補', 'Review candidates')}</h2><span class="secondary">${l('行を開くと根拠を確認できます', 'Expand a row to review evidence')}</span></div><div class="candidate-list">${rows.map(candidate).join('')}</div></section>`
          : `<section class="empty"><h2>${l('評価範囲内で該当する候補はありませんでした', 'No matching candidates within evaluated scope')}</h2><p>${l('今回の2ルール・取得範囲に限った結果です。環境全体の健全性や支出ゼロを示すものではありません。', 'This applies only to the two rules and collected scope. It does not establish a healthy whole environment or zero spend.')}</p></section>`
      }
      <details class="coverage" ${partial ? 'open' : ''}><summary>${l('取得範囲と不足している情報', 'Collection coverage and missing information')}</summary><ul>
        <li>${l('ディスク', 'Disks')}: asia-northeast1-a — ${l('取得・評価済み', 'collected and evaluated')}</li>
        <li>${l('静的外部IPv4', 'Static external IPv4')}: asia-northeast1 — ${l('取得・評価済み', 'collected and evaluated')}</li>
        ${partial ? `<li>${l('ディスク', 'Disks')}: europe-west1-b — ${l('取得不可・未評価（到達できない範囲）', 'inaccessible and unevaluated (unreachable scope)')}</li>` : ''}
      </ul><p class="secondary">${l('観測は現在の状態のみです。継続的な未使用期間、保持目的、実際の請求額は不明です。', 'Current-state observation only. Continuous unused duration, retention intent, and actual billing remain unknown.')}</p></details>`;
  }
  function render(focusId) {
    document.documentElement.lang = language;
    document.title = `LuckyCat — ${l('暫定フロント見本', 'Provisional frontend')}`;
    app.innerHTML = `<header class="reference-bar"><div><strong>${l('案1を仮採用 · HTMLデザイン見本', 'Option 1 · Provisional HTML reference')}</strong><p>${l('デザイン・表現コンセプトは未確定。フロントは頻繁に変更予定です。', 'Visual style and expression are not finalized. Expect frequent frontend changes.')}</p></div>
      <div class="preview-controls"><label for="scenario">${l('表示状態', 'State')}<select id="scenario">${scenarios.map(([id, ja, en]) => `<option value="${id}" ${id === scenario ? 'selected' : ''}>${l(ja, en)}</option>`).join('')}</select></label>
        <label for="language">${l('言語', 'Language')}<select id="language"><option value="ja" ${language === 'ja' ? 'selected' : ''}>日本語</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></label></div></header>
      <div class="shell"><aside class="sidebar"><div><div class="wordmark">LuckyCat</div><p class="secondary">cloud companion</p></div><div class="workspace"><strong>Demo workspace</strong><span class="secondary">Google Cloud · 1 ${l('プロジェクト', 'project')}</span></div>
        <nav aria-label="${l('見本のナビゲーション', 'Reference navigation')}"><a class="nav-link" href="#main" aria-current="page">${l('診断結果', 'Diagnostic result')}</a></nav>
        <div class="cat-note"><img src="./resting.svg" width="48" height="27" alt=""><p class="secondary">${l('架空データのみ・接続なし', 'Synthetic data · No connection')}</p></div></aside>
      <div class="content"><div class="topbar"><span>Demo workspace / ${l('診断結果', 'Diagnostic result')}</span><span class="secondary">MOCK · ${l('実クラウドは操作しません', 'No cloud operations')}</span></div>
        <main id="main" tabindex="-1"><div class="heading"><p class="eyebrow">GOOGLE CLOUD / DIAGNOSTICS</p><h1>${l('リソースの見直し候補', 'Resource review candidates')}</h1><p class="secondary">luckycat-demo · ${['loading', 'error', 'auth'].includes(scenario) ? l('診断結果は未確認', 'Results unconfirmed') : `${l('取得時点', 'Observed')} ${observed}`}</p></div>
          <div id="result" aria-live="polite">${content()}</div>
          <footer>${l('デザイン検討用。保存・削除・通知は行いません。アプリ本体への組み込みは別作業です。', 'Design reference only. No persistence, deletion, or notifications. Application integration is a separate task.')}</footer>
        </main></div></div>`;
    document.getElementById('scenario').addEventListener('change', (event) => {
      scenario = event.target.value;
      render('scenario');
    });
    document.getElementById('language').addEventListener('change', (event) => {
      language = event.target.value;
      render('language');
    });
    if (focusId) document.getElementById(focusId).focus();
  }
  render();
})();
