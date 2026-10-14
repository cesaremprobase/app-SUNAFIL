import { AppSidebar, MobileNav } from '@/components/layout/AppSidebar'
import { Bell, Search } from 'lucide-react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/70">
      {/* Desktop Sidebar (hidden on mobile) */}
      <AppSidebar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Mobile Header and Navigation */}
        <MobileNav />

        {/* Desktop Top Header (hidden on mobile) */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-4 text-gray-400">
            <Search className="w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar trabajadores, registros..." 
              className="bg-transparent border-none outline-none text-sm text-gray-700 w-64 placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>
        
        {/* Main Scrollable View (padded on mobile for bottom bar) */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
