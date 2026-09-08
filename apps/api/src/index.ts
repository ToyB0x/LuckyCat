import { getGreeting } from '@luckycat/core';
import { os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';

const router = {
  hello: os.handler(() => ({ message: getGreeting() })),
};
const handler = new RPCHandler(router);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') {
      return Response.json({ message: getGreeting() });
    }
    const { response } = await handler.handle(request, { prefix: '/rpc' });
    return response ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler;
