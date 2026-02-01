/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                toss: {
                    blue: '#3182F6',
                    'blue-light': '#E8F3FF',
                    grey: '#F2F4F6',
                    'grey-deep': '#B0B8C1',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
