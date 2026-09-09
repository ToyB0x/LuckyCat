/* Isolated presentation reference, not a DiagnosticResult fixture or evaluator.
 * Keep real acquisition/evaluation/pricing in the application. No network/storage. */
(() => {
  const app = document.getElementById('app');
  let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ja';
  const initialView = new URLSearchParams(location.search).get('view');
  let scenario = ['pull-requests', 'grace-period'].includes(initialView) ? initialView : 'findings';
  let changeState = 'waiting';
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
    ['pull-requests', 'PR一覧 · 猫のお届け', 'PR list · Cat delivery'],
    ['grace-period', 'マージ後の猶予期間 · 仮案', 'Post-merge grace period · Proposal'],
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
  // Fictional GitHub presentation. Only the LuckyCat title opens a local detail view.
  function pullRequests() {
    const prIcon =
      '<svg class="gh-pr-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="3" r="1.7"/><circle cx="4" cy="13" r="1.7"/><circle cx="12" cy="13" r="1.7"/><path d="M4 5v6m8 0V6c0-2-1-3-4-3m0 0 2-2M8 3l2 2"/></g></svg>';
    const treasureTitle = '🐈 💰 Profit opportunity: disk · ~$96/year';
    const rows = [
      [352, treasureTitle, 'luckycat', '3 days ago'],
      [351, 'chore(deps): update dependency typescript', 'renovate', '4 days ago'],
      [349, 'chore(deps): update actions/checkout', 'renovate', '5 days ago'],
    ];
    return `<section class="gh-reference" aria-label="${l('GitHubのPR一覧を想定した架空の見本', 'Fictional GitHub pull request reference')}">
      <div class="gh-repo">demo-team <span>/</span> <strong>demo-infrastructure</strong><span class="gh-badge">Private</span></div>
      <div class="gh-tabs" aria-label="Repository tabs (mock)"><span>Code</span><span>Issues</span><span class="gh-active">${prIcon} Pull requests <span class="gh-count">${rows.length}</span></span><span>Actions</span><span>Security and quality</span><span>Insights</span><span>Settings</span></div>
      <div class="gh-body">
        <div id="gh-list-view">
          <div class="gh-toolbar"><div class="gh-search"><span>Filters ▾</span><span>⌕ &nbsp; is:pr is:open</span></div><span class="gh-control">Labels <span class="gh-count">9</span></span><span class="gh-control">Milestones <span class="gh-count">0</span></span><span class="gh-new">New pull request</span></div>
          <div class="gh-list"><div class="gh-list-header"><span class="gh-checkbox" aria-hidden="true"></span><strong>${prIcon} ${rows.length} Open</strong><span>✓ &nbsp;342 Closed</span><span class="gh-sort">Author ▾　 Label ▾　 Reviews ▾　 Sort ▾</span></div>
          <ul>${rows.map(([id, title, author, ago]) => `<li class="gh-row"><span class="gh-checkbox" aria-hidden="true"></span>${prIcon}<div class="gh-row-content"><div>${author === 'luckycat' ? `<button type="button" class="gh-title" id="open-treasure">${title}</button>` : `<span class="gh-title">${title}</span>`}${author === 'luckycat' ? ' <span class="gh-label">finops</span>' : ' <span class="gh-check" aria-label="Checks passed">✓</span>'}</div><p>#${id} opened ${ago} by ${author} <span class="gh-badge">Bot</span> <span class="gh-task">☷ 1 task</span></p></div><span class="gh-comments" aria-label="1 comment">▱ 1</span></li>`).join('')}</ul></div>
        </div>
        <section id="gh-detail-view" hidden tabindex="-1" aria-label="${l('お宝PRの詳細', 'Treasure PR detail')}">
          <button type="button" id="back-to-prs" class="gh-back">← Pull requests</button>
          <h1>${treasureTitle} <span class="gh-number">#352</span></h1>
          <p class="gh-detail-meta"><span class="gh-open">${prIcon} Open</span> luckycat wants to merge 1 commit into <code>main</code> from <code>luckycat/profit-opportunity</code></p>
          <div class="gh-detail-tabs">Conversation <span class="gh-count">1</span>　 Commits <span class="gh-count">1</span>　 Files changed <span class="gh-count">1</span></div>
          <article class="gh-comment"><header><strong>luckycat</strong> <span class="gh-badge">Bot</span> commented 3 days ago</header><div>
            <h2>${l('🐈 💰 お宝を見つけてきました', '🐈 💰 I found a profit opportunity')}</h2>
            <p>${l('未接続のディスクに、年約96ドルの利益改善候補があります。', 'An unattached disk offers a potential $96/year profit improvement.')}</p>
            <h3>${l('獲得できるかもしれないお宝', 'Treasure you could claim')}</h3>
            <p class="gh-profit">~$96 <span>USD / ${l('年の追加利益の可能性', 'year in potential additional profit')}</span></p>
            <p>${l('demo-cache-disk は、架空の取得時点では接続先がない200 GiBのディスクです。用途を終えたディスクなら、費用を回避して利益への貢献につなげられる可能性があります。', 'demo-cache-disk is a 200 GiB disk with no attachment in this fictional snapshot. If it is no longer needed, avoiding its cost could contribute to additional profit.')}</p>
            <h3>${l('お宝を獲得する前に', 'Before claiming the treasure')}</h3>
            <p>☐ ${l('保持目的・再利用予定・復旧要件を確認する', 'Review retention purpose, planned reuse, and recovery requirements')}</p>
            <p>${l('仮案では、マージ後に変更Issueを登録し、7日間の猶予と再確認を経て反映します。即座にリソースを削除するものではありません。', 'The proposal registers a change issue on merge, with application after a seven-day grace period and revalidation. Resources are not deleted immediately.')}</p>
            <p><a href="?lang=${language}&view=grace-period">${l('マージ後の猶予期間の見本を見る', 'View the post-merge grace period mock')}</a></p>
            <p class="gh-estimate-note">${l('価格推定は仮実装です。$0.04 × 200 GiB = 月約8ドルを12か月分に換算した年約96ドルの架空例です。同じ状態・単価が12か月続く前提で、地域差や割引は未反映です。表示額は実請求・確定利益・実現済み削減額ではありません。', 'Price estimation is a prototype: $0.04 × 200 GiB = about $8/month × 12 months = about $96/year. This fictional annual estimate assumes the same state and rate for 12 months, excluding regional differences and discounts. The amount is not actual billing, confirmed profit, or realized savings.')}</p>
          </div></article>
        </section>
      </div>
    </section>`;
  }
  function gracePeriod() {
    const states = [
      ['waiting', '猶予期間中', 'Grace period'],
      ['held', '保留中', 'On hold'],
      ['blocked', '再確認で停止', 'Blocked by recheck'],
      ['applied', '反映済み', 'Applied'],
    ];
    const status = states.find(([id]) => id === changeState);
    const waiting = changeState === 'waiting';
    const applied = changeState === 'applied';
    return `<section class="change-preview" aria-labelledby="change-title">
      <div class="change-controls"><span class="change-provisional">${l('UI・機能の仮案 · 実リソースは操作しません', 'UI / feature proposal · No real resource operations')}</span><label for="change-state">${l('状態の見本', 'Sample state')} <select id="change-state">${states.map(([id, ja, en]) => `<option value="${id}" ${id === changeState ? 'selected' : ''}>${l(ja, en)}</option>`).join('')}</select></label></div>
      <article class="change-issue"><header><div><p class="secondary">CHANGE-42 · ${l('変更Issue', 'Change issue')}</p><h2 id="change-title">${l('未接続ディスクの削除', 'Delete an unattached disk')}</h2></div><span class="change-status">${l(status[1], status[2])}</span></header>
        <p class="change-resource">demo-cache-disk <span class="secondary">· luckycat-demo / asia-northeast1-a</span></p>
        <div class="change-deadline"><strong>${waiting ? l('反映予定まで、あと4日', '4 days until scheduled application') : applied ? l('7日間の猶予と再確認を経て反映', 'Applied after seven days and revalidation') : l('反映を停止しています', 'Application is on hold')}</strong><p>${waiting ? l('7日間のうち3日が経過した架空の見本です。まだリソースは変更されていません。', 'Fictional example: day 3 of a seven-day grace period. Resources have not been changed.') : applied ? l('削除が完了した場合の表示見本です。実際の削除や利益の確定は行いません。', 'Sample display after a completed deletion. No actual deletion or profit verification occurs.') : changeState === 'blocked' ? l('期限後の再確認で接続先が見つかった想定です。自動では反映せず、担当者の確認を待ちます。', 'Assume a new attachment was found during the post-deadline recheck. Wait for review without applying the change.') : l('担当者が保留しました。予定時刻を過ぎても反映しません。', 'A reviewer placed this change on hold. It will not apply even after the scheduled time.')}</p></div>
        <dl class="change-facts">${pairs([
          [l('元のPR', 'Source PR'), '#352 · 🐈 💰 Profit opportunity: disk · ~$96/year'],
          [l('マージ日時（架空）', 'Merged at (fictional)'), '2026-09-01 09:00 JST'],
          [
            l('反映予定（マージから7日後）', 'Scheduled application (seven days after merge)'),
            '2026-09-08 09:00 JST',
          ],
          [l('予定する操作', 'Planned action'), l('このディスク1件の削除', 'Delete this one disk')],
        ])}</dl>
        ${waiting ? `<button type="button" class="change-hold" id="hold-change">${l('反映を保留する（モック）', 'Put on hold (mock)')}</button>` : ''}
      </article>
      <ol class="change-timeline">
        <li><strong>${l('1. PRをマージ', '1. Merge the PR')}</strong><p>${l('変更Issueを登録。ここでは削除しません。', 'Register a change issue. No deletion at this step.')}</p></li>
        <li><strong>${l('2. 7日間の猶予', '2. Seven-day grace period')}</strong><p>${l('担当者が用途・保持要件を確認。必要なら保留。', 'Review usage and retention requirements; put on hold if needed.')}</p></li>
        <li><strong>${l('3. 再確認して反映', '3. Revalidate and apply')}</strong><p>${l('期限後に状態・権限を再確認。条件を満たす場合に実行。', 'After the deadline, recheck state and permissions. Execute only if conditions are met.')}</p></li>
      </ol>
      <p class="secondary change-footnote">${l('仮案です。保留解除後の期限、実行権限、承認・通知の設計は未決定です。状態切り替えは表示のみで、時間経過による実行やクラウド接続はありません。', 'Proposal only. Deadlines after releasing a hold, execution permissions, approvals, and notifications are undecided. State changes affect only this display; no timed execution or cloud connection occurs.')}</p>
    </section>`;
  }
  function content() {
    if (scenario === 'grace-period') return gracePeriod();
    if (scenario === 'pull-requests') return pullRequests();
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
    const isPr = scenario === 'pull-requests';
    const isGrace = scenario === 'grace-period';
    const viewTitle = isPr
      ? l('プルリクエスト', 'Pull requests')
      : isGrace
        ? l('変更Issue', 'Change issues')
        : l('診断結果', 'Diagnostic result');
    document.body.classList.toggle('pr-mode', isPr);
    document.documentElement.lang = language;
    document.title = `LuckyCat — ${l('暫定フロント見本', 'Provisional frontend')}`;
    app.innerHTML = `<header class="reference-bar"><div><strong>${isPr ? l('PR一覧モック', 'PR list mock') : l('案1を仮採用 · HTMLデザイン見本', 'Option 1 · Provisional HTML reference')}</strong>${isPr ? '' : `<p>${l('デザイン・表現コンセプトは未確定。フロントは頻繁に変更予定です。', 'Visual style and expression are not finalized. Expect frequent frontend changes.')}</p>`}</div>
      <div class="preview-controls"><label for="scenario">${l('見本・表示状態', 'View / state')}<select id="scenario">${scenarios.map(([id, ja, en]) => `<option value="${id}" ${id === scenario ? 'selected' : ''}>${l(ja, en)}</option>`).join('')}</select></label>
        <label for="language">${l('言語', 'Language')}<select id="language"><option value="ja" ${language === 'ja' ? 'selected' : ''}>日本語</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></label></div></header>
      <div class="shell"><aside class="sidebar"><div><div class="wordmark">LuckyCat</div><p class="secondary">cloud companion</p></div><div class="workspace"><strong>Demo workspace</strong><span class="secondary">Google Cloud · 1 ${l('プロジェクト', 'project')}</span></div>
        <nav aria-label="${l('見本のナビゲーション', 'Reference navigation')}"><a class="nav-link" href="#main" aria-current="page">${viewTitle}</a></nav>
        <div class="cat-note"><img src="./resting.svg" width="48" height="27" alt=""><p class="secondary">${l('架空データのみ・接続なし', 'Synthetic data · No connection')}</p></div></aside>
      <div class="content"><div class="topbar"><span>Demo workspace / ${viewTitle}</span><span class="secondary">MOCK · ${l('実クラウドは操作しません', 'No cloud operations')}</span></div>
        <main id="main" tabindex="-1"><div class="heading"><p class="eyebrow">${isPr ? 'WORKFLOW CONCEPT / PULL REQUESTS' : isGrace ? 'PROPOSAL / CHANGE MANAGEMENT' : 'GOOGLE CLOUD / DIAGNOSTICS'}</p><h1>${isPr ? l('猫が届ける、小さな改善のきっかけ', 'A small opportunity, delivered by your cat') : isGrace ? l('マージのあとに、7日間の猶予を', 'Seven days between merge and application') : l('リソースの見直し候補', 'Resource review candidates')}</h1><p class="secondary">${isPr ? l('普段の開発フローに溶け込む、LuckyCatからの提案。', 'A proposal from LuckyCat, alongside your everyday development work.') : isGrace ? l('マージ → 変更Issue → 猶予期間 → 再確認・反映', 'Merge → Change issue → Grace period → Revalidate and apply') : `luckycat-demo · ${['loading', 'error', 'auth'].includes(scenario) ? l('診断結果は未確認', 'Results unconfirmed') : `${l('取得時点', 'Observed')} ${observed}`}`}</p></div>
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
    if (isPr) {
      const list = document.getElementById('gh-list-view');
      const detail = document.getElementById('gh-detail-view');
      document.getElementById('open-treasure').addEventListener('click', () => {
        list.hidden = true;
        detail.hidden = false;
        detail.focus();
      });
      document.getElementById('back-to-prs').addEventListener('click', () => {
        detail.hidden = true;
        list.hidden = false;
        document.getElementById('open-treasure').focus();
      });
    }
    if (isGrace) {
      document.getElementById('change-state').addEventListener('change', (event) => {
        changeState = event.target.value;
        render('change-state');
      });
      document.getElementById('hold-change')?.addEventListener('click', () => {
        changeState = 'held';
        render('change-state');
      });
    }
    if (focusId) document.getElementById(focusId).focus();
  }
  render();
})();
