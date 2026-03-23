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
    {
        slug: "fake-streetwear-drop-2026",
        tag: "BRAND CAMPAIGN",
        title: "Fake Streetwear Drop 2026",
        shortDescription: "Campaña teaser para lanzamiento de colección urbana.",
        description: "Proyecto ficticio creado para mostrar más casos dentro de la página de proyectos.",
        heroImage: "/images/portfolio-brand-product-teaser.png",
        timeline: ["BRANDING", "TEASER", "META ADS", "DELIVERY"],
        stack: ["Premiere Pro", "After Effects", "CapCut", "Notion"],
        objectives: [
            "Generar expectativa previa al lanzamiento",
            "Adaptar piezas para formato vertical y horizontal",
            "Mantener coherencia visual de marca",
            "Entregar versiones por plataforma",
        ],
        results: ["Fake KPI +18%", "12 Piezas entregadas", "Lanzamiento en 5 días"],
        gallery: [
            { title: "Teaser principal", image: "/images/portfolio-brand-product-teaser.png" },
            { title: "Versión reels", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Visual final", image: "/images/portfolio-music-video-neon-pulse.png" },
        ],
    },
    {
        slug: "fake-podcast-reels-pack",
        tag: "SOCIAL PACK",
        title: "Fake Podcast Reels Pack",
        shortDescription: "Paquete semanal de clips cortos para podcast.",
        description: "Caso ficticio para representar flujos rápidos de edición orientados a redes.",
        heroImage: "/images/portfolio-youtube-high-retention.png",
        timeline: ["PODCAST", "CLIPPING", "SUBTÍTULOS", "PUBLICACIÓN"],
        stack: ["Premiere Pro", "Descript", "After Effects", "Google Drive"],
        objectives: [
            "Extraer highlights de episodios largos",
            "Subtitular automáticamente y ajustar estilo",
            "Crear hooks en los primeros 3 segundos",
            "Automatizar parte del pipeline",
        ],
        results: ["Fake alcance +240%", "20 clips/mes", "Tiempo de edición -35%"],
        gallery: [
            { title: "Selección de clips", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Plantilla de subtítulos", image: "/images/portfolio-brand-product-teaser.png" },
            { title: "Publicación final", image: "/images/portfolio-irl-barcelona-night-run.png" },
        ],
    },
    {
        slug: "fake-festival-aftermovie",
        tag: "EVENTO",
        title: "Fake Festival Aftermovie",
        shortDescription: "Aftermovie enérgico para festival de verano.",
        description: "Proyecto ficticio de cobertura multicámara y montaje acelerado.",
        heroImage: "/images/portfolio-irl-barcelona-night-run.png",
        timeline: ["COBERTURA", "MULTICAM", "EDICIÓN", "MASTER"],
        stack: ["Premiere Pro", "DaVinci Resolve", "Lightroom", "Frame.io"],
        objectives: [
            "Transmitir energía del evento en 90 segundos",
            "Combinar planos de dron y cámara en mano",
            "Sincronizar cortes con track principal",
            "Exportar versiones para RRSS y web",
        ],
        results: ["Fake views +900K", "Entrega en 72h", "UGC +150 clips"],
        gallery: [
            { title: "Escenario principal", image: "/images/portfolio-irl-barcelona-night-run.png" },
            { title: "Color grading", image: "/images/portfolio-music-video-neon-pulse.png" },
            { title: "Cut final", image: "/images/portfolio-brand-product-teaser.png" },
        ],
    },
    {
        slug: "fake-tech-product-launch",
        tag: "PRODUCT VIDEO",
        title: "Fake Tech Product Launch",
        shortDescription: "Video de lanzamiento para producto tecnológico.",
        description: "Caso ficticio orientado a storytelling de producto y beneficios clave.",
        heroImage: "/images/portfolio-brand-product-teaser.png",
        timeline: ["SCRIPT", "PRODUCT SHOTS", "MOTION", "ADS"],
        stack: ["After Effects", "Premiere Pro", "Blender", "Photoshop"],
        objectives: [
            "Explicar producto en menos de 60 segundos",
            "Reforzar beneficios con motion graphics",
            "Crear cortes para campañas pagadas",
            "Mantener tono premium de marca",
        ],
        results: ["Fake CTR +41%", "CPA -19%", "7 formatos exportados"],
        gallery: [
            { title: "Producto en estudio", image: "/images/portfolio-brand-product-teaser.png" },
            { title: "Motion explicativo", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Versión ads", image: "/images/portfolio-music-video-neon-pulse.png" },
        ],
    },
    {
        slug: "fake-gym-challenge-series",
        tag: "SERIE DIGITAL",
        title: "Fake Gym Challenge Series",
        shortDescription: "Serie de retos fitness para contenido semanal.",
        description: "Proyecto ficticio para mostrar formato de serie con narrativa episódica.",
        heroImage: "/images/portfolio-music-video-neon-pulse.png",
        timeline: ["PREPRO", "RODAJE", "EDICIÓN", "THUMBNAILS"],
        stack: ["Premiere Pro", "After Effects", "Photoshop", "YouTube Studio"],
        objectives: [
            "Diseñar estructura repetible por episodio",
            "Incrementar retorno de audiencia semanal",
            "Optimizar intros y llamadas a la acción",
            "Generar librería de plantillas reutilizable",
        ],
        results: ["Fake retención +16%", "8 episodios producidos", "Subs +12K"],
        gallery: [
            { title: "Rodaje del reto", image: "/images/portfolio-music-video-neon-pulse.png" },
            { title: "Diseño de portada", image: "/images/portfolio-youtube-high-retention.png" },
            { title: "Resultado de serie", image: "/images/portfolio-irl-barcelona-night-run.png" },
        ],
    },
];

export const getProjectBySlug = (slug: string) => projects.find((project) => project.slug === slug);
