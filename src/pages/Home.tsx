import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Container } from '../components/ui/Container';
import {
  Search,
  Car,
  Bike,
  Ship,
  DollarSign,
  ChevronRight,
  Tag,
  ArrowRight,
  ClipboardList,
  Camera,
  Handshake,
} from 'lucide-react';
import { ListingCard } from '../components/listings/ListingCard';
import { SkeletonCar } from '../components/admin/SkeletonCar';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { HeroCarousel } from '../components/hero/HeroCarousel';
import { SEOHead } from '../components/SEOHead';
import { generateOrganizationJsonLd } from '../lib/seo';
import { useListingsStore } from '../stores/listingsStore';
import { fetchBrands } from '../lib/catalog';
import { fetchActiveHeroSlides } from '../lib/heroSlides';
import { QUICK_FILTERS_BY_TYPE, CONDITIONS, PRICE_RANGES, VEHICLE_TYPE_LABELS } from '../data/constants';
import type { VehicleType, Brand, HeroSlide } from '../types';

const SEARCH_TABS = [
  { label: 'Autos', value: 'auto' as VehicleType, icon: Car },
  { label: 'Motos', value: 'moto' as VehicleType, icon: Bike },
  { label: 'Barcos', value: 'barco' as VehicleType, icon: Ship },
] as const;


// Placeholder images por categoria — substituir por imagens próprias em /public/images/cat-*.jpg
const CATEGORY_IMAGES: Record<string, string> = {
  all: '/images/categories/all.png',
  suv: '/images/categories/suv.png',
  pickup: '/images/categories/pickup.png',
  sedan: '/images/categories/sedan.png',
  '0km': '/images/categories/0km.png',
  diesel: '/images/categories/diesel.png',
  automatico: '/images/categories/automatico.png',
  hasta20k: '/images/categories/hasta20k.png',
};

const containerStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

