import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function cashBankHistoryFallback() {
  const rewriteCashBankRoute = (request, _response, next) => {
    const url = new URL(request.url || '/', 'http://localhost')
    if (
      (url.pathname === '/cash-bank' || url.pathname.startsWith('/cash-bank/')) &&
      !/\.[^/]+$/.test(url.pathname)
    ) {
      request.url = `/cash-bank/index.html${url.search}`
    }
    next()
  }

  return {
    name: 'cash-bank-history-fallback',
    configureServer(server) {
      server.middlewares.use(rewriteCashBankRoute)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteCashBankRoute)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), cashBankHistoryFallback()],
    define: {
      'import.meta.env.VITE_FRONTEND_ONLY': JSON.stringify(mode === 'frontend-only' ? 'true' : 'false'),
      'import.meta.env.VITE_VERCEL_BLOB_UPLOADS': JSON.stringify(process.env.VERCEL === '1'),
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8889',
          changeOrigin: false,
        },
      },
    },
  }
})
