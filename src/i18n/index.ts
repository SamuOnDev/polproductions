export const LANGS = ["es", "en"] as const;
export type ActiveLang = (typeof LANGS)[number];
export const DEFAULT_LANG: ActiveLang = "es";

export type LocaleValue = string | string[];
export type LocaleTexts = Record<string, LocaleValue>;

const dictionaries: Record<ActiveLang, () => Promise<LocaleTexts>> = {
    es: async () => (await import("./locales/es.json")).default as LocaleTexts,
    en: async () => (await import("./locales/en.json")).default as LocaleTexts,
};

export async function getDict(lang: ActiveLang): Promise<LocaleTexts> {
    return dictionaries[lang]();
}

export function getLangFromUrl(pathname: string): ActiveLang {
    const parts = pathname.split("/").filter(Boolean);
    const maybe = parts[0] as ActiveLang | undefined;
    return maybe && LANGS.includes(maybe) ? maybe : DEFAULT_LANG;
}
