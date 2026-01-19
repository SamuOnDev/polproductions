export const LANGS = ["es", "en"] as const;
export type ActiveLang = (typeof LANGS)[number];
export const DEFAULT_LANG: ActiveLang = "es";

type Dict = Record<string, string>;

const dictionaries: Record<ActiveLang, () => Promise<Dict>> = {
    es: async () => (await import("./locales/es.json")).default,
    en: async () => (await import("./locales/en.json")).default,
};

export async function getDict(lang: ActiveLang): Promise<Dict> {
    return dictionaries[lang]();
}

export function getLangFromUrl(pathname: string): ActiveLang {
    const parts = pathname.split("/").filter(Boolean);
    const maybe = parts[0] as ActiveLang | undefined;
    return (maybe && LANGS.includes(maybe)) ? maybe : DEFAULT_LANG;
}
