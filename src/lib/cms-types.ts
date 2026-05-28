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

export interface CmsData {
    images: Record<string, string>;
    projects: Project[];
}
