import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { openskyProxyPlugin } from './vite-plugins/openskyProxyPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      openskyProxyPlugin({
        clientId: env.OPENSKY_CLIENT_ID,
        clientSecret: env.OPENSKY_CLIENT_SECRET,
      }),
    ],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    server: {
      port: 3030,
      open: true,
    },
  }
})
