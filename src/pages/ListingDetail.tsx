import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Heart,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  Eye,
  Shield,
  Star,
  Calculator,
  Scale,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ListingCard } from '../components/listings/ListingCard';
import { useListingsStore } from '../stores/listingsStore';
import { useAuthStore } from '../stores/authStore';
import { fetchListingById, incrementViews } from '../lib/listings';
import { getOrCreateConversation } from '../lib/chat';
import { trackEvent } from '../lib/analytics';
import { fetchDealerReviews, createReview } from '../lib/reviews';
import { ContactForm } from '../components/listings/ContactForm';
import { WhatsAppLeadModal } from '../components/listings/WhatsAppLeadModal';
import { SEOHead } from '../components/SEOHead';
import { generateVehicleJsonLd, generateBreadcrumbJsonLd } from '../lib/seo';
import { useComparisonStore } from '../stores/comparisonStore';
import { toast } from '../stores/toastStore';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { PhotoLightbox, ZoomBadge } from '../components/ui/PhotoLightbox';
import { StarRating } from '../components/reviews/StarRating';
import { ReviewCard } from '../components/reviews/ReviewCard';
import type { Listing, Review } from '../types';
import {
  formatPrice,
  formatMileage,
  getFuelLabel,
  getTransmissionLabel,
  getWhatsAppUrl,
  formatDate,
} from '../utils/formatters';

