import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname } from 'path';

// Installation: npm install --save-dev @iconify/utils @iconify/json
import { getIcons, minifyIconSet, stringToIcon } from '@iconify/utils';

const require = createRequire(import.meta.url);

// File to save bundle to
const target = 'src/lib/icons.ts';

// Icons to bundle, array
const iconsToBundle = [
  'mdi:account',
  'mdi:account-group',
  'mdi:analytics',
  'mdi:add',
  'mdi:beta',
  'mdi:briefcase-outline',
  'mdi:check-circle-outline',
  'mdi:check',
  'mdi:chevron-left',
  'mdi:chevron-right',
  'mdi:close',
  'mdi:close-circle-outline',
  'mdi:credit-card-plus-outline',
  'mdi:cog-outline',
  'mdi:filter',
  'mdi:folder-outline',
  'mdi:format-list-bulleted',
  'mdi:information-outline',
  'mdi:help',
  'mdi:login',
  'mdi:logout',
  'mdi:open-in-new',
  'mdi:pencil',
  'mdi:plus',
  'mdi:shape-outline',
  'mdi:swap-horizontal',
  'mdi:swap-vertical',
  'mdi:translate',
];

// Organize icons by prefix
const sortedIcons = organizeIconsList(iconsToBundle);

// Load icons data
let output = "import { addCollection } from '@iconify/svelte';\n\n";

Object.keys(sortedIcons).forEach((prefix) => {
  const iconsList = sortedIcons[prefix];

  // Load icon set
  const filename = require.resolve(`@iconify/json/json/${prefix}.json`);
  const iconSet = JSON.parse(readFileSync(filename, 'utf8'));

  // Get data for all icons as string
  const data = getIcons(iconSet, iconsList, true);
  if (!data) {
    throw new Error(`Could not get icons for "${prefix}" icon set.`);
  }
  if (data.not_found?.length) {
    throw new Error(`Could not find icons in "${prefix}" icon set: ${data.not_found.join(', ')}`);
  }
  minifyIconSet(data);

  output += 'addCollection(' + JSON.stringify(data) + ');\n';
});

// Save to file
const dir = dirname(target);
try {
  mkdirSync(dir, {
    recursive: true,
  });
} catch (err) {
  //
}
writeFileSync(target, output, 'utf8');

console.log(`Saved ${target} (${output.length} bytes)`);

/**
 * Sort icon names by prefix
 */
function organizeIconsList(icons) {
  const sorted = Object.create(null);
  icons.forEach((icon) => {
    const item = stringToIcon(icon);
    if (!item) {
      return;
    }

    const prefix = item.prefix;
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = []);

    const name = item.name;
    if (prefixList.indexOf(name) === -1) {
      prefixList.push(name);
    }
  });

  return sorted;
}
