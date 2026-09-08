import { useEffect, useRef, useState } from 'react';
import { DiagnosticResults, type DiagnosticLocale } from './results';
import {
  historyRequest,
  parseHistoryPage,
  parseSavedResult,
  type HistoryItem,
  type HistoryPage,
} from './history-client';

export function DiagnosticHistory() {
  const [locale, setLocale] = useState<DiagnosticLocale>('ja');
  const t = (ja: string, en: string) => (locale === 'ja' ? ja : en);
  const [offset, setOffset] = useState(0),
    [revision, setRevision] = useState(0);
  const [page, setPage] = useState<HistoryPage>();
  const [selected, setSelected] = useState<HistoryItem>();
  const [detail, setDetail] = useState<ReturnType<typeof parseSavedResult>>();
  const [listError, setListError] = useState(false),
    [detailError, setDetailError] = useState(false);
  const [confirm, setConfirm] = useState<string>(),
    [deleting, setDeleting] = useState(false),
    [deleteError, setDeleteError] = useState(false);
  const removal = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => removal.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    void historyRequest(`?offset=${offset}`, { signal: controller.signal })
      .then(parseHistoryPage)
      .then((value) => {
        if (!controller.signal.aborted) setPage(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setListError(true);
      });
    return () => controller.abort();
  }, [offset, revision]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void historyRequest(`/${selected.id}`, { signal: controller.signal })
      .then((value) => parseSavedResult(value, selected))
      .then((value) => {
        if (!controller.signal.aborted) setDetail(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailError(true);
      });
    return () => controller.abort();
  }, [selected]);
  function select(item?: HistoryItem) {
    if (item && item.id === selected?.id) return;
    setDetail(undefined);
    setDetailError(false);
    setSelected(item);
  }
  function reload(nextOffset = offset) {
    setListError(false);
    select();
    setConfirm(undefined);
    setPage(undefined);
    setOffset(nextOffset);
    setRevision((value) => value + 1);
  }
  async function remove(id: string) {
    const controller = new AbortController();
    removal.current = controller;
    setDeleting(true);
    setDeleteError(false);
    try {
      const value = await historyRequest(`/${id}`, { method: 'DELETE', signal: controller.signal });
      if (!value || typeof value !== 'object' || !('deleted' in value) || value.deleted !== true)
        throw new Error('Invalid delete response');
      if (!controller.signal.aborted)
        reload(page?.items.length === 1 && offset > 0 ? offset - 20 : offset);
    } catch {
      if (!controller.signal.aborted) setDeleteError(true);
    } finally {
      if (!controller.signal.aborted) setDeleting(false);
    }
  }
  const date = (value: string) =>
    new Date(value).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US', { timeZoneName: 'short' });
  return (
    <main className="diagnostic-history" lang={locale}>
      <style>{historyStyles}</style>
      <header>
        <div>
          <p className="history-eyebrow">LuckyCat · {t('ローカル開発用', 'Local development')}</p>
          <h1>{t('保存した診断結果', 'Saved diagnostic results')}</h1>
        </div>
        <label>
          {t('言語', 'Language')}{' '}
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as DiagnosticLocale)}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </label>
      </header>
      <nav>
        <a href="/">{t('ローカル診断へ', 'Local diagnostics')}</a>
        <a href="/dev/diagnostics">{t('架空データのUIプレビュー', 'Synthetic UI preview')}</a>
      </nav>
      <p>
        {t(
          '保存した時点の記録を表示します。現在のクラウド状態ではありません。閲覧・削除でクラウドには接続しません。',
          'These are saved snapshots, not current cloud state. Viewing or deleting them never connects to the cloud.',
        )}
      </p>
      <button type="button" disabled={deleting} onClick={() => reload()}>
        {t('履歴を再読み込み', 'Reload history')}
      </button>
      {listError ? (
        <p role="alert">
          {t(
            '履歴を取得できませんでした。ローカルAPIとD1のセットアップを確認してください。',
            'History could not be retrieved. Check the local API and D1 setup.',
          )}
        </p>
      ) : !page ? (
        <p>
          <output>{t('履歴を読み込み中…', 'Loading history…')}</output>
        </p>
      ) : (
        <section aria-label={t('保存履歴', 'Saved history')}>
          {!page.items.length && (
            <p>
              {t(
                'このページに保存済みの診断結果はありません。',
                'There are no saved diagnostic results on this page.',
              )}
            </p>
          )}
          <ul className="history-list">
            {page.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="history-entry"
                  disabled={deleting}
                  aria-pressed={selected?.id === item.id}
                  onClick={() => select(item)}
                >
                  <strong>{item.project}</strong>
                  <span>
                    {t('診断', 'Diagnosed')}: {date(item.diagnosedAt)}
                  </span>
                  <span>
                    {t('保存', 'Saved')}: {date(item.savedAt)}
                  </span>
                  <span>
                    {item.evaluation === 'evaluated'
                      ? t('評価済み', 'Evaluated')
                      : item.evaluation === 'partially_evaluated'
                        ? t('一部未評価', 'Partly unevaluated')
                        : t('未評価', 'Not evaluated')}
                    {item.evaluation !== 'not_evaluated' &&
                      t(
                        ` · 確認できた候補 ${item.candidateCount}件`,
                        ` · ${item.candidateCount} candidates found`,
                      )}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setConfirm(item.id);
                    setDeleteError(false);
                  }}
                >
                  {t('履歴を削除', 'Delete entry')}
                </button>
                {confirm === item.id && (
                  <div className="history-confirm">
                    <p>
                      {t(
                        'この保存履歴を削除します。クラウドリソースは変更しません。',
                        'Delete this saved entry? Cloud resources will not be changed.',
                      )}
                    </p>
                    <button type="button" disabled={deleting} onClick={() => void remove(item.id)}>
                      {deleting ? t('削除中…', 'Deleting…') : t('削除する', 'Confirm deletion')}
                    </button>
                    <button type="button" disabled={deleting} onClick={() => setConfirm(undefined)}>
                      {t('キャンセル', 'Cancel')}
                    </button>
                    {deleteError && (
                      <p role="alert">
                        {t(
                          '削除できませんでした。履歴を再読み込みして確認してください。',
                          'Deletion failed. Reload history to check its state.',
                        )}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="history-pagination">
            <button
              type="button"
              disabled={offset === 0 || deleting}
              onClick={() => reload(Math.max(0, offset - 20))}
            >
              {t('前へ', 'Previous')}
            </button>
            <span>{t(`${offset / 20 + 1}ページ`, `Page ${offset / 20 + 1}`)}</span>
            <button
              type="button"
              disabled={page.nextOffset === null || deleting}
              onClick={() => reload(page.nextOffset!)}
            >
              {t('次へ', 'Next')}
            </button>
          </div>
        </section>
      )}
      {selected && (
        <section className="history-detail" aria-label={t('保存結果の詳細', 'Saved result detail')}>
          <h2>{t('診断時点のスナップショット', 'Snapshot from the diagnosis')}</h2>
          {detailError ? (
            <p role="alert">
              {t(
                '保存結果を表示できませんでした。未対応の形式、取得失敗、または削除済みの可能性があります。該当なしを意味しません。',
                'The saved result could not be displayed. It may be unsupported, unavailable, or deleted. This does not mean there were no matches.',
              )}
            </p>
          ) : !detail ? (
            <p>
              <output>{t('保存結果を読み込み中…', 'Loading saved result…')}</output>
            </p>
          ) : (
            <>
              <p>
                {t('保存日時', 'Saved at')}: {date(detail.savedAt)}
              </p>
              <DiagnosticResults
                key={`${selected.id}-${locale}`}
                result={detail.result}
                locale={locale}
              />
            </>
          )}
        </section>
      )}
    </main>
  );
}
const historyStyles = `
body:has(.diagnostic-history) { margin: 0; background: #f7f9f6; }
.diagnostic-history { max-width: 1120px; margin: 40px auto; padding: 24px; font-family: system-ui, sans-serif; color: #293630; line-height: 1.65; overflow-wrap: anywhere; }
.diagnostic-history > header { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: center; }
.diagnostic-history h1 { font-size: 1.8rem; margin: 4px 0 16px; }
.diagnostic-history .history-eyebrow { color: #58665d; margin: 0; font-size: .875rem; }
.diagnostic-history nav { display: flex; flex-wrap: wrap; gap: 24px; }
.diagnostic-history a { color: #285642; text-underline-offset: 4px; }
.diagnostic-history button, .diagnostic-history select { font: inherit; border: 1px solid #b9c7b3; border-radius: 5px; background: white; color: #293630; padding: 8px 12px; cursor: pointer; }
.diagnostic-history button:disabled { opacity: .5; cursor: default; }
.diagnostic-history :is(button, select, a):focus-visible { outline: 3px solid #285642; outline-offset: 3px; }
.diagnostic-history .history-list { list-style: none; padding: 0; }
.diagnostic-history .history-list > li { padding: 16px 0; border-bottom: 1px solid #e0e6dd; }
.diagnostic-history .history-entry { width: 100%; text-align: left; border: 0; background: transparent; margin-bottom: 8px; overflow-wrap: anywhere; }
.diagnostic-history .history-entry[aria-pressed=true] { background: #e3ebdd; }
.diagnostic-history .history-entry span { display: block; font-size: .875rem; }
.diagnostic-history .history-confirm { padding: 12px; margin-top: 12px; background: #faf5e9; }
.diagnostic-history .history-confirm button { margin-right: 8px; }
.diagnostic-history .history-pagination { display: flex; align-items: center; gap: 16px; }
.diagnostic-history .history-detail { margin-top: 32px; border-top: 1px solid #e0e6dd; padding-top: 24px; }
`;
