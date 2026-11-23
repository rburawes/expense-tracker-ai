export interface CurrencyOption {
  code: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'CHF', name: 'Swiss Franc' },
];

const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', PH: 'PHP', JP: 'JPY', CA: 'CAD', AU: 'AUD', SG: 'SGD',
  IN: 'INR', CN: 'CNY', KR: 'KRW', MX: 'MXN', BR: 'BRL', CH: 'CHF',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR',
  BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
};

/** Best-effort guess at the user's currency from their browser locale. */
export function detectDefaultCurrency(): string {
  if (typeof navigator === 'undefined') return 'USD';
  for (const locale of navigator.languages ?? [navigator.language]) {
    const region = locale?.split('-')[1]?.toUpperCase();
    if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
  }
  return 'USD';
}

export function isSupportedCurrency(code: unknown): code is string {
  return typeof code === 'string' && CURRENCIES.some((c) => c.code === code);
}
