export type ReceiptTextFields = {
  invoiceNumber: string;
  counter: string;
  extension: string;
  amount: string;
  dateTime: string;
};

export const counterExtensions = ['ПП', 'ПР', 'КП', 'КР', 'ОП', 'ОР', 'ПД', 'РД', 'АП', 'АР'];

// Only substitute lookalike alphabets, never guess ambiguous digits such as O/0 or S/5.
const latinLookalikes: Record<string, string> = {
  А: 'A',
  В: 'B',
  С: 'C',
  Е: 'E',
  Н: 'H',
  К: 'K',
  М: 'M',
  О: 'O',
  Р: 'P',
  Т: 'T',
  Х: 'X',
  У: 'Y',
};
const normalizeIds = (text: string) => text.toUpperCase().replace(/[АВСЕНКМОРТХУ]/g, (char) => latinLookalikes[char]);

export const normalizeReceiptAmount = (text: string): string => {
  const compact = text.replace(/\s/g, '');
  if (!/^\d[\d.,]*[.,]\d{2}$/.test(compact)) return '';
  const integer = compact.slice(0, -3);
  const decimal = compact.at(-3);
  const thousands = decimal === ',' ? '.' : ',';
  if (!/^\d+$/.test(integer) && !new RegExp(`^\\d{1,3}(?:\\${thousands}\\d{3})+$`).test(integer)) return '';
  return `${integer.replace(/[.,]/g, '')}.${compact.slice(-2)}`;
};

export const validReceiptDateTime = (text: string): boolean => {
  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})\.?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return false;
  const [day, month, year, hour, minute, second = 0] = match
    .slice(1)
    .filter((value) => value !== undefined)
    .map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 2000 &&
    year <= 2100 &&
    date.getUTCDate() === day &&
    date.getUTCMonth() === month - 1 &&
    hour < 24 &&
    minute < 60 &&
    Number(second) < 60
  );
};

export const parseReceiptText = (text: string): ReceiptTextFields => {
  const lines = text
    .replace(/[–—−]/g, '-')
    .split(/\r?\n/)
    .map((line) => line.trim());
  const ids = normalizeIds(text.replace(/[–—−]/g, '-'));
  const invoices = [...ids.matchAll(/\b([A-Z0-9]{8})\s*-\s*([A-Z0-9]{8})\s*-\s*(\d{1,12})\b/g)];
  const uniqueInvoices = [...new Set(invoices.map((match) => `${match[1]}-${match[2]}-${match[3]}`))];
  const invoiceNumber = uniqueInvoices.length === 1 ? uniqueInvoices[0] : '';
  const invoiceCounter = invoiceNumber.split('-')[2];
  const counters = lines.flatMap((line) => [
    ...line.matchAll(/\b(\d{1,12})\s*\/\s*(\d{1,12})\s*([ППРКОДА]{2}|PP|PR|KP|KR|OP|OR|PD|RD|AP|AR)?/gi),
  ]);
  const matchingCounter =
    counters.find((match) => match[2] === invoiceCounter) ?? (counters.length === 1 ? counters[0] : undefined);
  const counter =
    matchingCounter && (!invoiceCounter || matchingCounter[2] === invoiceCounter)
      ? `${matchingCounter[1]}/${matchingCounter[2]}`
      : '';
  const extension =
    matchingCounter?.[3]
      ?.toUpperCase()
      .replace(/[PKODAR]/g, (letter) => ({ P: 'П', K: 'К', O: 'О', D: 'Д', A: 'А', R: 'Р' })[letter] ?? letter) ?? '';
  const totals = lines
    .filter(
      (line) => /(?:укупан\s+износ|ukupan\s+iznos|total\s+amount)/i.test(line) && !/(?:порез|porez|tax)/i.test(line),
    )
    .map((line) => normalizeReceiptAmount(line.match(/\d[\d\s.,]*[.,]\d{2}(?!\d)/)?.[0] ?? ''))
    .filter(Boolean);
  const dates = [
    ...text.matchAll(
      /\b(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(20\d{2})\.?\s+(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*(\d{2}))?(?!\d)/g,
    ),
  ]
    .map(
      (match) =>
        `${match[1].padStart(2, '0')}.${match[2].padStart(2, '0')}.${match[3]}. ${match[4].padStart(2, '0')}:${match[5]}${match[6] ? `:${match[6]}` : ''}`,
    )
    .filter(validReceiptDateTime);
  return {
    invoiceNumber,
    counter,
    extension: counter && counterExtensions.includes(extension) ? extension : '',
    amount: new Set(totals).size === 1 ? totals[0] : '',
    dateTime: new Set(dates).size === 1 ? dates[0] : '',
  };
};
