import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The preview is for the owner's own devices only: fixed host list, no cross-origin access, strict headers.
// extra hosts for a LAN/Tailscale preview can be given as PREVIEW_HOSTS="a.b.c.d,host.name"
const hosts = ['localhost', '127.0.0.1', ...(process.env.PREVIEW_HOSTS ? process.env.PREVIEW_HOSTS.split(',') : [])]
const headers = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
}

const api = { '^/api/(stats|breakdown/.*|history/.*|claude-usage.*|security/(summary|report|history.*))$': { target: 'http://127.0.0.1:8420', changeOrigin: false }, '^/secops/.*': { target: 'http://127.0.0.1:8421', changeOrigin: false } }

export default defineConfig({
  plugins: [react()],
  server: { proxy: api, allowedHosts: hosts, cors: false, headers },
  preview: { proxy: api, allowedHosts: hosts, cors: false, headers },
  build: { chunkSizeWarningLimit: 1200, sourcemap: false },
})
