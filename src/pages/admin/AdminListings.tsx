import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Star, Trash2, Search, Loader2, ExternalLink, Pencil, ClipboardCheck, ShieldCheck, ShieldX } from 'lucide-react';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { fetchAllListings } from '../../lib/dealers';
import { updateListingStatus, toggleListingFeatured, deleteListing, updateInspectionStatus } from '../../lib/listings';
import { formatPrice, formatDate } from '../../utils/formatters';
import type { Listing, ListingStatus } from '../../types';

type StatusFilter = 'all' | 'pending' | 'active' | 'paused' | 'rejected' | 'inspection';

interface InspectionApproveModal {
  listingId: string;
  listingTitle: string;
}

export function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [inspectModal, setInspectModal] = useState<InspectionApproveModal | null>(null);
  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectSaving, setInspectSaving] = useState(false);

  useEffect(() => {
    fetchAllListings().then((data) => {
      setListings(data as Listing[]);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id: string) => {
    setListings((p) => p.map((l) => (l.id === id ? { ...l, status: 'active' as ListingStatus } : l)));
    await updateListingStatus(id, 'active');
  };

  const handleReject = async (id: string) => {
    setListings((p) => p.map((l) => (l.id === id ? { ...l, status: 'rejected' as ListingStatus } : l)));
    await updateListingStatus(id, 'rejected');
  };

  const handleToggleFeatured = async (id: string) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing) return;
    setListings((p) => p.map((l) => (l.id === id ? { ...l, featured: !l.featured } : l)));
    await toggleListingFeatured(id, !listing.featured);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio permanentemente?')) return;
    setListings((p) => p.filter((l) => l.id !== id));
    await deleteListing(id);
  };

  const openInspectApprove = (listing: Listing) => {
    setInspectUrl(listing.inspection_url || '');
    setInspectModal({ listingId: listing.id, listingTitle: listing.title });
  };

  const handleInspectApprove = async () => {
    if (!inspectModal) return;
    setInspectSaving(true);
    try {
      await updateInspectionStatus(inspectModal.listingId, 'approved', inspectUrl || undefined);
      setListings((p) =>
        p.map((l) =>
          l.id === inspectModal.listingId
            ? { ...l, inspection_status: 'approved', inspection_url: inspectUrl || l.inspection_url }
            : l
        )
      );
      setInspectModal(null);
      setInspectUrl('');
    } finally {
      setInspectSaving(false);
    }
  };

  const handleInspectReject = async (id: string) => {
    if (!confirm('¿Rechazar la inspección de este vehículo?')) return;
    await updateInspectionStatus(id, 'rejected');
    setListings((p) =>
      p.map((l) => (l.id === id ? { ...l, inspection_status: 'rejected' } : l))
    );
  };

  const filtered = listings
    .filter((l) => {
      if (filter === 'inspection') return l.inspection_status === 'pending';
      if (filter === 'all') return true;
      return l.status === filter;
    })
    .filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.brand.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: listings.length,
    pending: listings.filter((l) => l.status === 'pending').length,
    active: listings.filter((l) => l.status === 'active').length,
    paused: listings.filter((l) => l.status === 'paused').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
    inspection: listings.filter((l) => l.inspection_status === 'pending').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Anuncios</h1>
          <p className="text-sm text-text-secondary mt-1">{listings.length} anuncios en el sistema</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por título o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {(['all', 'pending', 'active', 'paused', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filter === s ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'
            }`}
          >
            {s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
        <button
          onClick={() => setFilter('inspection')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
            filter === 'inspection'
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-border text-text-secondary hover:border-amber-500 hover:text-amber-600'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Inspección ({counts.inspection})
        </button>
      </div>

      {/* Listings list */}
      <div className="space-y-3">
        {filtered.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start gap-4">
              <img
                src={listing.photos?.[0]?.url || ''}
                alt={listing.title}
                className="w-24 h-18 rounded-xl object-cover bg-bg-secondary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-text-primary">{listing.title}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {listing.brand} · {listing.year} · {listing.city}
                      {listing.dealership ? ` · ${(listing.dealership as { name: string }).name}` : ' · Particular'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {listing.inspection_status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        <ClipboardCheck className="w-3 h-3" /> Insp. pendiente
                      </span>
                    )}
                    {listing.inspection_status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Insp. aprobada
                      </span>
                    )}
                    <StatusBadge status={listing.status} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-bold text-primary">{formatPrice(listing.price_usd)}</span>
                  <span className="text-xs text-text-secondary">{formatDate(listing.created_at)}</span>
                  <span className="text-xs text-text-secondary">{listing.views_count} views</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
              {listing.status === 'pending' && (
                <>
                  <button onClick={() => handleApprove(listing.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-green/10 text-success-green text-xs font-medium hover:bg-success-green/20 transition-colors cursor-pointer">
                    <Check className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button onClick={() => handleReject(listing.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red text-xs font-medium hover:bg-accent-red/20 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </>
              )}

              {listing.inspection_status === 'pending' && (
                <>
                  <button
                    onClick={() => openInspectApprove(listing)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Aprobar inspección
                  </button>
                  <button
                    onClick={() => handleInspectReject(listing.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red text-xs font-medium hover:bg-accent-red/20 transition-colors cursor-pointer"
                  >
                    <ShieldX className="w-3.5 h-3.5" /> Rechazar inspección
                  </button>
                </>
              )}

              <button onClick={() => handleToggleFeatured(listing.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${listing.featured ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-secondary hover:text-primary'}`}>
                <Star className={`w-3.5 h-3.5 ${listing.featured ? 'fill-current' : ''}`} /> {listing.featured ? 'Destacado' : 'Destacar'}
              </button>
              <Link to={`/editar/${listing.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-xs font-medium hover:text-primary transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Link>
              <a href={`/vehiculo/${listing.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-xs font-medium hover:text-primary transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Ver
              </a>
              <button onClick={() => handleDelete(listing.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-colors cursor-pointer ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">No se encontraron anuncios</div>
        )}
      </div>

      {/* Inspection approve modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-heading font-bold text-text-primary mb-1">Aprobar inspección</h3>
            <p className="text-sm text-text-secondary mb-4">{inspectModal.listingTitle}</p>

            <label className="block text-sm font-medium text-text-primary mb-1">
              URL del laudo / informe de inspección
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary mb-5"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setInspectModal(null); setInspectUrl(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInspectApprove}
                disabled={inspectSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success-green text-white text-sm font-semibold hover:bg-success-green/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {inspectSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Confirmar aprobación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
