import { constants, sign } from 'node:crypto';
const env = process.env;

type AuthorizedKey = { id: string; service_account_id: string; private_key: string };
let cached: { value: string; until: number } | undefined;
let pending: Promise<string> | undefined;

async function issueToken(): Promise<string> {
  const key = JSON.parse(env.YC_AVATAR_SERVICE_ACCOUNT_KEY ?? '') as AuthorizedKey;
  if (!key.id || !key.service_account_id || !key.private_key) throw new Error('Avatar storage is not configured');
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ alg: 'PS256', typ: 'JWT', kid: key.id })}.${encode({
    iss: key.service_account_id,
    aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
    iat: now,
    exp: now + 600,
  })}`;
  const signature = sign('sha256', Buffer.from(payload), {
    key: key.private_key,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }).toString('base64url');
  const response = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwt: `${payload}.${signature}` }),
  });
  if (!response.ok) throw new Error('Avatar storage authentication failed');
  const result = await response.json();
  if (typeof result.iamToken !== 'string') throw new Error('Avatar storage authentication failed');
  cached = { value: result.iamToken, until: Math.min(Date.parse(result.expiresAt) - 60_000, Date.now() + 3_600_000) };
  return cached.value;
}

async function getToken() {
  if (cached && cached.until > Date.now()) return cached.value;
  if (!pending)
    pending = issueToken().finally(() => {
      pending = undefined;
    });
  return pending;
}

/** The caller derives owner from authentication and validates id, never accepts an object key or URL. */
export async function avatarStorageRequest(owner: string, id: string, body?: Uint8Array): Promise<Response> {
  const bucket = env.YC_AVATAR_BUCKET ?? 'money-keeper';
  const url = `https://storage.yandexcloud.net/${encodeURIComponent(bucket)}/avatars/${encodeURIComponent(owner)}/${encodeURIComponent(id)}.webp`;
  const send = async () =>
    fetch(url, {
      method: body ? 'PUT' : 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${await getToken()}`, ...(body ? { 'Content-Type': 'image/webp' } : {}) },
      body: body ? new Uint8Array(body) : undefined,
    });
  let response = await send();
  if (response.status === 401) {
    await response.body?.cancel();
    cached = undefined;
    response = await send();
  }
  return response;
}
