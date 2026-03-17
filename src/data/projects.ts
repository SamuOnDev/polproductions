export type Project = {
    slug: string;
    tag: string;
    title: string;
    shortDescription: string;
    description: string;
    heroImage: string;
    timeline: string[];
    stack: string[];
    objectives: string[];
    results: string[];
    gallery: Array<{ title: string; image: string }>;
};

export const projects: Project[] = [
    {
        slug: "proyecto-destacado",
        tag: "IRL / EVENTO",
        title: "Título del Proyecto",
        shortDescription: "Producción en vivo y rodaje dinámico.",
        description: "Breve descripción del proyecto destacando el enfoque y desarrollo del video.",
        heroImage: "/images/portfolio-irl-barcelona-night-run.png",
        timeline: ["IRL", "EVENTO", "RODAJE", "EDICIÓN"],
        stack: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Vercel"],
        objectives: [
            "Objetivo del proyecto",
            "Proceso de rodaje",
            "Edición y post-producción",
            "Resultados logrados",
        ],
        results: ["+2M Vistas", "Entregado en 48 horas", "30K Interacciones"],
        gallery: [
            { title: "Rodaje en vivo", image: "/images/portfolio-irl-barcelona-night-run.png" },
            { title: "Edición cinemática", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Resultado final", image: "/images/portfolio-brand-product-teaser.png" },
        ],
    },
    {
        slug: "neon-pulse",
        tag: "VIDEOCLIP",
        title: "Neon Pulse",
        shortDescription: "Video musical con estilo cinematográfico.",
        description: "Un videoclip de estética urbana nocturna con narrativa visual de alto ritmo.",
        heroImage: "/images/portfolio-music-video-neon-pulse.png",
        timeline: ["MÚSICA", "NARRATIVA", "RODAJE", "COLOR"],
        stack: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Cinema Grade"],
        objectives: [
            "Traducir la energía de la canción a imágenes",
            "Crear una identidad visual memorable",
            "Sincronizar cortes y efectos con la base",
            "Optimizar para distribución social",
        ],
        results: ["+1.2M Reproducciones", "CTR +35%", "Retención media 58%"],
        gallery: [
            { title: "Set principal", image: "/images/portfolio-music-video-neon-pulse.png" },
            { title: "Post-producción", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Lanzamiento", image: "/images/portfolio-brand-product-teaser.png" },
        ],
    },
    {
        slug: "youtube-high-retention",
        tag: "YOUTUBE EDIT",
        title: "High Retention Edit",
        shortDescription: "Edición optimizada para YouTube.",
        description: "Proyecto orientado a elevar retención y watch time con ritmo, estructura y motion.",
        heroImage: "/images/portfolio-youtube-high-retention.png",
        timeline: ["YOUTUBE", "GUION", "MOTION", "SFX"],
        stack: ["Premiere Pro", "After Effects", "Photoshop", "YouTube Analytics"],
        objectives: [
            "Reducir abandono en los primeros 30 segundos",
            "Elevar watch time por episodio",
            "Reforzar identidad visual del canal",
            "Aumentar frecuencia de publicación",
        ],
        results: ["Retención +22%", "Watch time +31%", "Frecuencia x2"],
        gallery: [
            { title: "Timeline de edición", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Diseño de miniaturas", image: "/images/portfolio-brand-product-teaser.png" },
            { title: "Resultados de canal", image: "/images/portfolio-irl-barcelona-night-run.png" },
        ],
    },
];

export const getProjectBySlug = (slug: string) => projects.find((project) => project.slug === slug);
