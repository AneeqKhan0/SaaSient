export default function manifest() {
    return {
        name: 'SaaSient Dashboard',
        short_name: 'SaaSient',
        description: 'AI-powered lead & conversation dashboard',
        start_url: '/',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#0099f9',
        icons: [
            {
                src: '/saasient-favicon.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/saasient-favicon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/saasient-favicon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
