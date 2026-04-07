import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pause, Play, Star, Trash2, Loader2, ClipboardCheck, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useAuthStore } from '../../stores/authStore';
import { useImpersonationStore } from '../../stores/impersonationStore';
import { fetchSellerListings, updateListingStatus, toggleListingFeatured, deleteListing, requestInspection } from '../../lib/listings';
import { formatPrice } from '../../utils/formatters';
import type { Listing } from '../../types';

export function DealerInventory() {
  const user = useAuthStore((s) => s.user);
  const impersonating = useImpersonationStore((s) => s.impersonating);
  const effectiveId = impersonating?.id ?? user?.id;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingInspectionId, setRequestingInspectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveId) return;
    fetchSellerListings(effectiveId).then((data) => { setListings(data); setLoading(false); });
  }, [effectiveId]);

  const handleToggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    setListings((p) => p.map((l) => (l.id === id ? { ...l, status: next as Listing['status'] } : l)));
    await updateListingStatus(id, next);
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setListings((p) => p.map((l) => (l.id === id ? { ...l, featured: !current } : l)));
    await toggleListingFeatured(id, !current);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    setListings((p) => p.filter((l) => l.id !== id));
    await deleteListing(id);
  };

  const handleRequestInspection = async (id: string) => {
    setRequestingInspectionId(id);
    try {
      await requestInspection(id);
      setListings((p) => p.map((l) => l.id === id ? { ...l, inspection_status: 'pending' } : l));
    } catch {
      // silently fail
    } finally {
      setRequestingInspectionId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Inventario</h1>
          <p className="text-sm text-text-secondary mt-1">{listings.length} vehículos</p>
        </div>
        <Link to="/publicar">
          <Button size="lg" className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Nuevo anuncio</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Sin anuncios</h3>
          <p className="text-sm text-text-secondary mb-6">Publicá tu primer vehículo</p>
          <Link to="/publicar"><Button className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Publicar</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-4">
                <img src={l.photos?.[0]?.url || ''} alt={l.title} className="w-24 h-18 rounded-xl object-cover bg-bg-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-heading font-bold text-text-primary">{l.title}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{l.year} · {l.city} · {l.views_count} views</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {l.inspection_status === 'approved' && (
                        <span title="Inspección aprobada" className="text-green-600"><ShieldCheck className="w-4 h-4" /></span>
                      )}
                      {l.inspection_status === 'pending' && (
                        <span title="Inspección en revisión" className="text-amber-500"><ClipboardCheck className="w-4 h-4" /></span>
                      )}
                      {l.inspection_status === 'rejected' && (
                        <span title="Inspección rechazada" className="text-accent-red"><ShieldX className="w-4 h-4" /></span>
                      )}
                      <StatusBadge status={l.status} />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">{formatPrice(l.price_usd)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                {l.status === 'active' && (!l.inspection_status || l.inspection_status === 'none') && (
                  <button
                    onClick={() => handleRequestInspection(l.id)}
                    disabled={requestingInspectionId === l.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {requestingInspectionId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                    Solicitar inspección
                  </button>
                )}
                <button onClick={() => handleToggleStatus(l.id, l.status)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-xs font-medium hover:text-text-primary transition-colors cursor-pointer">
                  {l.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pausar</> : <><Play className="w-3.5 h-3.5" /> Activar</>}
                </button>
                <button onClick={() => handleToggleFeatured(l.id, l.featured)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${l.featured ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-secondary'}`}>
                  <Star className={`w-3.5 h-3.5 ${l.featured ? 'fill-current' : ''}`} /> {l.featured ? 'Destacado' : 'Destacar'}
                </button>
                <button onClick={() => handleDelete(l.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-accent-red/10 hover:text-accent-red transition-colors cursor-pointer ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
