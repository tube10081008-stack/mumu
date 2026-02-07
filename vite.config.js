import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: false, // We look for public/manifest.json manually, or we can inline it here. 
            // Better to use the file in public/manifest.json if possible, but VitePWA usually generates it.
            // Let's point to our manual file or let VitePWA handle generation?
            // "VitePWA generates the manifest by default". If we want to use our own, we should put it in public
            // and NOT let VitePWA overwrite it, OR configure VitePWA to generate it with our content.
            // Simplest way: Let VitePWA use our public/manifest.json by not providing a manifest object here?
            // Wait, VitePWA default mode is to generate.
            // Let's configure it to USE the existing one or merge.
            // Actually, if we put manifest.json in public, Vite copies it.
            // But VitePWA expects to manage it.
            // Let's simply INJECT the manifest config here for valid PWA generation.
            manifest: {
                name: "무무베딩 배송 시스템",
                short_name: "무무베딩",
                description: "무무베딩 기사님 및 관리자 전용 배송 관리 시스템",
                theme_color: "#3182f6",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                start_url: "./",
                icons: [
                    {
                        src: "icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable"
                    },
                    {
                        src: "icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            }
        })
    ],
})
