import { useState } from 'react';
import { DiagnosticResults, type DiagnosticLocale } from './results';
import { createPreviewState, previewScenarios, type PreviewScenario } from './preview-data';
import restingCat from './resting.svg';

export function DiagnosticPreview() {
  const [locale, setLocale] = useState<DiagnosticLocale>('ja');
  const [scenario, setScenario] = useState<PreviewScenario>('findings');
  const t = (ja: string, en: string) => locale === 'ja' ? ja : en;
  const state = createPreviewState(scenario);
  return <div className="diagnostic-preview" lang={locale}>
    <style>{previewStyles}</style>
    <div className="preview-toolbar">
      <div><strong>{t('UIプレビュー', 'UI preview')}</strong><span>{t('架空データ · デザイン仮採用', 'Fictional data · Provisional design')}</span></div>
      <div className="preview-controls">
        <label>{t('表示状態', 'Scenario')}<select value={scenario} onChange={event => setScenario(event.target.value as PreviewScenario)}>
          {previewScenarios.map(item => <option key={item.id} value={item.id}>{item[locale]}</option>)}
        </select></label>
        <label>{t('言語', 'Language')}<select value={locale} onChange={event => setLocale(event.target.value as DiagnosticLocale)}><option value="ja">日本語</option><option value="en">English</option></select></label>
      </div>
    </div>
    <div className="preview-layout">
      <aside className="preview-sidebar"><a href="/dev/diagnostics" className="preview-brand">LuckyCat<span>FINOPS</span></a><p>{t('デモワークスペース', 'Demo workspace')}</p>
        <span className="preview-nav">{t('初回診断', 'First diagnostic')}</span>
        <div className="preview-cat"><img src={restingCat} width="72" height="40" alt="" /><small>{t('小さく、着実に。', 'Small, steady steps.')}</small></div>
      </aside>
      <div className="preview-content"><header className="preview-topbar">Google Cloud / {t('初回診断', 'First diagnostic')}<a href="/">{t('ローカル検証へ', 'Local diagnostics')}</a></header>
        <main><div className="preview-heading"><p>Google Cloud</p><h1>{t('リソースの見直し', 'Resource review')}</h1><p>{t('概要から候補を見つけ、個別の根拠を確認します。', 'Find candidates in the overview, then inspect the evidence for each one.')}</p></div>
          <p className="preview-notice">{t('開発専用の見本です。クラウドへの接続・データの保存は行いません。価格推定は固定単価による仮実装です。', 'Development preview only. No cloud connection or data storage. Price estimates use prototype fixed rates.')}</p>
          <div className="preview-state" role="status">{t('表示中', 'Showing')}: {previewScenarios.find(item => item.id === scenario)?.[locale]}</div>
          {state.kind === 'result' ? <DiagnosticResults key={`${scenario}-${locale}`} result={state.result} locale={locale} />
            : <section className="preview-request" aria-busy={state.kind === 'loading'}>
              <p className="preview-request-label">{t('診断リクエスト', 'Diagnostic request')}</p>
              <h2>{state.kind === 'loading' ? t('診断結果を読み込み中', 'Loading diagnostic results') : t('通信に失敗しました', 'The request failed')}</h2>
              <p>{state.kind === 'loading' ? t('結果を待っています。候補の有無や金額はまだ確認できません。', 'Waiting for a result. Candidates and amounts are not yet known.') : t('診断結果を取得できませんでした。候補の有無や金額は未確認です。', 'The result could not be retrieved. Candidates and amounts remain unknown.')}</p>
              <p>{t('これは表示状態の見本です。再試行や通信は発生しません。', 'This is a simulated request state. No retry or network request is made.')}</p>
            </section>}
        </main>
      </div>
    </div>
  </div>;
}

