import { en, TranslationSchema } from './en.ts';
import { mr } from './mr.ts';
import { useApp, AppLanguage } from '../context/AppContext.tsx';

export type TranslationKey = string;
export type Vars = Record<string, string | number>;

const dictionaries: Record<AppLanguage, TranslationSchema> = {
  en,
  mr,
};

/**
 * Traverses nested object with dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Replaces {variable} patterns in template strings
 */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in vars ? String(vars[key]) : `{${key}}`;
  });
}

/**
 * Pure translation function
 */
export function t(key: string, vars?: Vars, lang: AppLanguage = 'en'): string {
  const targetDict = dictionaries[lang] as unknown as Record<string, unknown>;
  const fallbackDict = dictionaries.en as unknown as Record<string, unknown>;

  let val = getNestedValue(targetDict, key);

  if (val === undefined && lang !== 'en') {
    val = getNestedValue(fallbackDict, key);
    if (val !== undefined && process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing translation for key "${key}" in language "${lang}". Falling back to English.`);
    }
  }

  if (val === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Translation key not found: "${key}"`);
    }
    return key;
  }

  return typeof val === 'string' ? interpolate(val, vars) : String(val);
}

/**
 * Intl Formatters
 */
export function formatDate(
  date: Date | string | number,
  lang: AppLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const locale = lang === 'mr' ? 'mr-IN' : 'en-IN';
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
}

export function formatDateTime(
  date: Date | string | number,
  lang: AppLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const locale = lang === 'mr' ? 'mr-IN' : 'en-IN';
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
}

/**
 * Convert Latin numerals (0-9) to Devanagari numerals (०-९)
 */
export function toDevanagariDigits(input: string | number): string {
  const devanagariMap = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(input).replace(/[0-9]/g, (d) => devanagariMap[parseInt(d, 10)]);
}

export function formatNumber(
  num: number,
  lang: AppLanguage = 'en',
  options?: Intl.NumberFormatOptions,
  useDevanagari: boolean = false
): string {
  const formatted = new Intl.NumberFormat('en-IN', options).format(num);
  if (lang === 'mr' && useDevanagari) {
    return toDevanagariDigits(formatted);
  }
  return formatted;
}

/**
 * Legal sections must ALWAYS preserve Latin digits in both English and Marathi
 * Example: BNSS 173(3) or BNS 303
 */
export function formatLegalSection(
  act: 'BNS' | 'BNSS' | 'BSA' | string,
  section: string | number,
  subsection?: string
): string {
  const cleanSection = String(section).trim();
  const sub = subsection ? `(${subsection})` : '';
  return `${act.toUpperCase()} ${cleanSection}${sub}`;
}

/**
 * Custom React Hook for i18n
 */
export function useI18n() {
  const { language, setLanguage, toggleLanguage, devanagariDigits } = useApp();

  return {
    language,
    setLanguage,
    toggleLanguage,
    devanagariDigits,
    t: (key: string, vars?: Vars) => t(key, vars, language),
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, language, options),
    formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(date, language, options),
    formatNumber: (num: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(num, language, options, devanagariDigits),
    formatLegalSection,
    toDevanagariDigits,
  };
}


export { en, mr };
