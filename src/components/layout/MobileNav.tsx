import { NavLink } from 'react-router-dom';
import { House, Search, PlusCircle, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function MobileNav() {
  const { isAuthenticated, user } = useAuthStore();

  const profileTo = !isAuthenticated
    ? '/login'
    : user?.role === 'admin'
      ? '/admin'
      : '/mi-perfil';

  const navItems: { label: string; to: string; icon: typeof House; isFab?: boolean }[] = [
    { label: 'Inicio', to: '/', icon: House },
    { label: 'Buscar', to: '/comprar', icon: Search },
    { label: 'Publicar', to: '/publicar', icon: PlusCircle, isFab: true },
    { label: 'Perfil', to: profileTo, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around h-16 px-2">
        {navItems.map((item) =>
          item.isFab ? (
            <NavLink
              key={item.label}
              to={item.to}
              className="relative -mt-2 flex flex-col items-center"
            >
              <div className="w-11 h-11 rounded-full bg-primary shadow-float glow-gold flex items-center justify-center text-white transition-all active:scale-90">
                <PlusCircle className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-medium text-primary mt-1">
                {item.label}
              </span>
            </NavLink>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 active:scale-90 transition-transform ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="w-[3px] h-[3px] bg-primary rounded-full" />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
