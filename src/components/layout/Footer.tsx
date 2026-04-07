import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Shield, ChevronRight } from 'lucide-react';

const explorarLinks = [
  { label: 'Autos', to: '/autos' },
  { label: 'Motos', to: '/motos' },
  { label: 'Barcos', to: '/barcos' },
  { label: '0km', to: '/comprar?condicion=0km' },
  { label: 'Usados', to: '/comprar?condicion=usado' },
];

const vendedorLinks = [
  { label: 'Publicar vehículo', to: '/publicar' },
  { label: 'Panel de vendedor', to: '/panel' },
  { label: 'Planes y precios', to: '/precios' },
];

export function Footer() {
  return (
    <footer className="bg-bg-dark text-white relative overflow-hidden">
      {/* Mesh gradient decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.05),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-15 mix-blend-overlay pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="VitrineMOTORS" className="h-8 w-auto brightness-0 invert" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              La vitrina digital de vehículos más grande de Paraguay. Comprá y
              vendé autos, motos y barcos nuevos y usados de forma rápida y segura.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 text-xs text-gray-300">
              <Shield className="w-4 h-4" />
              <span>Concesionarias verificadas</span>
            </div>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
              EXPLORAR
            </h3>
            <ul className="space-y-0.5">
              {explorarLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-white/50 hover:text-white transition-all text-sm py-1.5 flex items-center gap-1 group"
                  >
                    <ChevronRight size={13} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Para vendedores */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
              PARA VENDEDORES
            </h3>
            <ul className="space-y-0.5">
              {vendedorLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-white/50 hover:text-white transition-all text-sm py-1.5 flex items-center gap-1 group"
                  >
                    <ChevronRight size={13} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
              CONTACTO
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Asunción, Paraguay</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a
                  href="https://wa.me/595981000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  +595 981 000 000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a
                  href="mailto:info@vitrinemotors.com.py"
                  className="hover:text-white transition-colors"
                >
                  info@vitrinemotors.com.py
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Separador decorativo */}
      <div className="divider-gradient mx-8 mt-12" />

      {/* Bottom bar */}
      <div className="relative pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} VitirneMotors. Todos los derechos
            reservados.
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/terminos"
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Términos
            </Link>
            <Link
              to="/privacidad"
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
