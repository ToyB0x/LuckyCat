import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import application from './index';
import { handleHistory, type HistorySettings } from './debug/history';
import { diagnoseGoogleCloud } from './debug/diagnose';
import { allowedProjects, checkGoogleConnection, debugEnabled, type DebugSettings } from './debug/check';

interface LocalEnv extends DebugSettings, HistorySettings {
  GOOGLE_CONNECTION_CHECK: Workflow<{ project: string }>;
}

export class LocalConnectionCheck extends WorkflowEntrypoint<LocalEnv, { project: string }> {
  async run(event: WorkflowEvent<{ project: string }>, step: WorkflowStep) {
    // Credential acquisition stays inside the step; tokens/keys never enter durable outputs.
    return step.do('Check Google Cloud access', { retries: { limit: 0, delay: '1 second' }, timeout: '1 minute' },
      () => checkGoogleConnection(this.env, event.payload.project));
  }
}

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export default {
  async fetch(request: Request, env: LocalEnv): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/local-debug/')) return application.fetch(request);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return new Response('Not found', { status: 404 });
    const origin = request.headers.get('Origin');
    if (origin && ![url.origin, 'http://127.0.0.1:3000', 'http://localhost:3000'].includes(origin)) return reply({ error: 'origin_denied' }, 403);
    if (request.method === 'GET' && url.pathname === '/local-debug/status') {
      return reply({ enabled: debugEnabled(env), credentialConfigured: Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON), projects: allowedProjects(env) });
    }
    if (url.pathname === '/local-debug/history' || url.pathname.startsWith('/local-debug/history/')) return handleHistory(request, env);
    if (!debugEnabled(env)) return reply({ error: 'debug_disabled' }, 403);
    try {
      if (request.method === 'GET' && url.pathname.startsWith('/local-debug/workflow/')) {
        const id = url.pathname.slice('/local-debug/workflow/'.length);
        if (!/^[a-f0-9-]{36}$/.test(id)) return reply({ error: 'invalid_workflow' }, 400);
        const state = await (await env.GOOGLE_CONNECTION_CHECK.get(id)).status();
        // Never expose arbitrary Workflow errors or stack traces.
        return reply({ status: state.status, ...(state.status === 'complete' ? { output: state.output } : {}) });
      }
      if (request.method !== 'POST' || !['/local-debug/check', '/local-debug/workflow', '/local-debug/diagnose'].includes(url.pathname)) return reply({ error: 'not_found' }, 404);
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'json_required' }, 415);
      const body: unknown = await request.json();
      if (!body || typeof body !== 'object' || !('project' in body) || typeof body.project !== 'string'
        || Object.keys(body).some(key => key !== 'project') || !allowedProjects(env).includes(body.project)) return reply({ error: 'project_not_allowed' }, 400);
      if (url.pathname === '/local-debug/diagnose') return reply(await diagnoseGoogleCloud(env, body.project));
      if (url.pathname === '/local-debug/check') return reply(await checkGoogleConnection(env, body.project));
      const instance = await env.GOOGLE_CONNECTION_CHECK.create({ id: crypto.randomUUID(), params: { project: body.project } });
      return reply({ id: instance.id }, 202);
    } catch {
      return reply({ error: 'local_check_failed' }, 400);
    }
  },
} satisfies ExportedHandler<LocalEnv>;
