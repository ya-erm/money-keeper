import { describe, expect, it } from 'vitest';
import { defaultAvatarColor, normalizeAvatarColor, participantAvatarAppearance } from './participantAvatar';

describe('participant avatar appearance', () => {
  it('preserves the previous pastel color derived from the participant id', () => {
    expect(defaultAvatarColor('')).toBe('#ecc6c6');
    expect(defaultAvatarColor('a')).toBe('#d4ecc6');
    expect(participantAvatarAppearance({ id: 'a' })).toEqual({ background: '#d4ecc6', foreground: '#243040' });
  });

  it('accepts full hex colors and normalizes their case', () => {
    expect(normalizeAvatarColor('#AABBCC')).toBe('#aabbcc');
    expect(participantAvatarAppearance({ id: 'a', avatarColor: '#AABBCC' }).background).toBe('#aabbcc');
  });

  it.each([undefined, null, '', '#abc', '#12345', '#gggggg', 'red', 'url(https://example.com/image.png)'])(
    'falls back to the deterministic color for invalid imported colors: %s',
    (avatarColor) => {
      expect(normalizeAvatarColor(avatarColor)).toBeUndefined();
      expect(participantAvatarAppearance({ id: 'a', avatarColor: avatarColor ?? undefined })).toEqual(
        participantAvatarAppearance({ id: 'a' }),
      );
    },
  );

  it('uses contrasting foregrounds for dark and light custom colors', () => {
    expect(participantAvatarAppearance({ id: 'a', avatarColor: '#000000' }).foreground).toBe('#ffffff');
    expect(participantAvatarAppearance({ id: 'a', avatarColor: '#2563eb' }).foreground).toBe('#ffffff');
    expect(participantAvatarAppearance({ id: 'a', avatarColor: '#ffffff' }).foreground).toBe('#000000');
    expect(participantAvatarAppearance({ id: 'a', avatarColor: '#fef3c7' }).foreground).toBe('#000000');
  });
});
