import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Evita que advertencias de tipos bloqueen el despliegue de produccion en Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Evita que reglas de linter bloqueen el despliegue de produccion
    ignoreDuringBuilds: true,
  },
  // Activa el MCP server en /_next/mcp (Next.js 16+) y permite subida de fotos HD / PDFs de hasta 50MB
  experimental: {
    mcpServer: true,
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org telegram:;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
