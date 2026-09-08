import { parseDiagnosticResult, type DiagnosticResult } from '@luckycat/core';

export interface HistoryItem {
  id: string;
  project: string;
  diagnosedAt: string;
  savedAt: string;
  evaluation: DiagnosticResult['status'];
  candidateCount: number;
}
export interface HistoryPage {
  items: HistoryItem[];
  nextOffset: number | null;
}
export const historyId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const time = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
export async function historyRequest(path = '', init?: RequestInit): Promise<unknown> {
  const response = await fetch(`/local-debug/history${path}`, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
export function parseHistoryPage(value: unknown): HistoryPage {
  if (
    !object(value) ||
    !Array.isArray(value.items) ||
    value.items.length > 20 ||
    !(
      value.nextOffset === null ||
      (Number.isSafeInteger(value.nextOffset) && Number(value.nextOffset) >= 0)
    ) ||
    !value.items.every(
      (item) =>
        object(item) &&
        historyId(item.id) &&
        typeof item.project === 'string' &&
        time(item.diagnosedAt) &&
        time(item.savedAt) &&
        ['evaluated', 'partially_evaluated', 'not_evaluated'].includes(String(item.evaluation)) &&
        Number.isSafeInteger(item.candidateCount) &&
        Number(item.candidateCount) >= 0,
    )
  )
    throw new Error('Invalid history');
  return value as unknown as HistoryPage;
}
export function parseSavedResult(value: unknown, selected: HistoryItem) {
  if (!object(value) || value.id !== selected.id || !time(value.savedAt))
    throw new Error('Invalid saved result');
  return { savedAt: value.savedAt, result: parseDiagnosticResult(value.result, selected.project) };
}
