import { afterEach, test, vi } from 'vite-plus/test';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import assert from 'node:assert/strict';
import { DiagnosticPreview } from '../src/diagnostics/preview';
import { createPreviewState, previewScenarios } from '../src/diagnostics/preview-data';
import { parseDiagnosticResult } from '../src/diagnostics/response';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('all synthetic results pass the real response boundary; request states have no result', () => {
  for (const scenario of previewScenarios) {
    const state = createPreviewState(scenario.id);
    if (state.kind === 'result') assert.deepEqual(parseDiagnosticResult(state.result, 'luckycat-demo'), state.result);
    else assert.equal('result' in state, false);
  }
  const many = createPreviewState('many');
  assert.equal(many.kind === 'result' && many.result.rules.reduce((count, rule) => count + rule.candidates.length, 0), 50);
});

for (const locale of ['ja', 'en'] as const) test(`all eight ${locale} states render without network access and preserve result meaning`, () => {
  const fetcher = vi.fn(() => { throw new Error('Preview must not fetch'); });
  vi.stubGlobal('fetch', fetcher);
  render(<DiagnosticPreview />);
  if (locale === 'en') fireEvent.change(screen.getByRole('combobox', { name: '言語' }), { target: { value: locale } });
  const control = screen.getByRole('combobox', { name: locale === 'ja' ? '表示状態' : 'Scenario' });
  for (const scenario of previewScenarios) {
    fireEvent.change(control, { target: { value: scenario.id } });
    assert.match(screen.getByRole('status').textContent ?? '', new RegExp(scenario[locale]));
    assert.ok(screen.getByText(locale === 'ja' ? '架空データ · デザイン仮採用' : 'Fictional data · Provisional design'));
    const result = screen.queryByRole('region', { name: locale === 'ja' ? '診断結果' : 'Diagnostic results' });
    if (scenario.id === 'loading' || scenario.id === 'transport') {
      assert.equal(result, null);
      assert.ok(screen.getByRole('heading', { name: scenario.id === 'loading' ? (locale === 'ja' ? '診断結果を読み込み中' : 'Loading diagnostic results') : (locale === 'ja' ? '通信に失敗しました' : 'The request failed') }));
    } else {
      assert.ok(result);
      const rows = result.querySelectorAll('.candidate');
      assert.equal(rows.length, scenario.id === 'many' ? 50 : ['empty', 'authentication'].includes(scenario.id) ? 0 : 3);
      if (scenario.id === 'partial') {
        assert.ok(within(result).getByRole('heading', { name: locale === 'ja' ? '一部を評価できませんでした' : 'Some scopes could not be evaluated' }));
        assert.ok(within(result).getByText('zones/europe-west1-b'));
      }
      if (scenario.id === 'unknown') {
        assert.ok(within(result).getByText(locale === 'ja' ? '算出済み 0件 ／ 金額不明 3件' : '0 priced / 3 amounts unknown'));
        assert.doesNotMatch(result.textContent ?? '', /\$0\.00/);
      }
      if (scenario.id === 'authentication') {
        assert.equal(result.querySelector('.candidate-count'), null);
        assert.equal(within(result).queryByRole('heading', { name: locale === 'ja' ? '評価範囲内で該当なし' : 'No matches within the evaluated scope' }), null);
      }
      if (locale === 'en') assert.doesNotMatch(result.textContent ?? '', /[ぁ-ゖァ-ヺ一-龯]/);
    }
  }
  assert.equal(fetcher.mock.calls.length, 0);
});

test('candidate evidence is shared, collapsed initially and reset when the scenario changes', () => {
  render(<DiagnosticPreview />);
  const row = screen.getByText('demo-cache-disk').closest('details');
  assert.equal(row?.open, false);
  fireEvent.click(screen.getByText('demo-cache-disk'));
  assert.equal(row?.open, true);
  assert.ok(screen.getByText('pd-standard / 200 GiB'));
  assert.ok(screen.getByText('約$8.00 USD/月'));
  assert.ok(screen.getByText('約$15.30/月'));
  assert.ok(screen.getByText('算出済み 2件 ／ 金額不明 1件'));
  const control = screen.getByRole('combobox', { name: '表示状態' });
  fireEvent.change(control, { target: { value: 'loading' } });
  assert.equal(screen.queryByText('demo-cache-disk'), null);
  fireEvent.change(control, { target: { value: 'findings' } });
  assert.equal(screen.getByText('demo-cache-disk').closest('details')?.open, false);
});
