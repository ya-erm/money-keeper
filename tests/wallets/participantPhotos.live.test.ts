import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from '@tests/fixtures';
import { importMockDataAsync } from '@tests/helpers';

test('real private S3 upload, second-device synchronization, access isolation and replacement with initials', async ({
  page,
  context,
  browser,
  baseURL,
}, testInfo) => {
  test.skip(process.env.AVATAR_LIVE_TESTS !== '1', 'Requires explicit opt-in and an isolated local database');
  test.setTimeout(120000);
  if (baseURL !== 'http://127.0.0.1:4173') throw new Error('Live test may only use the isolated local server');
  const db = new PrismaClient({ datasourceUrl: 'postgresql://postgres:avatar-test@127.0.0.1:55434/avatar_test' });
  const owner = randomUUID();
  const other = randomUUID();
  const token = randomUUID();
  const otherToken = randomUUID();
  const second = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
  const anonymous = await browser.newContext({ baseURL });
  async function device(ctx: BrowserContext, tab: Page) {
    await ctx.addCookies([{ name: 'session.v2', value: token, url: baseURL!, httpOnly: true }]);
    await tab.goto('/settings', { waitUntil: 'networkidle' });
    await tab.evaluate(async (owner) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('mk-2');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(['members', 'globalSettings', 'memberSettings'], 'readwrite');
      tx.objectStore('members').put({ uuid: owner, login: 'avatar-test', publicKey: '', privateKey: '' });
      tx.objectStore('globalSettings').put({ id: 'global', selectedMember: owner });
      tx.objectStore('memberSettings').put({ owner, syncNumber: 0, encryption: 'none' });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    }, owner);
    await tab.reload({ waitUntil: 'networkidle' });
  }
  try {
    for (const [uuid, value] of [
      [owner, token],
      [other, otherToken],
    ]) {
      await db.member.create({ data: { uuid, publicKey: '' } });
      await db.memberToken.create({ data: { value, memberUuid: uuid } });
    }
    await device(context, page);
    await importMockDataAsync(page, JSON.stringify({ participants: [{ id: 'photo-person', name: 'Alex Photo' }] }));
    await page.goto('/settings/participants/edit?id=photo-person', { waitUntil: 'networkidle' });
    let uploads = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v2/avatars') uploads++;
    });
    const picture = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#3e8ca3' } })
      .composite([
        {
          input: Buffer.from(
            '<svg width="900" height="600"><circle cx="450" cy="220" r="100" fill="#ffd6b0"/><ellipse cx="450" cy="550" rx="220" ry="180" fill="#224466"/></svg>',
          ),
        },
      ])
      .jpeg({ quality: 98 })
      .toBuffer();
    const selectPhoto = async () => {
      await page.getByTestId('ParticipantIconButton').click();
      await page
        .getByTestId('ParticipantPhotoInput')
        .setInputFiles({ name: 'portrait.jpg', mimeType: 'image/jpeg', buffer: picture });
      await expect(page.getByTestId('ParticipantIconPicker')).toHaveCount(0);
      await expect(page.getByTestId('ParticipantAvatar').locator('img')).toBeVisible();
    };
    await selectPhoto();
    expect(uploads).toBe(0);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('link', { name: 'Edit Alex Photo', exact: true }).click();
    await expect(page.getByTestId('ParticipantAvatar').locator('img')).toHaveCount(0);
    await selectPhoto();
    const uploaded = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/v2/avatars' && r.request().method() === 'POST',
    );
    await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Save', exact: true }).click();
    const response = await uploaded;
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    expect(uploads).toBe(1);
    await writeFile(testInfo.outputPath('uploaded-test-avatar.json'), JSON.stringify({ owner, id }));
    await expect(page).toHaveURL(/\/settings\/participants$/);
    const url = `/api/v2/avatars/${id}`;
    const downloaded = await context.request.get(url);
    expect(downloaded.status()).toBe(200);
    expect(downloaded.headers()['content-type']).toBe('image/webp');
    const bytes = await downloaded.body();
    expect(await sharp(bytes).metadata()).toMatchObject({ format: 'webp', width: 512, height: 512 });
    expect((await anonymous.request.get(url)).status()).toBe(401);
    expect((await anonymous.request.get(url, { headers: { Authorization: `Bearer ${otherToken}` } })).status()).toBe(
      404,
    );
    expect(
      (
        await context.request.post('/api/v2/avatars', {
          headers: { Origin: baseURL!, 'X-Workspace-Id': other },
          data: bytes,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await context.request.post('/api/v2/avatars', {
          headers: { Origin: 'https://other.example', 'X-Workspace-Id': owner },
          data: bytes,
        })
      ).status(),
    ).toBe(403);
    const snapshot = async () => (await (await context.request.get('/api/v2/snapshot')).json()).participants;
    await expect
      .poll(async () => (await snapshot()).find((p: { id: string }) => p.id === 'photo-person')?.avatarId)
      .toBe(id);
    const target = await second.newPage();
    await device(second, target);
    await target.goto('/settings/participants', { waitUntil: 'networkidle' });
    await expect(target.getByTestId('ParticipantAvatar').locator('img')).toHaveAttribute('src', url);
    await expect
      .poll(() =>
        target
          .getByTestId('ParticipantAvatar')
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBe(512);
    await target.screenshot({ path: testInfo.outputPath('participant-photo-second-device-390px.png') });
    await context.addCookies([{ name: 'locale', value: 'ru-RU', url: baseURL! }]);
    await page.goto('/settings/participants/edit?id=photo-person', { waitUntil: 'networkidle' });
    await page.screenshot({ path: testInfo.outputPath('participant-photo-editor-ru-390px.png') });
    await page.getByTestId('ParticipantIconButton').click();
    await page.screenshot({ path: testInfo.outputPath('participant-photo-picker-ru-390px.png') });
    await page.getByTestId('ParticipantIconPicker').locator('[data-testid=IconChoice][data-id=none]').click();
    await expect(page.getByTestId('ParticipantAvatar')).toHaveText('AP');
    await page.getByTestId('ParticipantForm').getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/participants$/);
    await expect
      .poll(async () => (await snapshot()).find((p: { id: string }) => p.id === 'photo-person')?.avatarId)
      .toBeUndefined();
  } finally {
    await second.close();
    await anonymous.close();
    await db.member.deleteMany({ where: { uuid: { in: [owner, other] } } });
    await db.$disconnect();
  }
});
