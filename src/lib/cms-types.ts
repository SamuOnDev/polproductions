export type ProjectType = "horizontal" | "vertical";
export type HorizontalSize = "lg" | "md" | "eq" | "half";

export interface Project {
    id: string;
    type: ProjectType;
    title: string;
    subtitle?: string;
    client?: string;
    role?: string;
    tools?: string;
    description?: string;
    credits?: string;
    format?: string;
    duration?: string;
    year?: number;
    tag?: string;
    size?: HorizontalSize;
    platform?: string;
    views?: string;
    cover?: string;
    videoUrl?: string;
    showOnHome?: boolean;
    order?: number;
}

export interface HomeMedia {
    heroShowreelImage?: string;
    heroShowreelVideoUrl?: string;
    aboutPortraitImage?: string;
}

export type LocaleOverrides = Record<string, string>;

export interface HomeText {
    es: LocaleOverrides;
    en: LocaleOverrides;
}

export interface CmsData {
    images: Record<string, string>;
    media: HomeMedia;
    text: HomeText;
    projects: Project[];
}
