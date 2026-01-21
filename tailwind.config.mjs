/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: "rgb(var(--brand-bg) / <alpha-value>)",
                    surface: "rgb(var(--brand-surface) / <alpha-value>)",
                    text: "rgb(var(--brand-text) / <alpha-value>)",
                    muted: "rgb(var(--brand-muted) / <alpha-value>)",
                    accent: "rgb(var(--brand-accent) / <alpha-value>)",
                },
            },
        },
    },
    plugins: [],
};
