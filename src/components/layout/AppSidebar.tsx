'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, ShieldAlert, FileText, Settings, LayoutDashboard, LogOut, FolderCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signout } from '@/features/auth/actions/auth-actions'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expediente SUNAFIL', href: '/expediente', icon: FolderCheck },
  { name: 'Trabajadores', href: '/workers', icon: Users },
  { name: 'Comité SST', href: '/sst/committee', icon: ShieldAlert },
  { name: 'Registros MTPE', href: '/registros', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">SUNAFIL<span className="text-blue-600">Pro</span></span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Módulos Principales
        </p>
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-700" : "text-gray-400"
              )} />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-blue-200">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Admin</span>
            <span className="text-xs text-gray-500">Mi Sesión</span>
          </div>
        </div>
        <form action={signout}>
          <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}
