/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
        colors: {
            brand: {
            bg: "#070707",
            surface: "#0E0E0E",
            text: "#FFFFFF",
            muted: "rgba(255,255,255,0.70)",
            accent: "#FFD400", // amarillo POLOBK
            },
        },
        },
    },
    plugins: [],
};
