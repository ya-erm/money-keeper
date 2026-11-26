import type { Participant } from '#lib/data/interfaces.js';

export function normalizeAvatarColor(value?: string | null): string | undefined {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : undefined;
}

/** Match the existing deterministic hsl(hue 50% 85%) avatar color. */
export function defaultAvatarColor(id: string): string {
  const hue = Array.from(id).reduce((hash, letter) => (hash * 31 + (letter.codePointAt(0) ?? 0)) % 360, 0);
  const chroma = 0.15;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const channels = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][Math.floor(hue / 60)];
  return (
    '#' +
    channels
      .map((value) =>
        Math.round((value + 0.775) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

export function participantAvatarAppearance(participant: Pick<Participant, 'id' | 'avatarColor'>) {
  const custom = normalizeAvatarColor(participant.avatarColor);
  if (!custom) return { background: defaultAvatarColor(participant.id), foreground: '#243040' };
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = parseInt(custom.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const foreground = 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#000000';
  return { background: custom, foreground };
}

export const participantIcons = [
  'mdi:account-outline',
  'mdi:account-group',
  'mdi:cat',
  'mdi:dog',
  'mdi:heart-outline',
  'mdi:flower-outline',
  'mdi:briefcase-outline',
  'mdi:school-outline',
  'mdi:bike',
  'mdi:airplane',
  'mdi:compass-outline',
  'mdi:camera-outline',
];