const CATEGORY_LABELS: Record<string, string> = {
  // Auto
  sedan: 'Sedán', suv: 'SUV', pickup: 'Pickup', hatchback: 'Hatchback',
  coupe: 'Coupé', van: 'Van', camion: 'Camión',
  // Moto
  scooter: 'Scooter', street: 'Street', sport: 'Sport', touring: 'Touring',
  adventure: 'Adventure', custom: 'Custom', trail: 'Trail / Enduro', cuatriciclo: 'Cuatriciclo',
  // Barco
  lancha: 'Lancha', velero: 'Velero', yate: 'Yate', jetski: 'Jet Ski',
  bote: 'Bote', pesquero: 'Pesquero',
};

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, listings } = useListingsStore();

  const authUser = useAuthStore((s) => s.user);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadListing = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setSelectedPhoto(0);
    const data = await fetchListingById(id);
    setListing(data);
    setLoading(false);
    // Incrementar views + analytics em background
    if (data) {
      incrementViews(id).catch(() => {});
      trackEvent(id, 'view', authUser?.id, data.dealership_id);
      addViewed(id);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  // Load reviews if listing has a dealership
  useEffect(() => {
    if (listing?.dealership_id) {
      fetchDealerReviews(listing.dealership_id).then(setReviews);
    }
  }, [listing?.dealership_id]);

  const handleSubmitReview = async () => {
    if (!authUser || !listing?.dealership_id || reviewRating === 0) return;
    setSubmittingReview(true);
    await createReview({
      user_id: authUser.id,
      dealer_id: listing.dealership_id,
      listing_id: listing.id,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewRating(0);
    setReviewComment('');
    setSubmittingReview(false);
    // Reload reviews
    fetchDealerReviews(listing.dealership_id).then(setReviews);
  };

  const { addViewed } = useRecentlyViewed();
  const isFavorite = listing ? favorites.includes(listing.id) : false;
  const { addToCompare, removeFromCompare, isCompared } = useComparisonStore();
  const isInComparison = listing ? isCompared(listing.id) : false;

  const similarListings = useMemo(() => {
    if (!listing) return [];
    return listings
      .filter(
        (l) =>
          l.id !== listing.id &&
          l.status === 'active' &&
          (l.brand === listing.brand || l.category === listing.category)
      )
      .slice(0, 4);
  }, [listing, listings]);

  // Market price indicator
  const priceIndicator = useMemo(() => {
    if (!listing) return null;
    const comparable = listings.filter(
      (l) =>
        l.id !== listing.id &&
        l.status === 'active' &&
        l.brand === listing.brand &&
        Math.abs(l.year - listing.year) <= 2 &&
        l.price_usd > 0
    );
    if (comparable.length < 3) return null;
    const avg = comparable.reduce((s, l) => s + l.price_usd, 0) / comparable.length;
    const diff = ((listing.price_usd - avg) / avg) * 100;
    return { avg, diff, count: comparable.length };
  }, [listing, listings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Container className="py-6 sm:py-8">
          <div className="skeleton h-9 w-40 rounded-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="skeleton aspect-video rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton w-20 h-14 rounded-lg shrink-0" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="skeleton h-7 w-3/4 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-4">
          Vehículo no encontrado
        </h1>
        <p className="text-text-secondary mb-6">
          El vehículo que buscas no existe o fue eliminado.
        </p>
        <Button variant="primary" onClick={() => navigate('/comprar')}>
          <ArrowLeft size={16} className="mr-2" />
          Volver a resultados
        </Button>
      </div>
    );
  }

  const photos = listing.photos || [];
  const mainPhotoUrl = photos[selectedPhoto]?.url || photos[0]?.url;
  const whatsappUrl = getWhatsAppUrl(listing.whatsapp_contact, listing.title);

  const handleShare = async () => {
    trackEvent(listing.id, 'share', authUser?.id, listing.dealership_id);
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('¡Link copiado al portapapeles!');
    }
  };

  const handleWhatsAppClick = () => {
    trackEvent(listing.id, 'whatsapp_click', authUser?.id, listing.dealership_id);
  };

  const handleOpenChat = async () => {
    if (!authUser) { navigate(`/login?redirect=/vehiculo/${listing.id}`); return; }
    if (authUser.id === listing.seller_id) return; // can't chat with yourself
    const conv = await getOrCreateConversation(listing.id, authUser.id, listing.seller_id);
    navigate(`/mensajes/${conv.id}`);
  };

  const handleFavoriteClick = () => {
    trackEvent(listing.id, 'favorite', authUser?.id, listing.dealership_id);
    toggleFavorite(listing.id);
  };

  const specs = [
    { icon: Calendar, label: 'Año', value: String(listing.year) },
    { icon: Gauge, label: 'Kilometraje', value: formatMileage(listing.mileage) },
    { icon: Fuel, label: 'Combustible', value: getFuelLabel(listing.fuel) },
    { icon: Settings, label: 'Transmisión', value: getTransmissionLabel(listing.transmission) },
    { icon: Star, label: 'Color', value: listing.color },
    { icon: Shield, label: 'Puertas', value: String(listing.doors) },
    { icon: Eye, label: 'Condición', value: listing.condition === '0km' ? '0 km' : 'Usado' },
    { icon: MapPin, label: 'Categoría', value: CATEGORY_LABELS[listing.category] || listing.category },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <SEOHead
        title={`${listing.title} - ${formatPrice(listing.price_usd)}`}
        description={`${listing.brand} ${listing.model} ${listing.year} en ${listing.city}. ${listing.description?.slice(0, 120) || ''}`}
        image={photos[0]?.url}
        type="product"
        jsonLd={[
          generateVehicleJsonLd(listing),
          generateBreadcrumbJsonLd([
            { name: 'Inicio', url: '/' },
            { name: 'Comprar', url: '/comprar' },
            { name: listing.title, url: `/vehiculo/${listing.id}` },
          ]),
        ]}
      />
      <Container className="py-6 sm:py-8">
        {/* Back button */}
        <Link
          to="/comprar"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary bg-bg-secondary hover:bg-primary-light rounded-full px-4 py-2 transition-all mb-6"
        >
          <ArrowLeft size={16} />
          Volver a resultados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: photos + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo gallery */}
            <div className="space-y-3">
              {/* Main image */}
              <div
                className={`relative aspect-video overflow-hidden rounded-2xl shadow-card bg-gray-100 ${mainPhotoUrl ? 'cursor-zoom-in group' : ''}`}
                onClick={() => mainPhotoUrl && setLightboxOpen(true)}
              >
                {mainPhotoUrl ? (
                  <>
                    <img
                      src={mainPhotoUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <ZoomBadge />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-text-secondary">Sin fotos</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhoto(index)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhoto === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`${listing.title} - foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl font-heading font-bold text-text-primary">
                  {listing.title}
                </h1>
                <div className="flex gap-1.5 flex-wrap">
                  {listing.featured && (
                    <Badge variant="featured">DESTACADO</Badge>
                  )}
                  {listing.dealership?.verified && (
                    <Badge variant="verified">VERIFICADO</Badge>
                  )}
                  {listing.condition === '0km' && (
                    <Badge variant="new">0KM</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                {listing.brand} {listing.model} {listing.version} &middot;{' '}
                {listing.year}
              </p>
            </div>

            {/* Price */}
            <div className="bg-primary-light rounded-xl p-5 border border-primary/20">
              <p className="text-3xl font-extrabold text-primary font-heading">
                {formatPrice(listing.price_usd)}
              </p>
              <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                <p className="text-sm text-text-secondary">
                  Publicado el {formatDate(listing.created_at)}
                </p>
                {listing.views_count > 0 && (
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Eye size={12} />
                    {listing.views_count.toLocaleString()} vistas
                  </span>
                )}
                {priceIndicator && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    priceIndicator.diff <= -5
                      ? 'bg-green-100 text-green-700'
                      : priceIndicator.diff >= 5
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {priceIndicator.diff <= -5
                      ? `${Math.abs(priceIndicator.diff).toFixed(0)}% bajo el mercado`
                      : priceIndicator.diff >= 5
                        ? `${priceIndicator.diff.toFixed(0)}% sobre el mercado`
                        : 'Precio de mercado'}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => { handleWhatsAppClick(); setShowLeadModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                <MessageCircle size={18} />
                Contactar por WhatsApp
              </button>
              {authUser?.id !== listing.seller_id && (
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-6 py-3.5 text-base font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <MessageSquare size={18} />
                  Enviar Mensaje
                </button>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors sm:w-auto"
              >
                <Share2 size={18} />
                <span className="sm:hidden">Compartir</span>
              </button>
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors sm:w-auto ${
                  isFavorite
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-border text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <Heart
                  size={18}
                  className={isFavorite ? 'fill-red-500' : ''}
                />
                <span className="sm:hidden">
                  {isFavorite ? 'Guardado' : 'Guardar'}
                </span>
              </button>
            </div>

            {/* Tools: Financing + Compare */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/financiar?price=${listing.price_usd}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Calculator size={18} />
                Simular Financiamiento
              </Link>
              <button
                type="button"
                onClick={() => isInComparison ? removeFromCompare(listing.id) : addToCompare(listing.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  isInComparison
                    ? 'border-blue-300 bg-blue-50 text-blue-600'
                    : 'border-border text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <Scale size={18} />
                {isInComparison ? 'En comparacion' : 'Comparar'}
              </button>
            </div>

            {/* Vehicle specs grid */}
            <div>
              <h3 className="text-lg font-heading font-bold text-text-primary mb-4">
                Características
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map((spec) => {
                  const IconComponent = spec.icon;
                  return (
                    <div
                      key={spec.label}
                      className="flex flex-col items-center text-center rounded-xl border border-border p-4 hover:shadow-card transition-shadow"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-secondary">
                        <IconComponent size={20} className="text-primary" />
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {spec.label}
                      </p>
                      <p className="text-sm font-semibold text-text-primary">
                        {spec.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-heading font-bold text-text-primary mb-3">
                Descripción
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-heading font-bold text-text-primary mb-3">
                Ubicación
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                <MapPin size={16} />
                <span>
                  {listing.city}, {listing.department}
                </span>
              </div>
              <div className="h-48 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
                <span className="text-sm text-text-secondary">
                  Mapa no disponible
                </span>
              </div>
            </div>
          </div>

          {/* Right column: seller card + views */}
          <div className="space-y-6">
            {/* Seller / Dealership card */}
            <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4 lg:sticky lg:top-24">
              {listing.dealership ? (
                <>
                  <div className="flex items-center gap-3">
                    {listing.dealership.logo_url && (
                      <img
                        src={listing.dealership.logo_url}
                        alt={listing.dealership.name}
                        className="h-14 w-14 rounded-full object-cover border border-border"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/concesionaria/${listing.dealership_id}`} className="font-semibold text-text-primary hover:text-primary transition-colors">
                          {listing.dealership.name}
                        </Link>
                        {listing.dealership.verified && (
                          <Badge variant="verified">Verificado</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {listing.dealership.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone size={14} />
                    <span>{listing.whatsapp_contact}</span>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-whatsapp px-6 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  {authUser?.id !== listing.seller_id && (
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-primary bg-primary/5 px-6 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      Enviar Mensaje
                    </button>
                  )}

                  <Link
                    to={`/comprar?marca=${encodeURIComponent(listing.brand)}`}
                    className="block text-center text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    Ver mas anuncios
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-secondary text-text-secondary">
                      <span className="text-lg font-bold">P</span>
                    </div>
                    <div>
                      <Link to={`/vendedor/${listing.seller_id}`} className="font-semibold text-text-primary hover:text-primary transition-colors">
                        Vendedor particular
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone size={14} />
                    <span>{listing.whatsapp_contact}</span>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-whatsapp px-6 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  {authUser?.id !== listing.seller_id && (
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-primary bg-primary/5 px-6 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      Enviar Mensaje
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Views count */}
            <div className="flex items-center gap-2 text-sm text-text-secondary px-1">
              <Eye size={14} />
              <span>{listing.views_count} visualizaciones</span>
            </div>

            {/* Contact form */}
            <ContactForm
              listingId={listing.id}
              sellerId={listing.seller_id}
              dealerId={listing.dealership_id}
            />

            {/* More from this seller */}
            <div className="rounded-xl border border-border bg-bg-secondary p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">Más vehículos</p>
              <Link
                to={`/comprar?marca=${encodeURIComponent(listing.brand)}`}
                className="block text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Ver todos los {listing.brand} →
              </Link>
              {listing.dealership && (
                <Link
                  to={`/comprar?marca=${encodeURIComponent(listing.brand)}`}
                  className="block text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  Ver todos de {listing.dealership.name} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reviews section */}
        {listing.dealership_id && (
          <div className="mt-12">
            <h3 className="text-xl font-heading font-bold text-text-primary mb-6">
              Opiniones de la concesionaria ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-4 mb-8">
                {reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary mb-6">Aún no hay opiniones. ¡Sé el primero!</p>
            )}

            {/* Review form */}
            {authUser && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="text-sm font-bold text-text-primary mb-3">Dejá tu opinión</h4>
                <div className="mb-3">
                  <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
                </div>
                <textarea
                  rows={3}
                  placeholder="Contá tu experiencia con esta concesionaria..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none mb-3"
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewRating === 0}
                >
                  {submittingReview ? 'Enviando...' : 'Enviar opinión'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Similar vehicles */}
        {similarListings.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-heading font-bold text-text-primary mb-6">
              Vehículos similares
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-0 -mx-4 sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible sm:pb-0">
              {similarListings.map((sl) => (
                <div key={sl.id} className="min-w-[280px] sm:min-w-0">
                  <ListingCard listing={sl} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>

      {lightboxOpen && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          currentIndex={selectedPhoto}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setSelectedPhoto((i) => (i - 1 + photos.length) % photos.length)}
          onNext={() => setSelectedPhoto((i) => (i + 1) % photos.length)}
        />
      )}

      {showLeadModal && listing && (
        <WhatsAppLeadModal
          listingId={listing.id}
          listingTitle={listing.title}
          sellerId={listing.seller_id}
          dealershipId={listing.dealership_id}
          whatsappUrl={whatsappUrl}
          onClose={() => setShowLeadModal(false)}
        />
      )}
    </div>
  );
}