export function Home() {
  const [activeTab, setActiveTab] = useState<VehicleType>('auto');
  const [searchBrand, setSearchBrand] = useState('');
  const [searchCondition, setSearchCondition] = useState('');
  const [searchPriceMax, setSearchPriceMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  const navigate = useNavigate();
  const getFilteredListings = useListingsStore((s) => s.getFilteredListings);
  const storeLoading = useListingsStore((s) => s.loading);
  const listings = getFilteredListings();
  const featuredListings = listings.slice(0, 8);
  const { ids: recentIds } = useRecentlyViewed();
  const recentListings = recentIds
    .map((id) => listings.find((l) => l.id === id))
    .filter(Boolean)
    .slice(0, 4) as typeof listings;

  const featuredRef = useRef<HTMLDivElement>(null);
  const featuredInView = useInView(featuredRef, { once: true, amount: 0.1 });

  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

  // Load hero slides
  useEffect(() => {
    fetchActiveHeroSlides().then(setHeroSlides);
  }, []);

  // Load brands from Supabase filtered by active tab type
  useEffect(() => {
    fetchBrands(activeTab).then(setBrands);
  }, [activeTab]);

  const typeLabel = VEHICLE_TYPE_LABELS[activeTab];
  const typeRoute = `/${activeTab === 'auto' ? 'autos' : activeTab === 'moto' ? 'motos' : 'barcos'}`;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchBrand) params.set('marca', searchBrand);
    if (searchCondition) params.set('condicion', searchCondition);
    if (searchPriceMax) params.set('priceMax', searchPriceMax);
    if (searchQuery) params.set('search', searchQuery);
    navigate(`${typeRoute}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="bg-bg overflow-x-hidden">
      <SEOHead title="Inicio" description="Marketplace de autos, motos y barcos en Paraguay. Compra y vende vehiculos nuevos y usados." jsonLd={generateOrganizationJsonLd()} />
      {/* ──────────────── HERO CAROUSEL ──────────────── */}
      <HeroCarousel slides={heroSlides} />

      {/* ──────────────── SEARCH BAR ──────────────── */}
      <Container as="section" className="-mt-10 md:-mt-14 relative z-10">
        <div className="rounded-2xl shadow-search p-5 md:p-6 bg-white border border-border/50">
          {/* Tabs — Tipo de vehículo */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {SEARCH_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setSearchBrand(''); }}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    activeTab === tab.value
                      ? 'bg-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            {/* Brand */}
            <div className="flex items-center gap-2 bg-bg-secondary rounded-xl px-4 py-3">
              <Car className="w-4 h-4 text-text-secondary shrink-0" />
              <select
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                className="bg-transparent border-0 outline-none flex-1 text-sm text-text-primary"
              >
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div className="flex items-center gap-2 bg-bg-secondary rounded-xl px-4 py-3">
              <Tag className="w-4 h-4 text-text-secondary shrink-0" />
              <select
                value={searchCondition}
                onChange={(e) => setSearchCondition(e.target.value)}
                className="bg-transparent border-0 outline-none flex-1 text-sm text-text-primary"
              >
                <option value="">Condición</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 bg-bg-secondary rounded-xl px-4 py-3">
              <DollarSign className="w-4 h-4 text-text-secondary shrink-0" />
              <select
                value={searchPriceMax}
                onChange={(e) => setSearchPriceMax(e.target.value)}
                className="bg-transparent border-0 outline-none flex-1 text-sm text-text-primary"
              >
                <option value="">Precio máximo</option>
                {PRICE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-2 bg-bg-secondary rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-text-secondary shrink-0" />
              <input
                type="text"
                placeholder="Buscar marca, modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent border-0 outline-none flex-1 text-sm text-text-primary placeholder:text-text-secondary"
              />
            </div>
          </div>

          {/* Search button */}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white rounded-full px-8 py-3 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Buscar {typeLabel.plural.toLowerCase()}
            </button>
          </div>
        </div>
      </Container>

      {/* ──────────────── CÓMO FUNCIONA ──────────────── */}
      <Container as="section" className="py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3 text-text-primary">
          ¿Cómo funciona?
        </h2>
        <p className="text-center text-text-secondary text-sm mb-10 max-w-lg mx-auto">
          Comprá o vendé tu vehículo en 3 simples pasos
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ClipboardList,
              step: '01',
              title: 'Publicá tu vehículo',
              desc: 'Completá los datos, subí fotos y definí el precio. Tu anuncio estará visible en minutos.',
              color: 'bg-primary/10 text-primary',
            },
            {
              icon: Camera,
              step: '02',
              title: 'Recibí consultas',
              desc: 'Los compradores interesados te contactarán por WhatsApp o formulario. Gestioná tus leads.',
              color: 'bg-success-green/10 text-success-green',
            },
            {
              icon: Handshake,
              step: '03',
              title: 'Cerrá la venta',
              desc: 'Coordiná con el comprador, acordá el precio y realizá la transferencia de forma segura.',
              color: 'bg-verified-blue/10 text-verified-blue',
            },
          ].map(({ icon: Icon, step, title, desc, color }) => (
            <div
              key={step}
              className="relative bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-secondary/40 tracking-widest uppercase">Paso {step}</span>
                  <h3 className="text-lg font-heading font-bold text-text-primary mt-0.5">{title}</h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* ──────────────── CATEGORIES — Image Blocks ──────────────── */}
      <div className="py-12 md:py-16">
        <Container>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10 text-text-primary">
            Explorá por categoría
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5 rounded-2xl overflow-hidden">
            {(QUICK_FILTERS_BY_TYPE[activeTab] || QUICK_FILTERS_BY_TYPE.auto).map((filter) => {
              const img = CATEGORY_IMAGES[filter.value] || CATEGORY_IMAGES['all'];
              const route = activeTab === 'auto' ? '/autos' : activeTab === 'moto' ? '/motos' : '/barcos';
              return (
                <Link
                  key={filter.value}
                  to={(() => {
                    if (filter.value === 'all') return route;
                    if (filter.value === '0km') return `${route}?condicion=0km`;
                    if (filter.value === 'diesel') return `${route}?combustible=diesel`;
                    if (filter.value === 'automatico') return `${route}?transmision=automatico`;
                    if (filter.value === 'hasta20k' || filter.value === 'hasta5k' || filter.value === 'hasta30k') {
                      const price = filter.value === 'hasta5k' ? '5000' : filter.value === 'hasta30k' ? '30000' : '20000';
                      return `${route}?priceMax=${price}`;
                    }
                    return `${route}?tipo=${filter.value}`;
                  })()}
                  className="group relative aspect-[4/3] overflow-hidden cursor-pointer"
                >
                  {/* Background image */}
                  <img
                    src={img}
                    alt={filter.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 group-hover:via-black/30 transition-all duration-500" />
                  {/* Hover lift effect */}
                  <div className="absolute inset-0 transition-transform duration-300 group-hover:-translate-y-1" />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 group-hover:-translate-y-1">
                    <span className="text-white font-heading font-bold text-lg md:text-xl drop-shadow-lg">
                      {filter.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </div>

      {/* ──────────────── RECENTLY VIEWED ──────────────── */}
      {recentListings.length > 0 && (
        <Container as="section" className="py-8 md:py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
              <span className="text-lg">🕐</span>
              Vistos recientemente
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </Container>
      )}

      {/* ──────────────── FEATURED LISTINGS ──────────────── */}
      <Container as="section" className="py-12 md:py-16" ref={featuredRef}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
            Vehículos destacados
          </h2>
          <Link
            to="/autos"
            className="text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {storeLoading && featuredListings.length === 0 ? (
          <SkeletonCar count={4} />
        ) : featuredListings.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            animate={featuredInView ? 'visible' : 'hidden'}
            variants={containerStagger}
          >
            {featuredListings.map((listing) => (
              <motion.div key={listing.id} variants={cardFadeUp} className="w-full h-full">
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-bg-secondary rounded-2xl">
            <Car className="w-16 h-16 text-border mx-auto mb-4" />
            <p className="text-text-secondary font-medium text-lg">Aún no hay vehículos publicados</p>
            <p className="text-text-muted text-sm mt-2">Sé el primero en publicar tu vehículo</p>
            <Link
              to="/publicar"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
            >
              + Publicar vehículo
            </Link>
          </div>
        )}
      </Container>

      {/* ──────────────── CTA ──────────────── */}
      <section
        ref={ctaRef}
        className="py-16 md:py-24 text-white text-center relative overflow-hidden"
      >
        {/* Background image */}
        <img
          src="/images/categories/all.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/80 to-[#0F172A]/70" />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          animate={ctaInView ? 'visible' : 'hidden'}
          variants={containerStagger}
        >
          <motion.span variants={fadeUp} className="text-primary text-sm font-bold tracking-widest uppercase">
            Vendé con nosotros
          </motion.span>

          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-bold font-heading mt-3"
          >
            ¿Querés vender tu vehículo?
          </motion.h2>

          <motion.p variants={fadeUp} className="text-white/70 mt-4 text-lg max-w-xl mx-auto">
            Publicá gratis y llegá a miles de compradores en todo Paraguay.
            Sin comisiones, sin límites.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              to="/publicar"
              className="bg-primary hover:bg-primary-dark text-white rounded-full px-10 py-4 text-lg font-semibold transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              Publicar mi vehículo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/registro"
              className="border border-white/30 hover:border-white/60 text-white rounded-full px-8 py-4 text-lg font-medium transition-all hover:bg-white/10 inline-flex items-center justify-center gap-2"
            >
              Crear cuenta gratis
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