const previewStyles = `
body:has(.diagnostic-preview) { margin: 0; background: #f7f9f6; }
.diagnostic-preview { color: #293630; font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; }
.diagnostic-preview * { box-sizing: border-box; }
.diagnostic-preview a { color: #285642; text-underline-offset: 4px; }
.diagnostic-preview :is(a, select):focus-visible { outline: 3px solid #285642; outline-offset: 4px; }
.diagnostic-preview .preview-toolbar { padding: 14px 28px; background: #edf2e9; border-bottom: 1px solid #d7e0d1; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.diagnostic-preview .preview-toolbar strong { font-size: .875rem; }
.diagnostic-preview .preview-toolbar span { display: block; font-size: .8125rem; color: #58665d; }
.diagnostic-preview .preview-controls { display: flex; flex-wrap: wrap; gap: 16px; }
.diagnostic-preview label { font-size: .8125rem; display: flex; gap: 8px; align-items: center; }
.diagnostic-preview select { font: inherit; font-size: .875rem; border: 1px solid #b9c7b3; border-radius: 5px; background: white; color: inherit; padding: 8px 10px; max-width: 100%; }
.diagnostic-preview .preview-layout { display: grid; grid-template-columns: 204px minmax(0, 1fr); min-height: calc(100vh - 85px); }
.diagnostic-preview .preview-sidebar { padding: 32px 20px; border-right: 1px solid #e0e6dd; background: #f2f5ef; display: flex; flex-direction: column; align-items: flex-start; }
.diagnostic-preview .preview-brand { font-size: 1.5rem; font-weight: 700; letter-spacing: -.05em; color: #293630; text-decoration: none; }
.diagnostic-preview .preview-brand span { display: block; font-size: .625rem; letter-spacing: .2em; }
.diagnostic-preview .preview-sidebar p { font-size: .75rem; color: #58665d; margin: 28px 0 12px; }
.diagnostic-preview .preview-nav { width: 100%; padding: 9px 12px; border-radius: 4px; background: #e3ebdd; color: #285642; font-size: .875rem; font-weight: 600; }
.diagnostic-preview .preview-cat { margin-top: auto; padding-top: 48px; color: #58665d; }
.diagnostic-preview .preview-cat small { display: block; font-size: .75rem; }
.diagnostic-preview .preview-topbar { background: #fff; border-bottom: 1px solid #e0e6dd; padding: 16px 36px; font-size: .8125rem; color: #58665d; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.diagnostic-preview main { max-width: 1180px; padding: 36px 40px 64px; margin: 0 auto; }
.diagnostic-preview .preview-heading p { color: #58665d; margin: 6px 0; font-size: .875rem; }
.diagnostic-preview h1 { font-size: 1.875rem; line-height: 1.4; font-weight: 650; margin: 4px 0 10px; }
.diagnostic-preview .preview-notice { color: #58665d; font-size: .8125rem; border-bottom: 1px solid #e0e6dd; padding: 16px 0; margin-bottom: 8px; }
.diagnostic-preview .preview-state { color: #58665d; font-size: .8125rem; }
.diagnostic-preview .preview-request { border-left: 3px solid #9b793f; padding: 8px 24px; margin-top: 32px; overflow-wrap: anywhere; }
.diagnostic-preview .preview-request h2 { font-size: 1.5rem; }
.diagnostic-preview .preview-request-label { color: #58665d; font-size: .875rem; }
@media (max-width: 850px) {
  .diagnostic-preview .preview-layout { grid-template-columns: 1fr; }
  .diagnostic-preview .preview-sidebar { flex-direction: row; align-items: center; gap: 24px; padding: 12px 24px; border-right: 0; border-bottom: 1px solid #e0e6dd; flex-wrap: wrap; }
  .diagnostic-preview .preview-brand { font-size: 1.25rem; }
  .diagnostic-preview .preview-sidebar p, .diagnostic-preview .preview-cat { display: none; }
  .diagnostic-preview .preview-nav { width: auto; }
  .diagnostic-preview main { padding: 28px 24px 48px; }
  .diagnostic-preview .preview-topbar { padding: 12px 24px; }
}
@media (max-width: 420px) {
  .diagnostic-preview .preview-toolbar { padding: 14px 20px; }
  .diagnostic-preview .preview-controls { gap: 10px; }
  .diagnostic-preview main { padding: 24px 20px 40px; }
}
`;
