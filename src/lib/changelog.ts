import changelogMarkdownEn from '../../CHANGELOG.md?raw';
import changelogMarkdownRu from '../../CHANGELOG.ru.md?raw';

import type { Locales } from '$lib/translate/types';

export type ChangelogSection = {
  title: string;
  items: string[];
};

export type ChangelogEntry = {
  version: string;
  date?: string;
  sections: ChangelogSection[];
};

function parseVersionHeading(heading: string) {
  const match = heading.match(/^\[?(?<version>[^\]\s]+)\]?(?:\s+-\s+(?<date>.+))?$/);

  return {
    version: match?.groups?.version ?? heading,
    date: match?.groups?.date,
  };
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: ChangelogSection | null = null;

  function ensureSection(title = 'Summary') {
    if (!currentEntry) return null;

    if (!currentSection) {
      currentSection = { title, items: [] };
      currentEntry.sections.push(currentSection);
    }

    return currentSection;
  }

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('# Changelog')) continue;

    if (line.startsWith('## ')) {
      const { version, date } = parseVersionHeading(line.replace(/^##\s+/, ''));
      currentEntry = { version, date, sections: [] };
      currentSection = null;
      entries.push(currentEntry);
      continue;
    }

    if (line.startsWith('### ')) {
      if (!currentEntry) continue;

      currentSection = {
        title: line.replace(/^###\s+/, ''),
        items: [],
      };
      currentEntry.sections.push(currentSection);
      continue;
    }

    if (line.startsWith('- ')) {
      ensureSection()?.items.push(line.replace(/^-\s+/, ''));
      continue;
    }

    ensureSection()?.items.push(line);
  }

  return entries.filter((entry) => entry.sections.some((section) => section.items.length > 0));
}

export function getChangelogEntries(locale: Locales | null) {
  return parseChangelog(locale === 'ru-RU' ? changelogMarkdownRu : changelogMarkdownEn);
}
