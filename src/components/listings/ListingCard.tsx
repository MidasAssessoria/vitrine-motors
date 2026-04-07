import { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  MessageCircle,
  CheckCircle2,
  Star,
  Car,
  Bike,
  Ship,
  Zap,
  Clock,
  Scale,
} from 'lucide-react';
import type { Listing } from '../../types';
import {
  formatPrice,
  formatMileage,
  getFuelLabel,
  getWhatsAppUrl,
} from '../../utils/formatters';
import { useListingsStore } from '../../stores/listingsStore';
import { useAuthStore } from '../../stores/authStore';
import { useComparisonStore } from '../../stores/comparisonStore';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = memo(function ListingCard({ listing }: ListingCardProps) {
  const favorites = useListingsStore((s) => s.favorites);
  const toggleFavorite = useListingsStore((s) => s.toggleFavorite);
  const user = useAuthStore((s) => s.user);
  const addToCompare = useComparisonStore((s) => s.addToCompare);
  const removeFromCompare = useComparisonStore((s) => s.removeFromCompare);
  const isCompared = useComparisonStore((s) => s.isCompared);
  const isFavorite = favorites.includes(listing.id);
  const isInComparison = isCompared(listing.id);

  const coverPhoto = listing.photos?.[0]?.url;
  const [imgError, setImgError] = useState(false);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id, user?.id);
  }, [listing.id, user?.id, toggleFavorite]);

  const handleWhatsAppClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(
      getWhatsAppUrl(listing.whatsapp_contact, listing.title),
      '_blank',
      'noopener,noreferrer'
    );
  }, [listing.whatsapp_contact, listing.title]);

  const handleCompareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInComparison ? removeFromCompare(listing.id) : addToCompare(listing.id);
  }, [listing.id, isInComparison, addToCompare, removeFromCompare]);

  return (
    <Link
      to={`/vehiculo/${listing.id}`}
      className="group block rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover shadow-card w-full h-full border border-border/60 hover:border-primary/20 border-top-gradient"
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
        {coverPhoto && !imgError ? (
          <img
            src={coverPhoto}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-3 bg-gradient-to-br from-bg-secondary to-border/20">
            <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
              {listing.vehicle_type === 'moto' ? <Bike size={28} className="text-primary/60" /> :
               listing.vehicle_type === 'barco' ? <Ship size={28} className="text-primary/60" /> :
               <Car size={28} className="text-primary/60" />}
            </div>
            <span className="text-[11px] text-text-secondary/70 font-medium">Sin fotos</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {listing.tier === 'gold' && (
            <span className="badge-gold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Star size={10} />
              GOLD
            </span>
          )}
          {listing.tier === 'silver' && (
            <span className="badge-silver text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Star size={10} />
              SILVER
            </span>
          )}
          {listing.tier !== 'gold' && listing.tier !== 'silver' && listing.featured && (
            <span className="bg-gradient-to-r from-primary to-primary-dark text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Star size={10} />
              DESTACADO
            </span>
          )}
          {listing.condition === '0km' && (
            <span className="bg-success-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              0KM
            </span>
          )}
        </div>

        {/* Favorite Heart + Compare */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart
              size={16}
              className={
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-text-secondary'
              }
            />
          </button>
          <button
            type="button"
            onClick={handleCompareClick}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
              isInComparison ? 'bg-blue-500 text-white' : 'bg-white/90'
            }`}
            aria-label={isInComparison ? 'Quitar de comparacion' : 'Agregar a comparacion'}
          >
            <Scale size={14} className={isInComparison ? 'text-white' : 'text-text-secondary'} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors font-heading">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-lg font-bold text-primary font-heading tracking-tight">
            {formatPrice(listing.price_usd)}
          </p>
          {listing.inspection_status === 'approved' && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-verified-blue bg-verified-blue/10 px-1.5 py-0.5 rounded">
              <CheckCircle2 size={10} /> Inspeccionado
            </span>
          )}
        </div>

        {/* Specs Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
            <Calendar size={11} />
            {listing.year}
          </span>
          {(listing.vehicle_type || 'auto') === 'moto' ? (
            <>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Zap size={11} />
                {listing.engine_cc ? `${listing.engine_cc}cc` : '—'}
              </span>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Fuel size={11} />
                {getFuelLabel(listing.fuel)}
              </span>
            </>
          ) : (listing.vehicle_type) === 'barco' ? (
            <>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Zap size={11} />
                {listing.engine_hp ? `${listing.engine_hp} HP` : '—'}
              </span>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Clock size={11} />
                {listing.hours_used ? `${listing.hours_used}h` : '—'}
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Gauge size={11} />
                {formatMileage(listing.mileage)}
              </span>
              <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
                <Fuel size={11} />
                {getFuelLabel(listing.fuel)}
              </span>
            </>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
          <MapPin size={13} />
          <span>{listing.city}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-border mt-3 pt-3">
          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            {/* Dealership Info */}
            <div className="flex items-center gap-2">
              {listing.dealership ? (
                <>
                  {listing.dealership.logo_url && (
                    <img
                      src={listing.dealership.logo_url}
                      alt={listing.dealership.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="text-xs text-text-secondary truncate max-w-[120px]">
                    {listing.dealership.name}
                  </span>
                  {listing.dealership.verified && (
                    <CheckCircle2
                      size={13}
                      className="text-verified-blue flex-shrink-0"
                      aria-label="Verificado"
                    />
                  )}
                  {listing.dealership.avg_rating && listing.dealership.avg_rating >= 4 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Star size={9} className="fill-amber-500 text-amber-500" />
                      {listing.dealership.avg_rating.toFixed(1)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-text-secondary">Particular</span>
              )}
            </div>

            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="bg-whatsapp hover:bg-whatsapp/90 text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageCircle size={13} />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});
