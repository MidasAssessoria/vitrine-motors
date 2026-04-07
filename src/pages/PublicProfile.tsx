import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { ListingCard } from '../components/listings/ListingCard';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { StarRating } from '../components/reviews/StarRating';
import { SEOHead } from '../components/SEOHead';
import {
  MapPin, Calendar, CheckCircle2, MessageCircle, Loader2,
  Shield, Globe, Phone, Building2, User,
} from 'lucide-react';
import {
  fetchPublicProfile, fetchSellerDealership, fetchDealershipById,
  fetchSellerListings, fetchDealershipListings,
  fetchSellerReviews, fetchDealerReviewsPublic, fetchAverageRating,
} from '../lib/publicProfile';
import { createReview } from '../lib/reviews';
import { useAuthStore } from '../stores/authStore';
import { getWhatsAppUrl } from '../utils/formatters';
import type { Profile, Dealership, Listing, Review } from '../types';

interface PublicProfileProps {
  type: 'seller' | 'dealership';
}

export function PublicProfile({ type }: PublicProfileProps) {
  const { id } = useParams<{ id: string }>();
  const authUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const load = async () => {
      if (type === 'seller') {
        // Perfil de vendedor particular
        const p = await fetchPublicProfile(id);
        setProfile(p);
        const d = await fetchSellerDealership(id);
        setDealership(d);
        const l = await fetchSellerListings(id);
        setListings(l);
        const r = await fetchSellerReviews(id);
        setReviews(r);
        const avg = await fetchAverageRating({ sellerId: id });
        setRating(avg);
      } else {
        // Perfil de concessionária
        const d = await fetchDealershipById(id);
        setDealership(d);
        if (d) {
          const p = await fetchPublicProfile(d.owner_id);
          setProfile(p);
          const l = await fetchDealershipListings(id);
          setListings(l);
          const r = await fetchDealerReviewsPublic(id);
          setReviews(r);
          const avg = await fetchAverageRating({ dealerId: id });
          setRating(avg);
        }
      }
      setLoading(false);
    };

    load();
  }, [id, type]);

  const handleSubmitReview = async () => {
    if (!authUser || !id || reviewRating === 0) return;
    setSubmittingReview(true);
    await createReview({
      user_id: authUser.id,
      dealer_id: type === 'dealership' ? id : null,
      seller_id: type === 'seller' ? id : null,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewRating(0);
    setReviewComment('');
    setSubmittingReview(false);

    // Reload reviews
    if (type === 'seller') {
      fetchSellerReviews(id!).then(setReviews);
      fetchAverageRating({ sellerId: id! }).then(setRating);
    } else {
      fetchDealerReviewsPublic(id!).then(setReviews);
      fetchAverageRating({ dealerId: id! }).then(setRating);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !dealership) {
    return (
      <Container className="py-20 text-center">
        <User className="w-16 h-16 text-border mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Perfil no encontrado</h2>
        <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
      </Container>
    );
  }

  const displayName = type === 'dealership' && dealership ? dealership.name : profile?.name || 'Vendedor';
  const avatarUrl = type === 'dealership' && dealership?.logo_url ? dealership.logo_url : profile?.avatar_url;
  const bio = type === 'dealership' && dealership?.description ? dealership.description : profile?.bio;
  const city = type === 'dealership' && dealership?.city ? dealership.city : profile?.city;
  const whatsapp = type === 'dealership' && dealership?.whatsapp ? dealership.whatsapp : profile?.whatsapp;
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }) : '';
  const isVerified = type === 'dealership' ? dealership?.verified : profile?.document_verified;

  return (
    <div className="min-h-screen bg-bg">
      <SEOHead title={displayName} description={`Perfil de ${displayName} en VitrineMotors`} />

      <Container className="py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : type === 'dealership' ? (
                <Building2 className="w-12 h-12 text-border" />
              ) : (
                <User className="w-12 h-12 text-border" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-heading font-bold text-text-primary">{displayName}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-verified-blue bg-verified-blue/10 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Verificado
                  </span>
                )}
                {type === 'dealership' && dealership?.approved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-success-green bg-success-green/10 px-2 py-1 rounded-full">
                    <Shield size={12} /> Concesionaria oficial
                  </span>
                )}
              </div>

              {/* Rating */}
              {rating.count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={Math.round(rating.avg)} />
                  <span className="text-sm font-medium text-text-primary">{rating.avg}</span>
                  <span className="text-sm text-text-secondary">({rating.count} opiniones)</span>
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-secondary">
                {city && (
                  <span className="flex items-center gap-1"><MapPin size={14} /> {city}</span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1"><Calendar size={14} /> Miembro desde {memberSince}</span>
                )}
                {type === 'dealership' && dealership?.ruc && (
                  <span className="text-xs text-text-secondary">RUC: {dealership.ruc}</span>
                )}
              </div>

              {/* Dealership extra info */}
              {type === 'dealership' && dealership && (
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-text-secondary">
                  {dealership.address && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {dealership.address}</span>
                  )}
                  {dealership.phone && (
                    <a href={`tel:${dealership.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone size={14} /> {dealership.phone}</a>
                  )}
                  {dealership.website && (
                    <a href={dealership.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><Globe size={14} /> Sitio web</a>
                  )}
                </div>
              )}

              {/* WhatsApp */}
              {whatsapp && (
                <a
                  href={getWhatsAppUrl(whatsapp, `Hola, vi tu perfil en VitrineMotors`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 bg-whatsapp hover:bg-whatsapp/90 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <MessageCircle size={16} /> Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                {type === 'dealership' ? 'Sobre la concesionaria' : 'Sobre mí'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{bio}</p>
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-text-primary">
              Anuncios activos ({listings.length})
            </h2>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <p className="text-sm text-text-secondary">No hay anuncios activos</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-heading font-bold text-text-primary mb-6">
            Opiniones ({reviews.length})
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-4 mb-8">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary mb-8">Aún no hay opiniones. ¡Sé el primero!</p>
          )}

          {/* Review form */}
          {authUser && authUser.id !== (type === 'seller' ? id : dealership?.owner_id) && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h4 className="text-sm font-bold text-text-primary mb-3">Dejá tu opinión</h4>
              <div className="mb-3">
                <StarRating rating={reviewRating} interactive onChange={setReviewRating} />
              </div>
              <textarea
                rows={3}
                placeholder="Contá tu experiencia..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none mb-3"
              />
              <Button onClick={handleSubmitReview} disabled={submittingReview || reviewRating === 0}>
                {submittingReview ? 'Enviando...' : 'Enviar opinión'}
              </Button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
