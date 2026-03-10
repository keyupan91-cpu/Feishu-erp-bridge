import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许局域网访问
    port: 5173,
    strictPort: true, // 如果端口被占用则报错，而不是自动切换端口
    allowedHosts: ['.trycloudflare.com'], // 允许Cloudflare Tunnel访问
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying API request:', req.method, req.url, '->', options.target + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received API response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('API proxy error:', err);
          });
        },
      },
      // 金蝶 WebAPI 代理 - 通过后端动态代理，支持用户自定义服务器地址
      '/K3Cloud': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying Kingdee request to backend:', req.method, req.url, '->', options.target + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Kingdee response from backend:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('Kingdee proxy error:', err);
          });
        },
      },
      // 飞书 API 代理
      '/open-apis': {
        target: 'https://open.feishu.cn',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', options.target + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
        },
      },
    },
  },
})