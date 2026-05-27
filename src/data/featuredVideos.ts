export type WorkItem = {
    title: string;
    subtitle: string;
    tag: string;
    duration: string;
    image: string;
    size: "lg" | "md" | "eq" | "half";
    category: "all" | "clips" | "ads" | "youtube" | "doc";
    youtubeId?: string;
};

export const workItems: WorkItem[] = [
    {
        title: "Barcelona Night Run",
        subtitle: "Documental · Marca deportiva · 2026",
        tag: "21:9 · 04:12",
        duration: "04:12",
        image: "/images/portfolio-irl.png",
        size: "lg",
        category: "doc",
        youtubeId: "TbHDX21Gc7Q",
    },
    {
        title: "Lume — Vertigo",
        subtitle: "Videoclip · 2026",
        tag: "16:9 · 03:48",
        duration: "03:48",
        image: "/images/portfolio-music.png",
        size: "md",
        category: "clips",
        youtubeId: "35FYWabsIvI",
    },
    {
        title: "Northbeat S/S",
        subtitle: "Comercial · 2026",
        tag: "16:9 · 00:45",
        duration: "00:45",
        image: "/images/portfolio-brand.png",
        size: "eq",
        category: "ads",
        youtubeId: "zBCcWVxjRfs",
    },
    {
        title: "Studio Vlog — Ep. 04",
        subtitle: "YouTube · 2025",
        tag: "16:9 · 11:47",
        duration: "11:47",
        image: "/images/portfolio-youtube.png",
        size: "eq",
        category: "youtube",
    },
    {
        title: "Atlas — Behind the Build",
        subtitle: "YouTube · Mini-doc · 2025",
        tag: "16:9 · 18:00",
        duration: "18:00",
        image: "/images/hero-showreel-cover.jpg",
        size: "eq",
        category: "youtube",
    },
    {
        title: "Madrid After Hours",
        subtitle: "Comercial · 2025",
        tag: "16:9 · 01:30",
        duration: "01:30",
        image: "/images/portfolio-irl.png",
        size: "half",
        category: "ads",
    },
    {
        title: "Neon Pulse — Single",
        subtitle: "Videoclip · 2025",
        tag: "16:9 · 03:12",
        duration: "03:12",
        image: "/images/portfolio-music.png",
        size: "half",
        category: "clips",
    },
];

export type VerticalItem = {
    title: string;
    subtitle: string;
    image: string;
    views: string;
    platform: string;
    youtubeId?: string;
};

export const verticalItems: VerticalItem[] = [
    {
        title: "Vertigo — cut 9:16",
        subtitle: "Lume · Mar 2026",
        image: "/images/portfolio-music.png",
        views: "4.2M views",
        platform: "Instagram Reels",
        youtubeId: "Hcu5FxBsky4",
    },
    {
        title: "BCN Night Run",
        subtitle: "Marca deportiva · 2026",
        image: "/images/portfolio-irl.png",
        views: "1.1M views",
        platform: "TikTok",
        youtubeId: "y-ob0lKlvsI",
    },
    {
        title: "Northbeat — Hook A",
        subtitle: "Comercial · 2026",
        image: "/images/portfolio-brand.png",
        views: "620k views",
        platform: "Instagram Reels",
        youtubeId: "5z7osOXq8Fk",
    },
    {
        title: "Studio — Highlight",
        subtitle: "YouTube Shorts · 2025",
        image: "/images/portfolio-youtube.png",
        views: "2.0M views",
        platform: "YouTube Shorts",
        youtubeId: "-RsuoGKHosw",
    },
    {
        title: "Madrid After Hours",
        subtitle: "Vertical cut · 2026",
        image: "/images/portfolio-irl.png",
        views: "830k views",
        platform: "TikTok",
    },
];
