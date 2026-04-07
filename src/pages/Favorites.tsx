import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ListingCard } from '../components/listings/ListingCard';
import { useListingsStore } from '../stores/listingsStore';

export function Favorites() {
  const { listings, favorites } = useListingsStore();

  const favoriteListings = useMemo(
    () => listings.filter((l) => favorites.includes(l.id)),
    [listings, favorites]
  );

  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/comprar"
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary bg-bg-secondary hover:bg-primary-light rounded-full px-4 py-2 transition-all"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Mis Favoritos
          </h1>
        </div>

        {favoriteListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-heading font-bold text-text-primary mb-2">
              No tienes favoritos aun
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Explora nuestros vehiculos y guarda los que te interesen tocando el corazon.
            </p>
            <Link to="/comprar">
              <Button variant="primary">Explorar vehiculos</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-secondary mb-6">
              <span className="font-bold text-text-primary">{favoriteListings.length}</span>{' '}
              vehiculo{favoriteListings.length !== 1 ? 's' : ''} guardado{favoriteListings.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
