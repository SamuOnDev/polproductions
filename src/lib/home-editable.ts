/**
 * Keys of the i18n dictionary that are exposed in the admin "Home" editor.
 * Only narrative / section-title strings; functional UI labels stay in JSON.
 */
export interface HomeTextField {
    key: string;
    label: string;
    multiline?: boolean;
    allowsHtml?: boolean;
}

export interface HomeTextGroup {
    id: string;
    title: string;
    fields: HomeTextField[];
}

export const HOME_TEXT_GROUPS: HomeTextGroup[] = [
    {
        id: "hero",
        title: "Hero",
        fields: [
            { key: "hero_title_1", label: "Título · línea 1" },
            { key: "hero_title_2", label: "Título · línea 2 (texto)" },
            { key: "hero_title_3", label: "Título · línea 2 (negrita)" },
            { key: "hero_title_4", label: "Título · línea 3 (texto)" },
            { key: "hero_title_accent", label: "Título · línea 3 (acento)" },
            { key: "hero_role_desc", label: "Descripción del rol", multiline: true, allowsHtml: true },
            { key: "hero_showreel_title", label: "Showreel · título" },
            { key: "hero_showreel_specs", label: "Showreel · specs" },
            { key: "hero_showreel_pieces", label: "Showreel · piezas" },
            { key: "hero_showreel_roles", label: "Showreel · roles" },
            { key: "hero_showreel_location", label: "Showreel · localización" },
        ],
    },
    {
        id: "work",
        title: "Trabajo (horizontal)",
        fields: [
            { key: "work_title", label: "Título de sección", allowsHtml: true },
            { key: "work_aside_title", label: "Aside · título" },
            { key: "work_aside_desc", label: "Aside · descripción" },
            { key: "work_more", label: "Botón ‘Ver más’" },
        ],
    },
    {
        id: "vertical",
        title: "Vertical",
        fields: [
            { key: "vertical_title", label: "Título de sección", allowsHtml: true },
            { key: "vertical_aside_title", label: "Aside · título" },
            { key: "vertical_aside_desc", label: "Aside · descripción" },
        ],
    },
    {
        id: "process",
        title: "Proceso",
        fields: [
            { key: "process_title", label: "Título de sección", allowsHtml: true },
            { key: "process_desc", label: "Descripción", multiline: true },
            { key: "process_badge", label: "Badge" },
            { key: "process_step_1_title", label: "Paso 1 · título" },
            { key: "process_step_1_desc", label: "Paso 1 · descripción", multiline: true },
            { key: "process_step_2_title", label: "Paso 2 · título" },
            { key: "process_step_2_desc", label: "Paso 2 · descripción", multiline: true },
            { key: "process_step_3_title", label: "Paso 3 · título" },
            { key: "process_step_3_desc", label: "Paso 3 · descripción", multiline: true },
            { key: "process_step_4_title", label: "Paso 4 · título" },
            { key: "process_step_4_desc", label: "Paso 4 · descripción", multiline: true },
        ],
    },
    {
        id: "about",
        title: "Sobre mí",
        fields: [
            { key: "about_title", label: "Título de sección", allowsHtml: true },
            { key: "about_lead", label: "Frase de entrada", multiline: true },
            { key: "about_p1", label: "Párrafo 1", multiline: true },
            { key: "about_p2", label: "Párrafo 2", multiline: true },
            { key: "about_portrait_tag", label: "Etiqueta del retrato (nombre)" },
            { key: "about_portrait_role", label: "Etiqueta del retrato (rol)" },
        ],
    },
    {
        id: "contact",
        title: "Contacto",
        fields: [
            { key: "contact_title", label: "Título de sección", allowsHtml: true },
            { key: "contact_desc", label: "Descripción", multiline: true },
            { key: "contact_form_title", label: "Formulario · título" },
            { key: "contact_form_lead", label: "Formulario · subtítulo" },
        ],
    },
];

export const HOME_TEXT_KEYS: string[] = HOME_TEXT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
