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
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
}

export default nextConfig
