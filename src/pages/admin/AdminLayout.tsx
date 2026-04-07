import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Building2, Users, LogOut, Eye, BookOpen, ImageIcon, FileCheck, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const sidebarLinks = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Anuncios', to: '/admin/listings', icon: Car },
  { label: 'Catálogo', to: '/admin/catalog', icon: BookOpen },
  { label: 'Banners', to: '/admin/hero', icon: ImageIcon },
  { label: 'Documentos', to: '/admin/documents', icon: FileCheck },
  { label: 'Concesionarias', to: '/admin/dealers', icon: Building2 },
  { label: 'Usuarios', to: '/admin/users', icon: Users },
  { label: 'Financiero', to: '/admin/financiero', icon: DollarSign },
  { label: 'Impersonar', to: '/admin/impersonate', icon: Eye },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-bg-secondary">
      {/* Sidebar — hidden on mobile, visible lg+ */}
      <aside className="hidden lg:flex w-64 flex-col bg-bg-dark text-white shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
          <img src="/logo.png" alt="VitrineMOTORS" className="h-7 w-auto brightness-0 invert" />
          <span className="ml-auto text-[10px] font-semibold bg-accent-red/20 text-accent-red px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <link.icon className="w-4.5 h-4.5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-accent-red transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-bg-dark">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:text-white'
                }`
              }
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
