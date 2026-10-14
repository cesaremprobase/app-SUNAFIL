'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  ShieldAlert, 
  FileText, 
  Settings, 
  LayoutDashboard, 
  LogOut, 
  FolderCheck,
  Camera,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signout } from '@/features/auth/actions/auth-actions'

export const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cargar Fotos / Escanear', href: '/subir', icon: Camera, highlight: true },
  { name: 'Expediente SUNAFIL', href: '/expediente', icon: FolderCheck },
  { name: 'Trabajadores', href: '/workers', icon: Users },
  { name: 'Comité SST', href: '/sst/committee', icon: ShieldAlert },
  { name: 'Registros MTPE', href: '/registros', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex-shrink-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            SUNAFIL<span className="text-blue-600">Pro</span>
          </span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Módulos Principales
        </p>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs" 
                  : item.highlight
                    ? "bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 border border-amber-200/50"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive 
                  ? "text-blue-700" 
                  : item.highlight 
                    ? "text-amber-600" 
                    : "text-gray-400"
              )} />
              {item.name}
              {item.highlight && (
                <span className="ml-auto text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">
                  FOTOS
                </span>
              )}
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
    </aside>
  )
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <span className="text-base font-bold text-gray-900">
              SUNAFIL<span className="text-blue-600">Pro</span>
            </span>
          </Link>
        </div>

        <Link 
          href="/subir" 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Subir Fotos</span>
        </Link>
      </header>

      {/* Slide-over Drawer for Mobile */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-base">S</span>
                </div>
                <span className="text-base font-bold text-gray-900">
                  SUNAFIL<span className="text-blue-600">Pro</span>
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Navegación
              </p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-semibold" 
                        : item.highlight
                          ? "bg-amber-50 text-amber-900 font-semibold border border-amber-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-blue-700" : item.highlight ? "text-amber-600" : "text-gray-400"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              <form action={signout}>
                <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Persistent Fast Access) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 flex items-center justify-around px-2 shadow-lg">
        <Link 
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
            pathname === '/dashboard' ? "text-blue-600 font-bold" : "text-gray-500"
          )}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Inicio</span>
        </Link>
        <Link 
          href="/expediente"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
            pathname.startsWith('/expediente') ? "text-blue-600 font-bold" : "text-gray-500"
          )}
        >
          <FolderCheck className="w-5 h-5 mb-0.5" />
          <span>Expediente</span>
        </Link>
        
        {/* Centro: Botón de Cargar Foto destacado */}
        <Link 
          href="/subir"
          className="flex flex-col items-center justify-center -mt-4 bg-blue-600 text-white rounded-full w-12 h-12 shadow-lg hover:bg-blue-700 active:scale-90 transition-all border-2 border-white"
        >
          <Camera className="w-6 h-6" />
        </Link>

        <Link 
          href="/workers"
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors",
            pathname.startsWith('/workers') ? "text-blue-600 font-bold" : "text-gray-500"
          )}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Nómina</span>
        </Link>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-gray-500"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menú</span>
        </button>
      </nav>
    </>
  )
}
