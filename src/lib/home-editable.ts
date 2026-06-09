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
    {
        id: "contact_channels",
        title: "Contacto · canales",
        fields: [
            { key: "contact_email_label", label: "Email · etiqueta" },
            { key: "contact_email", label: "Email" },
            { key: "contact_phone_label", label: "Teléfono · etiqueta" },
            { key: "contact_phone", label: "Teléfono" },
            { key: "contact_social_label", label: "Social · etiqueta" },
            { key: "contact_social", label: "Social" },
        ],
    },
    {
        id: "about_facts",
        title: "Sobre mí · datos",
        fields: [
            { key: "about_fact_1_label", label: "Dato 1 · etiqueta" },
            { key: "about_fact_1_value", label: "Dato 1 · valor" },
            { key: "about_fact_2_label", label: "Dato 2 · etiqueta" },
            { key: "about_fact_2_value", label: "Dato 2 · valor" },
            { key: "about_fact_3_label", label: "Dato 3 · etiqueta" },
            { key: "about_fact_3_value", label: "Dato 3 · valor" },
            { key: "about_fact_4_label", label: "Dato 4 · etiqueta" },
            { key: "about_fact_4_value", label: "Dato 4 · valor" },
        ],
    },
    {
        id: "nav",
        title: "Navegación (cabecera)",
        fields: [
            { key: "nav_role_label", label: "Rol (junto al logo)" },
            { key: "nav_portfolio", label: "Enlace · Portfolio" },
            { key: "nav_process", label: "Enlace · Proceso" },
            { key: "nav_about", label: "Enlace · Sobre mí" },
            { key: "nav_contact", label: "Enlace · Contacto" },
            { key: "nav_availability", label: "Disponibilidad" },
            { key: "nav_cta", label: "Botón CTA" },
        ],
    },
    {
        id: "footer",
        title: "Pie de página",
        fields: [
            { key: "footer_tagline", label: "Eslogan", multiline: true },
            { key: "footer_nav_title", label: "Columna · Navegar" },
            { key: "nav_work", label: "Enlace · Trabajo" },
            { key: "nav_vertical", label: "Enlace · Vertical" },
            { key: "footer_contact_title", label: "Columna · Contacto" },
            { key: "footer_location", label: "Ubicación" },
            { key: "footer_social_title", label: "Columna · Social" },
            { key: "footer_copyright", label: "Copyright" },
            { key: "footer_version", label: "Versión" },
        ],
    },
    {
        id: "portfolio",
        title: "Portfolio",
        fields: [
            { key: "portfolio_crumb_home", label: "Miga · Inicio" },
            { key: "portfolio_crumb_label", label: "Miga · Portfolio" },
            { key: "portfolio_title", label: "Título", allowsHtml: true },
            { key: "portfolio_sub", label: "Subtítulo", multiline: true },
            { key: "portfolio_filter_all", label: "Filtro · Todos" },
            { key: "portfolio_filter_horizontal", label: "Filtro · Horizontal" },
            { key: "portfolio_filter_vertical", label: "Filtro · Vertical" },
            { key: "portfolio_sort_label", label: "Etiqueta · Ordenar" },
            { key: "portfolio_section_horizontal", label: "Sección · Horizontal", allowsHtml: true },
            { key: "portfolio_section_vertical", label: "Sección · Vertical", allowsHtml: true },
        ],
    },
    {
        id: "project",
        title: "Página de proyecto",
        fields: [
            { key: "project_crumb_home", label: "Miga · Inicio" },
            { key: "project_crumb_portfolio", label: "Miga · Portfolio" },
            { key: "project_no_video_note", label: "Nota · sin vídeo", multiline: true },
            { key: "project_about_title", label: "Título · Sobre el proyecto", allowsHtml: true },
            { key: "project_about_pending", label: "Texto · descripción pendiente" },
            { key: "project_meta_title", label: "Ficha · título" },
            { key: "project_meta_client", label: "Ficha · Cliente" },
            { key: "project_meta_role", label: "Ficha · Rol" },
            { key: "project_meta_year", label: "Ficha · Año" },
            { key: "project_meta_format", label: "Ficha · Formato" },
            { key: "project_meta_duration", label: "Ficha · Duración" },
            { key: "project_meta_platform", label: "Ficha · Plataforma" },
            { key: "project_meta_views", label: "Ficha · Views" },
            { key: "project_meta_tools", label: "Ficha · Herramientas" },
            { key: "project_credits_title", label: "Título · Créditos", allowsHtml: true },
            { key: "project_related_horizontal", label: "Relacionados · Horizontal", allowsHtml: true },
            { key: "project_related_vertical", label: "Relacionados · Vertical", allowsHtml: true },
            { key: "project_related_sub", label: "Relacionados · subtítulo" },
            { key: "project_cta_external", label: "Botón · ver externo" },
            { key: "project_cta_similar", label: "Botón · proyecto similar" },
        ],
    },
];

export const HOME_TEXT_KEYS: string[] = HOME_TEXT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
