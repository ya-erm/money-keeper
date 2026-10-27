import { parseSerbianReceipt } from '#lib/receipts/serbianReceipt.js';
import { loadSerbianReceiptDetails } from '#lib/server/receipts/serbianReceipt.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
  const headers = { 'Cache-Control': 'no-store' };
  let url: string;
  try {
    const body = await request.text();
    if (body.length > 5000) return Response.json({ error: 'invalid' }, { status: 400, headers });
    const data = JSON.parse(body);
    if (typeof data?.url !== 'string') throw new Error('Missing URL');
    url = parseSerbianReceipt(data.url).url;
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400, headers });
  }
  try {
    return Response.json(await loadSerbianReceiptDetails(url, fetch), { headers });
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502, headers });
  }
};
