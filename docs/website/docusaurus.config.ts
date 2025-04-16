import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// Docusaurus configuration for IGC Documentation
// This file runs in Node.js (no browser APIs or JSX here)

const config: Config = {
    // Site metadata
    title: "IGC Documentation",
    tagline: "Documentation for Incremental Graph Code",
    favicon: "img/favicon.ico",

    // Deployment config
    // Set the production URL of your site here
    url: "https://incremental-graph-code.github.io",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/igc/",
    trailingSlash: false,

    // GitHub pages deployment config
    organizationName: "incremental-graph-code",
    projectName: "igc",

    // Link handling
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Internationalization
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    // Plugins for each documentation section
    plugins: [
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "frontend",
                path: "../frontend",
                routeBasePath: "frontend",
                sidebarPath: require.resolve("./sidebars.js"),
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "backend",
                path: "../backend",
                routeBasePath: "backend",
                sidebarPath: require.resolve("./sidebars.js"),
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "electron",
                path: "../electron",
                routeBasePath: "electron",
                sidebarPath: require.resolve("./sidebars.js"),
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "shared",
                path: "../shared",
                routeBasePath: "shared",
                sidebarPath: require.resolve("./sidebars.js"),
            },
        ],
    ],

    // Presets (classic: disables default docs, enables blog and custom theme)
    presets: [
        [
            "classic",
            {
                docs: false, // Disable default docs at /
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    // Useful options to enforce blogging best practices
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],

    // Theme configuration
    themeConfig: {
        // Social card image
        image: "img/docusaurus-social-card.jpg",

        // Navbar configuration
        navbar: {
            title: "IGC Docs",
            logo: {
                alt: "IGC Docs Logo",
                src: "img/logo.svg",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "frontend",
                    docsPluginId: "frontend",
                    position: "left",
                    label: "Frontend",
                },
                {
                    type: "docSidebar",
                    sidebarId: "backend",
                    docsPluginId: "backend",
                    position: "left",
                    label: "Backend",
                },
                {
                    type: "docSidebar",
                    sidebarId: "electron",
                    docsPluginId: "electron",
                    position: "left",
                    label: "Electron",
                },
                {
                    type: "docSidebar",
                    sidebarId: "shared",
                    docsPluginId: "shared",
                    position: "left",
                    label: "Shared",
                },
            ],
        },

        // Footer configuration
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        { label: "Frontend", to: "/frontend" },
                        { label: "Backend", to: "/backend" },
                        { label: "Electron", to: "/electron" },
                        { label: "Shared", to: "/shared" },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discussions",
                            href: "https://github.com/orgs/incremental-graph-code/discussions",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "Issues",
                            to: "https://github.com/incremental-graph-code/igc/issues",
                        },
                        {
                            label: "GitHub",
                            href: "https://github.com/incremental-graph-code/igc",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Incremental Graph Code. Built with Docusaurus.`,
        },

        // Syntax highlighting themes
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
