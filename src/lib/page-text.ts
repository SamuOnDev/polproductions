import type { LocaleTexts } from "../i18n";

/**
 * Helpers to make any text on a public page editable through the `override ?? default`
 * pattern, and to emit the visual-editor markers only in edit mode.
 *
 * Usage in a page or component:
 *   const text = makeText(t, cms.text?.[activeLang]);
 *   const ek = makeEk(editMode);
 *   <h2 data-cms-key={ek("section_title")}>{text("section_title")}</h2>
 */
export type TextFn = (key: string) => string;
export type EkFn = (key: string) => string | undefined;

/** Resolve a key as `override ?? i18n default`, always returning a string. */
export function makeText(dict: LocaleTexts, overrides: Record<string, string> = {}): TextFn {
    return (key) => {
        const o = overrides[key];
        if (typeof o === "string" && o.length > 0) return o;
        const f = (dict as Record<string, unknown>)[key];
        return typeof f === "string" ? f : "";
    };
}

/** Returns the key only in edit mode, so `data-cms-*` attributes vanish on public pages. */
export function makeEk(editMode: boolean): EkFn {
    return (key) => (editMode ? key : undefined);
}
