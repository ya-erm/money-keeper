import { constants, generateKeyPairSync, verify } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('private avatar storage', () => {
  it('authenticates on the server, caches IAM tokens and isolates owner prefixes', async () => {
    vi.stubEnv(
      'YC_AVATAR_SERVICE_ACCOUNT_KEY',
      JSON.stringify({
        id: 'test-key',
        service_account_id: 'test-account',
        private_key: privateKey.export({ format: 'pem', type: 'pkcs8' }),
      }),
    );
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url.includes('/iam/v1/tokens')) {
          if (typeof init?.body !== 'string') throw new Error('Missing JWT request');
          const jwt = JSON.parse(init.body).jwt;
          const [header, payload, signature] = jwt.split('.');
          expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toMatchObject({
            alg: 'PS256',
            kid: 'test-key',
          });
          expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toMatchObject({
            iss: 'test-account',
            aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
          });
          expect(
            verify(
              'sha256',
              Buffer.from(`${header}.${payload}`),
              { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 },
              Buffer.from(signature, 'base64url'),
            ),
          ).toBe(true);
          return Response.json({ iamToken: 'test-iam', expiresAt: new Date(Date.now() + 7200000).toISOString() });
        }
        expect(init?.redirect).toBe('error');
        expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-iam' });
        return new Response(null, { status: 200 });
      }),
    );
    const { avatarStorageRequest } = await import('./storage');
    await avatarStorageRequest('owner-a', 'id-a', new Uint8Array([1]));
    await avatarStorageRequest('owner-b', 'id-a');
    expect(calls.filter((c) => c.url.includes('/iam/v1/tokens'))).toHaveLength(1);
    expect(calls[1].url).toBe('https://storage.yandexcloud.net/money-keeper/avatars/owner-a/id-a.webp');
    expect(calls[2].url).toBe('https://storage.yandexcloud.net/money-keeper/avatars/owner-b/id-a.webp');
  });
});
