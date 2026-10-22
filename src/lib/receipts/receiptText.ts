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
  // Extraction is deliberately more permissive than validation: a damaged OCR
  // value is useful for editing and must not disappear into an empty input.
  const invoices = lines.flatMap((line) => [
    ...normalizeIds(line).matchAll(/([\p{L}\d|!?]{4,14})\s*-\s*([\p{L}\d|!?]{4,14})\s*-\s*([\p{L}\d|!?]{1,14})/gu),
  ]);
  const invoiceLine = lines.find(
    (line) => /(?:ПФ[РЕ]|PFR).*(?:ра[чц]уна|računa|racuna|broj)/i.test(line) && /\d/.test(line),
  );
  const labeledInvoice = invoiceLine?.replace(/^.*(?:ра[чц]уна|računa|racuna|broj)[\s:：]*/i, '');
  const invoiceNumber = labeledInvoice
    ? normalizeIds(labeledInvoice).replace(/\s/g, '')
    : invoices[0]
      ? `${invoices[0][1]}-${invoices[0][2]}-${invoices[0][3]}`
      : '';
  const invoiceCounter = invoiceNumber.split('-')[2];
  const counters = lines.flatMap((line) => [
    ...line.matchAll(/\b(\d{1,12})\s*\/\s*([\p{L}\d|!?]+(?:[ \t]+[\p{L}\d|!?]+)*)/gu),
  ]);
  const matchingCounter = counters.find((match) => match[2].startsWith(invoiceCounter)) ?? counters[0];
  const counterText = matchingCounter ? `${matchingCounter[1]}/${matchingCounter[2].replace(/\s/g, '')}` : '';
  const extensionMatch = counterText.match(/(ПП|ПР|КП|КР|ОП|ОР|ПД|РД|АП|АР|PP|PR|KP|KR|OP|OR|PD|RD|AP|AR)$/i);
  const extension =
    extensionMatch?.[1]
      .toUpperCase()
      .replace(/[PKODAR]/g, (letter) => ({ P: 'П', K: 'К', O: 'О', D: 'Д', A: 'А', R: 'Р' })[letter] ?? letter) ?? '';
  const counter = extensionMatch ? counterText.slice(0, -extensionMatch[1].length) : counterText;
  const totals = lines
    .filter(
      (line) => /(?:укупан\s+износ|ukupan\s+iznos|total\s+amount)/i.test(line) && !/(?:порез|porez|tax)/i.test(line),
    )
    .map((line) => {
      const value = line.replace(/^.*?(?:укупан\s+износ|ukupan\s+iznos|total\s+amount)[\s:：'"-]*/i, '').trim();
      return normalizeReceiptAmount(value) || value;
    })
    .filter(Boolean);
  const dates = lines
    .flatMap((line) => [
      ...line.matchAll(/\b(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(20\d{2})\.?[ \t]+(\d{1,2})[ \t]*:[ \t]*([\d: \t]+)/g),
    ])
    .map(
      (match) =>
        `${match[1].padStart(2, '0')}.${match[2].padStart(2, '0')}.${match[3]}. ${match[4].padStart(2, '0')}:${match[5].replace(/\s/g, '')}`,
    );
  return {
    invoiceNumber,
    counter,
    extension: counter && counterExtensions.includes(extension) ? extension : '',
    amount: totals[0] ?? '',
    dateTime: dates[0] ?? '',
  };
};
