import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Users as UsersIcon, Store, BarChart3, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useImpersonationStore } from '../../stores/impersonationStore';
import { ImpersonationBanner } from '../../components/admin/ImpersonationBanner';

const sidebarLinks = [
  { label: 'Dashboard', to: '/dealer', icon: LayoutDashboard, end: true },
  { label: 'Inventario', to: '/dealer/inventory', icon: Car },
  { label: 'Leads', to: '/dealer/leads', icon: UsersIcon },
  { label: 'Mi Tienda', to: '/dealer/profile', icon: Store },
  { label: 'Analytics', to: '/dealer/analytics', icon: BarChart3 },
];

export function DealerLayout() {
  const { user, logout } = useAuthStore();
  const impersonating = useImpersonationStore((s) => s.impersonating);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-bg-secondary">
      {impersonating && <ImpersonationBanner />}
      <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-border shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <img src="/logo.png" alt="VitrineMOTORS" className="h-7 w-auto" />
          <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            DEALER
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
                    ? 'bg-primary text-white shadow-card'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`
              }
            >
              <link.icon className="w-4.5 h-4.5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold">
              {user?.name?.charAt(0) ?? 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-text-secondary hover:text-accent-red transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-white border-b border-border">
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
                    : 'text-text-secondary hover:text-text-primary'
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
    </div>
  );
}
