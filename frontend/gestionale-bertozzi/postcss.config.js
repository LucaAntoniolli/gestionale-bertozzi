module.exports = {
    plugins: [
        require('tailwindcss')({
            content: ['./src/**/*.{html,ts}'],
            safelist: [
                // Classi che devono sempre essere incluse
                'w-full',
                'h-full',
                'p-error',
                'block',
                'flex',
                'grid',
                // Pattern per classi dinamiche
                { pattern: /^(w|h|p|m|mt|mb|ml|mr)-/ },
                { pattern: /^p-error/ },
            ]
        }),
        require('autoprefixer')
    ]
}