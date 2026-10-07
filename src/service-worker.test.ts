import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('./service-worker.ts', import.meta.url), 'utf8').replace(
  /import \{ build, files, prerendered, version \} from '\$service-worker';/,
  `const build = ['/app.js']; const files = ['/logo192.png']; const prerendered = ['/']; const version = 'test';`,
);
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function setup() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const stored = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (request: Request | string) => stored.get(typeof request === 'string' ? request : request.url)),
    put: vi.fn(async () => {}),
    delete: vi.fn(async () => true),
    addAll: vi.fn(async () => {}),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => ['cache-old', 'offline-old', 'cache-test', 'offline-test', 'another-app']),
    delete: vi.fn<(key: string) => Promise<boolean>>(async () => true),
  };
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async () => new Response('network'));
  const worker = {
    location: new URL('https://money.test/service-worker.js'),
    addEventListener: (type: string, handler: (event: unknown) => void) => (handlers[type] = handler),
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(),
  };
  vm.runInNewContext(compiled, { self: worker, caches, fetch, URL });
  function dispatch(path: string, mode = 'navigate', method = 'GET') {
    const event = {
      request: { url: new URL(path, worker.location).href, mode, method, headers: new Headers(), cache: 'default' },
      respondWith: vi.fn(),
      waitUntil: vi.fn(),
    };
    handlers.fetch(event);
    return event;
  }
  return { cache, caches, stored, fetch, worker, handlers, dispatch };
}

describe('PWA startup cache', () => {
  it('serves the public entry immediately without a network request, including a launch query', async () => {
    const s = setup();
    s.stored.set('/', new Response('public shell'));
    const event = s.dispatch('/?source=pwa');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('public shell');
    expect(s.fetch).not.toHaveBeenCalled();
    expect(s.caches.open).toHaveBeenCalledWith('cache-test');
  });

  it('falls back to network when entry cache access fails', async () => {
    const s = setup();
    s.caches.open.mockRejectedValue(new Error('storage unavailable'));
    const event = s.dispatch('/');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('network');
  });

  it('uses the current precache for versioned assets', async () => {
    const s = setup();
    s.stored.set('/app.js', new Response('cached code'));
    const event = s.dispatch('/app.js', 'cors');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('cached code');
    expect(s.fetch).not.toHaveBeenCalled();
  });

  it.each(['/api/v2/snapshot', '/api/v2/auth/tokens', 'https://other.test/page'])(
    'never intercepts private or external %s',
    (path) => {
      const s = setup();
      expect(s.dispatch(path, 'cors').respondWith).not.toHaveBeenCalled();
      expect(s.caches.open).not.toHaveBeenCalled();
    },
  );

  it('does not replace a deep link with the root shell', async () => {
    const s = setup();
    s.stored.set('/', new Response('public shell'));
    const event = s.dispatch('/accounts?account-card=example');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('network');
    expect(s.fetch.mock.calls[0][0].url).toBe('https://money.test/accounts?account-card=example');
  });

  it('does not wait for a slow cache write before returning streamed HTML', async () => {
    const s = setup();
    s.cache.put.mockReturnValue(new Promise(() => {}));
    const event = s.dispatch('/accounts');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('network');
    expect(event.waitUntil).toHaveBeenCalled();
  });

  it.each([401, 500])('does not cache HTTP %i', async (status) => {
    const s = setup();
    s.fetch.mockResolvedValue(new Response('error', { status }));
    const event = s.dispatch('/accounts');
    expect((await event.respondWith.mock.calls[0][0]).status).toBe(status);
    expect(s.cache.put).not.toHaveBeenCalled();
  });

  it('does not cache a redirected document under the original URL', async () => {
    const s = setup();
    const response = new Response('redirected login');
    Object.defineProperty(response, 'redirected', { value: true });
    s.fetch.mockResolvedValue(response);
    const event = s.dispatch('/accounts');
    await event.respondWith.mock.calls[0][0];
    expect(s.cache.put).not.toHaveBeenCalled();
  });

  it('honors case-insensitive no-store and removes the old runtime response', async () => {
    const s = setup();
    s.fetch.mockResolvedValue(new Response('private', { headers: { 'Cache-Control': 'private, NO-STORE' } }));
    const event = s.dispatch('/accounts');
    await event.respondWith.mock.calls[0][0];
    await Promise.all(event.waitUntil.mock.calls.map(([promise]) => promise));
    expect(s.cache.put).not.toHaveBeenCalled();
    expect(s.cache.delete).toHaveBeenCalled();
  });

  it('retains the existing exact deep-link fallback offline', async () => {
    const s = setup();
    s.fetch.mockRejectedValue(new TypeError('offline'));
    s.stored.set('https://money.test/accounts', new Response('cached accounts'));
    const event = s.dispatch('/accounts');
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('cached accounts');
  });

  it('precaches the public shell without taking over open clients', async () => {
    const s = setup();
    const event = { waitUntil: vi.fn() };
    s.handlers.install(event);
    await event.waitUntil.mock.calls[0][0];
    expect(s.cache.addAll).toHaveBeenCalledWith(['/app.js', '/logo192.png', '/']);
    expect(s.worker.skipWaiting).not.toHaveBeenCalled();
  });

  it('cleans only obsolete app caches', async () => {
    const s = setup();
    const event = { waitUntil: vi.fn() };
    s.handlers.activate(event);
    await event.waitUntil.mock.calls[0][0];
    expect(s.caches.delete.mock.calls.map(([key]) => key)).toEqual(['cache-old', 'offline-old']);
    expect(s.worker.clients.claim).toHaveBeenCalled();
  });
});
