import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Pause, Play, Star, Trash2, Car, Eye, Loader2,
  Users, TrendingUp, MessageCircle, ChevronRight,
  Flame, Thermometer, Snowflake, Mail, Pencil,
  Download, AlertTriangle, ClipboardCheck, ShieldCheck, ShieldX,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { fetchSellerListings, updateListingStatus, toggleListingFeatured, deleteListing, requestInspection } from '../../lib/listings';
import { fetchLeads, updateLeadStatus, subscribeToNewLeads } from '../../lib/leads';
import { isLeadAged, getValidLeadTransitions } from '../../lib/leadUtils';
import { downloadLeadsCsv } from '../../lib/leadExport';
import { LeadInteractionPanel } from '../../components/crm/LeadInteractionPanel';
import { SaleClosureModal } from '../../components/crm/SaleClosureModal';
import { mockListings } from '../../data/mockListings';
import { formatPrice, formatDate } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import type { Listing, ListingStatus, Lead, LeadStatus } from '../../types';

type DashTab = 'listings' | 'leads';

const LEAD_STATUS_FLOW: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  { key: 'contacted', label: 'Contactado', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'negotiating', label: 'Negociando', color: 'bg-purple-100 text-purple-700' },
  { key: 'test_drive', label: 'Test Drive', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'sold', label: 'Vendido', color: 'bg-green-100 text-green-700' },
  { key: 'lost', label: 'Perdido', color: 'bg-red-100 text-red-700' },
];

const TEMP_ICONS = {
  hot: { icon: Flame, color: 'text-red-500', label: 'Caliente' },
  warm: { icon: Thermometer, color: 'text-orange-500', label: 'Tibio' },
  cold: { icon: Snowflake, color: 'text-blue-400', label: 'Frio' },
};

