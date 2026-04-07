import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plus, LogOut, User, Car, Bike, Ship, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationBell } from './NotificationBell';

const vehicleTypeTabs = [
  { label: 'Autos', to: '/autos', icon: Car },
  { label: 'Motos', to: '/motos', icon: Bike },
  { label: 'Barcos', to: '/barcos', icon: Ship },
];

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: '0km', to: '/comprar?condicion=0km' },
  { label: 'Usados', to: '/comprar?condicion=usado' },
  { label: 'Financiar', to: '/financiar' },
  { label: 'Precios', to: '/precios' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300 bg-gradient-to-r from-[#FAF9F7]/95 via-white/95 to-[#FDF8F3]/95 backdrop-blur-lg border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="VitrineMOTORS" className="h-24 w-auto" style={{ mixBlendMode: 'multiply' }} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink
            to="/"
            end
            className="relative px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group"
          >
            Inicio
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/80 transition-all group-hover:w-full" />
          </NavLink>

          {/* Vehicle Type Tabs */}
          <div className="flex items-center gap-0.5 mx-1 bg-bg-secondary/60 rounded-full p-0.5">
            {vehicleTypeTabs.map((tab) => {
              const isActive = location.pathname === tab.to;
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.label}
                  to={tab.to}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>

          {navLinks.filter(l => l.to !== '/').map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="relative px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/80 transition-all group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link
                to="/mensajes"
                className="relative text-text-secondary hover:text-primary transition-colors"
                aria-label="Mis mensajes"
              >
                <MessageSquare size={20} />
              </Link>
              <Link
                to={user?.role === 'admin' ? '/admin' : '/panel'}
                className="text-sm font-medium text-text-primary hover:text-primary flex items-center gap-1.5 transition-colors"
              >
                <User size={16} />
                {user?.name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-text-secondary hover:text-accent-red flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
              <Link
                to="/publicar"
                className="rounded-full bg-primary hover:bg-primary-dark text-white px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-card hover:shadow-float active:scale-[0.98]"
              >
                <Plus size={16} />
                Publicar
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-text-primary hover:text-primary border border-border hover:border-primary rounded-full px-5 py-2 transition-all"
              >
                Iniciar sesion
              </Link>
              <Link
                to="/publicar"
                className="rounded-full bg-primary hover:bg-primary-dark text-white px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-card hover:shadow-float active:scale-[0.98]"
              >
                <Plus size={16} />
                Publicar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-bg-secondary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
        >
          <div className="relative w-6 h-6">
            <X
              className={`w-6 h-6 text-text-primary absolute inset-0 transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
              }`}
            />
            <Menu
              className={`w-6 h-6 text-text-primary absolute inset-0 transition-all duration-300 ${
                mobileMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Dropdown Menu — renders inside header, pushes content */}
      <AnimatePresence>
      {mobileMenuOpen && (
        <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:hidden absolute left-0 right-0 top-16 bg-white border-b border-border shadow-lg z-50"
        >
          <nav className="flex flex-col p-4 gap-0.5 max-w-7xl mx-auto">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'text-primary bg-primary-light' : 'text-text-primary hover:text-primary hover:bg-bg-secondary'
                }`
              }
            >
              Inicio
            </NavLink>

            {/* Vehicle Type Tabs - Mobile */}
            <div className="flex gap-2 px-2 py-2">
              {vehicleTypeTabs.map((tab) => {
                const isActive = location.pathname === tab.to;
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.label}
                    to={tab.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-bg-secondary text-text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </NavLink>
                );
              })}
            </div>

            {navLinks.filter(l => l.to !== '/').map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-primary bg-primary-light' : 'text-text-primary hover:text-primary hover:bg-bg-secondary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <hr className="my-2 border-border" />

            <div className="flex gap-2 px-4 py-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={user?.role === 'admin' ? '/admin' : '/panel'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center text-sm font-medium text-text-primary border border-border rounded-full px-4 py-2.5 hover:border-primary hover:text-primary transition-all"
                  >
                    Mi panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 text-center text-sm font-medium text-accent-red border border-accent-red/30 rounded-full px-4 py-2.5 hover:bg-accent-red/5 transition-all cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center text-sm font-medium text-text-primary border border-border rounded-full px-4 py-2.5 hover:border-primary hover:text-primary transition-all"
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    to="/publicar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center bg-primary hover:bg-primary-dark text-white rounded-full px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus size={16} />
                    Publicar
                  </Link>
                </>
              )}
            </div>
          </nav>
        </motion.div>
        </>
      )}
      </AnimatePresence>
    </header>
  );
}
