import { parseDiagnosticResult } from '@luckycat/core';
import { createDatabase, diagnosticHistoryStore } from '@luckycat/db';
import { allowedProjects, type DebugSettings } from './check';

export interface HistorySettings extends DebugSettings {
  LOCAL_DIAGNOSTICS?: D1Database;
}
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const validId = (id: string) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
const maxBytes = 1024 * 1024;
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_result');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('result_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

/** Called only after the local host/origin guards; never calls a cloud API. */
export async function handleHistory(request: Request, env: HistorySettings): Promise<Response> {
  if (!env.LOCAL_DIAGNOSTICS) return reply({ error: 'history_unavailable' }, 503);
  const url = new URL(request.url),
    base = '/local-debug/history';
  const id = url.pathname === base ? undefined : url.pathname.slice(base.length + 1);
  if (id !== undefined && !validId(id)) return reply({ error: 'invalid_history_id' }, 400);
  const store = diagnosticHistoryStore(createDatabase(env.LOCAL_DIAGNOSTICS));
  try {
    if (request.method === 'GET' && id === undefined) {
      const offset = Number(url.searchParams.get('offset') ?? 0);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
        return reply({ error: 'invalid_offset' }, 400);
      const rows = await store.list(offset);
      return reply({ items: rows.slice(0, 20), nextOffset: rows.length > 20 ? offset + 20 : null });
    }
    if (request.method === 'GET' && id) {
      const row = await store.get(id);
      if (!row) return reply({ error: 'history_not_found' }, 404);
      try {
        return reply({
          id: row.id,
          savedAt: row.savedAt,
          result: parseDiagnosticResult(JSON.parse(row.resultJson), row.project),
        });
      } catch {
        return reply({ error: 'stored_result_unsupported' }, 422);
      }
    }
    if (request.method === 'DELETE' && id) {
      return (await store.remove(id))
        ? reply({ deleted: true })
        : reply({ error: 'history_not_found' }, 404);
    }
    if (request.method !== 'POST' || id !== undefined) return reply({ error: 'not_found' }, 404);
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
      return reply({ error: 'json_required' }, 415);
    let value: unknown;
    try {
      value = await readBody(request);
    } catch (error) {
      return reply(
        {
          error:
            error instanceof Error && error.message === 'result_too_large'
              ? 'result_too_large'
              : 'invalid_result',
        },
        error instanceof Error && error.message === 'result_too_large' ? 413 : 400,
      );
    }
    if (
      !value ||
      typeof value !== 'object' ||
      !('id' in value) ||
      typeof value.id !== 'string' ||
      !validId(value.id) ||
      !('result' in value) ||
      !value.result ||
      typeof value.result !== 'object' ||
      !('project' in value.result) ||
      typeof value.result.project !== 'string'
    )
      return reply({ error: 'invalid_result' }, 400);
    if (!allowedProjects(env).includes(value.result.project))
      return reply({ error: 'project_not_allowed' }, 403);
    let result;
    try {
      result = parseDiagnosticResult(value.result, value.result.project);
    } catch {
      return reply({ error: 'invalid_result' }, 400);
    }
    const resultJson = JSON.stringify(result);
    const row = await store.save({
      id: value.id,
      project: result.project,
      diagnosedAt: result.completedAt,
      savedAt: new Date().toISOString(),
      evaluation: result.status,
      candidateCount: result.rules.reduce((count, rule) => count + rule.candidates.length, 0),
      resultJson,
    });
    if (!row || row.resultJson !== resultJson) return reply({ error: 'history_id_conflict' }, 409);
    return reply({ id: row.id, savedAt: row.savedAt }, 201);
  } catch {
    return reply({ error: 'history_storage_failed' }, 503);
  }
}