// Mock leads for dev without Supabase
function getMockLeads(userId: string): Lead[] {
  return [
    {
      id: 'lead-1', listing_id: 'mock-1', dealer_id: null, seller_id: userId,
      buyer_name: 'Carlos Gonzalez', buyer_phone: '+595981234567', buyer_email: 'carlos@email.com',
      source: 'whatsapp', status: 'new', temperature: 'hot',
      expected_close_date: null, deal_value: 25000, loss_reason: '', notes: 'Quiere financiar',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'lead-2', listing_id: 'mock-2', dealer_id: null, seller_id: userId,
      buyer_name: 'Maria Lopez', buyer_phone: '+595971234567', buyer_email: 'maria@email.com',
      source: 'form', status: 'contacted', temperature: 'warm',
      expected_close_date: null, deal_value: 18000, loss_reason: '', notes: '',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'lead-3', listing_id: 'mock-3', dealer_id: null, seller_id: userId,
      buyer_name: 'Pedro Martinez', buyer_phone: '+595961234567', buyer_email: '',
      source: 'phone', status: 'negotiating', temperature: 'warm',
      expected_close_date: null, deal_value: 32000, loss_reason: '', notes: 'Viene el sabado',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ];
}

export function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashTab>('listings');
  const [leadFilter, setLeadFilter] = useState<LeadStatus | 'all'>('all');
  const [closingLead, setClosingLead] = useState<Lead | null>(null);
  const [requestingInspectionId, setRequestingInspectionId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (user && supabase) {
        const [listData, leadData] = await Promise.all([
          fetchSellerListings(user.id),
          fetchLeads({ sellerId: user.id }),
        ]);
        setListings(listData);
        setLeads(leadData);
      } else if (user) {
        setListings(mockListings.slice(0, 5));
        setLeads(getMockLeads(user.id));
      } else {
        setListings(mockListings.slice(0, 5));
        setLeads([]);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  // Live leads refresh via Supabase realtime
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNewLeads(
      { type: 'seller', sellerId: user.id },
      (newLead) => {
        setLeads((prev) =>
          prev.some((l) => l.id === newLead.id) ? prev : [newLead, ...prev]
        );
      }
    );
    return unsub;
  }, [user]);

  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const totalContacts = leads.length;
  const hotLeads = leads.filter((l) => l.temperature === 'hot').length;

  const filteredLeads = useMemo(() => {
    if (leadFilter === 'all') return leads;
    return leads.filter((l) => l.status === leadFilter);
  }, [leads, leadFilter]);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return 0;
    const sold = leads.filter((l) => l.status === 'sold').length;
    return Math.round((sold / leads.length) * 100);
  }, [leads]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    // Solo permitir toggle entre active <-> paused (no desde pending/rejected)
    if (currentStatus !== 'active' && currentStatus !== 'paused') return;
    const next = currentStatus === 'active' ? 'paused' : 'active';
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: next as ListingStatus } : l)));
    if (supabase) {
      try { await updateListingStatus(id, next); } catch { /* rollback on error */ }
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, featured: !currentFeatured } : l)));
    if (supabase) {
      try { await toggleListingFeatured(id, !currentFeatured); } catch { /* rollback */ }
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Seguro que queres eliminar este anuncio?')) return;
    setListings((prev) => prev.filter((l) => l.id !== id));
    if (supabase) {
      try { await deleteListing(id); } catch { /* rollback */ }
    }
  };

  const handleRequestInspection = async (id: string) => {
    setRequestingInspectionId(id);
    try {
      await requestInspection(id);
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, inspection_status: 'pending' } : l));
    } catch {
      // silently fail — user sees no change
    } finally {
      setRequestingInspectionId(null);
    }
  };

  const handleLeadStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    if (newStatus === 'sold') {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) { setClosingLead(lead); return; }
    }
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    if (supabase) {
      try { await updateLeadStatus(leadId, newStatus); } catch { /* rollback */ }
    }
  };

  const statusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active': return <Badge variant="new">Activo</Badge>;
      case 'pending': return <Badge variant="featured">Pendiente</Badge>;
      case 'paused': return <Badge variant="default">Pausado</Badge>;
      case 'rejected': return <Badge variant="default">Rechazado</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            Panel del vendedor
          </h1>
          {user && (
            <p className="text-sm text-text-secondary mt-1">Hola, {user.name}</p>
          )}
        </div>
        <Button href="/publicar" size="lg" className="rounded-xl shadow-card">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo anuncio
        </Button>
      </div>

      {/* Stats Row - 4 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-2">
            <Car className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold font-heading text-text-primary">{listings.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Anuncios</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-2">
            <Eye className="text-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold font-heading text-text-primary">{totalViews.toLocaleString('es-PY')}</p>
          <p className="text-xs text-text-secondary mt-0.5">Vistas</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
            <Users className="text-green-600 w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold font-heading text-text-primary">{totalContacts}</p>
          <p className="text-xs text-text-secondary mt-0.5">Contactos</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="text-orange-600 w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold font-heading text-text-primary">{conversionRate}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Conversion</p>
        </div>
      </div>

      {/* Hot leads alert */}
      {hotLeads > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Flame className="text-red-500 w-5 h-5 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Tenes {hotLeads} {hotLeads === 1 ? 'contacto caliente' : 'contactos calientes'} esperando respuesta
          </p>
          <button
            type="button"
            onClick={() => { setActiveTab('leads'); setLeadFilter('all'); }}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
          >
            Ver <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 mb-6 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Car size={14} className="inline mr-1.5 -mt-0.5" />
          Mis anuncios ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={14} className="inline mr-1.5 -mt-0.5" />
          Contactos ({leads.length})
          {hotLeads > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {hotLeads}
            </span>
          )}
        </button>
      </div>

      {/* ═══ LISTINGS TAB ═══ */}
      {activeTab === 'listings' && (
        <>
          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
              <Car className="w-16 h-16 text-border mx-auto mb-4" />
              <h3 className="text-lg font-heading font-bold text-text-primary mb-2">No tenes anuncios aun</h3>
              <p className="text-sm text-text-secondary mb-6">Publica tu primer vehiculo y empeza a recibir consultas</p>
              <Button href="/publicar" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Publicar mi primer vehiculo
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden shadow-card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary/80">
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Vehiculo</th>
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Precio</th>
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Estado</th>
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Vistas</th>
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Contactos</th>
                      <th className="text-left text-xs font-semibold text-text-secondary px-4 py-3">Fecha</th>
                      <th className="text-right text-xs font-semibold text-text-secondary px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => {
                      const listingLeads = leads.filter((l) => l.listing_id === listing.id).length;
                      return (
                        <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-primary-light/30 transition-colors">
                          <td className="px-4 py-3">
                            <Link to={`/vehiculo/${listing.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                              <img src={listing.photos?.[0]?.url || ''} alt={listing.title} className="w-12 h-9 rounded-lg object-cover bg-bg-secondary" />
                              <span className="text-sm font-medium text-text-primary">{listing.title}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-text-primary">{formatPrice(listing.price_usd)}</td>
                          <td className="px-4 py-3">{statusBadge(listing.status)}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{(listing.views_count || 0).toLocaleString('es-PY')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${listingLeads > 0 ? 'text-green-600' : 'text-text-secondary'}`}>
                              {listingLeads}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(listing.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {listing.status === 'pending' && (
                                <span className="text-xs text-amber-600 font-medium px-2">Pendiente de aprobación</span>
                              )}
                              {listing.status === 'rejected' && (
                                <span className="text-xs text-accent-red font-medium px-2">Rechazado</span>
                              )}
                              {/* Inspection badge/button */}
                              {listing.inspection_status === 'approved' && (
                                <span title="Inspección aprobada" className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600">
                                  <ShieldCheck className="w-4 h-4" />
                                </span>
                              )}
                              {listing.inspection_status === 'pending' && (
                                <span title="Inspección en revisión" className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500">
                                  <ClipboardCheck className="w-4 h-4" />
                                </span>
                              )}
                              {listing.inspection_status === 'rejected' && (
                                <span title="Inspección rechazada" className="w-8 h-8 rounded-lg flex items-center justify-center text-accent-red">
                                  <ShieldX className="w-4 h-4" />
                                </span>
                              )}
                              {listing.status === 'active' && (!listing.inspection_status || listing.inspection_status === 'none') && (
                                <button
                                  onClick={() => handleRequestInspection(listing.id)}
                                  disabled={requestingInspectionId === listing.id}
                                  title="Solicitar inspección"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50 text-text-secondary hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {requestingInspectionId === listing.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <ClipboardCheck className="w-4 h-4" />}
                                </button>
                              )}
                              {(listing.status === 'active' || listing.status === 'paused') && (
                                <button onClick={() => handleToggleStatus(listing.id, listing.status)} title={listing.status === 'active' ? 'Pausar' : 'Activar'} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                                  {listing.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                              )}
                              <Link to={`/editar/${listing.id}`} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-secondary text-text-secondary hover:text-primary transition-colors">
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} title="Destacar" className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-secondary transition-colors cursor-pointer ${listing.featured ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
                                <Star className={`w-4 h-4 ${listing.featured ? 'fill-current' : ''}`} />
                              </button>
                              <button onClick={() => handleRemove(listing.id)} title="Eliminar" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent-red/10 text-text-secondary hover:text-accent-red transition-colors cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={listing.photos?.[0]?.url || ''} alt={listing.title} className="w-20 h-14 rounded-xl object-cover bg-bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{listing.title}</p>
                        <p className="text-sm font-semibold text-primary">{formatPrice(listing.price_usd)}</p>
                      </div>
                      {statusBadge(listing.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                      <span>{(listing.views_count || 0).toLocaleString('es-PY')} vistas</span>
                      <span>{formatDate(listing.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-4 border-t border-border pt-3 flex-wrap">
                      {listing.status === 'pending' && (
                        <span className="text-xs text-amber-600 font-medium">Pendiente de aprobación</span>
                      )}
                      {listing.status === 'rejected' && (
                        <span className="text-xs text-accent-red font-medium">Rechazado</span>
                      )}
                      {listing.inspection_status === 'approved' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><ShieldCheck className="w-3.5 h-3.5" /> Insp. aprobada</span>
                      )}
                      {listing.inspection_status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><ClipboardCheck className="w-3.5 h-3.5" /> Insp. en revisión</span>
                      )}
                      {listing.inspection_status === 'rejected' && (
                        <span className="flex items-center gap-1 text-xs text-accent-red font-medium"><ShieldX className="w-3.5 h-3.5" /> Insp. rechazada</span>
                      )}
                      {listing.status === 'active' && (!listing.inspection_status || listing.inspection_status === 'none') && (
                        <button onClick={() => handleRequestInspection(listing.id)} disabled={requestingInspectionId === listing.id} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors cursor-pointer disabled:opacity-50">
                          {requestingInspectionId === listing.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />} Solicitar inspección
                        </button>
                      )}
                      {(listing.status === 'active' || listing.status === 'paused') && (
                        <button onClick={() => handleToggleStatus(listing.id, listing.status)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                          {listing.status === 'active' ? <><Pause className="w-3.5 h-3.5" /> Pausar</> : <><Play className="w-3.5 h-3.5" /> Activar</>}
                        </button>
                      )}
                      <Link to={`/editar/${listing.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Link>
                      <button onClick={() => handleToggleFeatured(listing.id, listing.featured)} className={`flex items-center gap-1 text-xs transition-colors cursor-pointer ${listing.featured ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}>
                        <Star className={`w-3.5 h-3.5 ${listing.featured ? 'fill-current' : ''}`} /> Destacar
                      </button>
                      <button onClick={() => handleRemove(listing.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-red transition-colors cursor-pointer ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ LEADS/CRM TAB ═══ */}
      {activeTab === 'leads' && (
        <>
          {/* Aged leads alert + CSV export */}
          {leads.length > 0 && (() => {
            const agedCount = leads.filter((l) => isLeadAged(l)).length;
            return (
              <div className="flex items-center gap-3 mb-4">
                {agedCount > 0 && (
                  <div className="flex-1 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      {agedCount} {agedCount === 1 ? 'lead sin atención +24h' : 'leads sin atención +24h'}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => downloadLeadsCsv(leads)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text-secondary border border-border rounded-xl hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0 ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>
            );
          })()}

          {/* Status filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setLeadFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                leadFilter === 'all' ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos ({leads.length})
            </button>
            {LEAD_STATUS_FLOW.map((s) => {
              const count = leads.filter((l) => l.status === s.key).length;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setLeadFilter(s.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    leadFilter === s.key ? 'bg-primary text-white' : `${s.color}`
                  }`}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>

          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
              <Users className="w-16 h-16 text-border mx-auto mb-4" />
              <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Sin contactos</h3>
              <p className="text-sm text-text-secondary">Cuando alguien se interese en tus vehiculos, aparecera aca</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLeads.map((lead) => {
                const TempData = TEMP_ICONS[lead.temperature];
                const TempIcon = TempData.icon;
                const statusInfo = LEAD_STATUS_FLOW.find((s) => s.key === lead.status);
                const aged = isLeadAged(lead);
                const validNext = getValidLeadTransitions(lead.status);
                return (
                  <div key={lead.id} className={`bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-shadow ${aged ? 'border-amber-300' : 'border-border'}`}>
                    {/* Lead header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {lead.buyer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-text-primary">{lead.buyer_name}</p>
                            {aged && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                +24h
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <TempIcon size={12} className={TempData.color} />
                            <span className={`text-[10px] font-medium ${TempData.color}`}>{TempData.label}</span>
                            <span className="text-[10px] text-text-secondary">
                              · {formatDate(lead.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusInfo?.color || ''}`}>
                        {statusInfo?.label}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {lead.buyer_phone && (
                        <a
                          href={`https://wa.me/${lead.buyer_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle size={12} />
                          {lead.buyer_phone}
                        </a>
                      )}
                      {lead.buyer_email && (
                        <a
                          href={`mailto:${lead.buyer_email}`}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
                        >
                          <Mail size={12} />
                          {lead.buyer_email}
                        </a>
                      )}
                      {lead.deal_value && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 rounded-full px-3 py-1.5">
                          💰 {formatPrice(lead.deal_value)}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <p className="text-xs text-text-secondary bg-bg-secondary rounded-lg p-2.5 mb-3">
                        {lead.notes}
                      </p>
                    )}

                    {/* Status flow buttons — apenas transições válidas */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {LEAD_STATUS_FLOW.map((s) => {
                        const isActive = lead.status === s.key;
                        const isAllowed = isActive || validNext.includes(s.key);
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => isAllowed && !isActive && handleLeadStatusChange(lead.id, s.key)}
                            disabled={!isAllowed || isActive}
                            className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              isActive
                                ? 'bg-primary text-white cursor-default'
                                : isAllowed
                                  ? 'bg-bg-secondary text-text-secondary hover:bg-primary-light hover:text-primary cursor-pointer'
                                  : 'bg-bg-secondary text-text-secondary/30 cursor-not-allowed'
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Interaction history */}
                    <LeadInteractionPanel leadId={lead.id} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Sale closure modal */}
      {closingLead && (
        <SaleClosureModal
          leadId={closingLead.id}
          buyerName={closingLead.buyer_name}
          listingTitle={closingLead.listing?.title}
          currentDealValue={closingLead.deal_value}
          onConfirm={({ deal_value }) => {
            setLeads((p) => p.map((l) =>
              l.id === closingLead.id ? { ...l, status: 'sold', deal_value } : l
            ));
            setClosingLead(null);
          }}
          onCancel={() => setClosingLead(null)}
        />
      )}
    </div>
  );
}
