/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: 'class', // Enable dark mode with class strategy
    theme: {
        extend: {
            keyframes: {
                shimmer: {
                    '0%': { 'background-position': '-1000px 0' },
                    '100%': { 'background-position': '1000px 0' },
                },
                slideUp: {
                    'from': { transform: 'translateY(100%)' },
                    'to': { transform: 'translateY(0)' },
                },
                fadeInSlide: {
                    'from': { opacity: '0', transform: 'translateY(-10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                }
            },
            animation: {
                shimmer: 'shimmer 2s infinite linear',
                slideUp: 'slideUp 0.3s ease-out',
                fadeInSlide: 'fadeInSlide 0.2s ease-out',
            },
            boxShadow: {
                'category-icon': '0 4px_12px rgba(0,0,0,0.03)',
            }
        },
    },
    plugins: [],
}
