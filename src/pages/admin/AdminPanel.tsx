import { useState, useEffect, useCallback } from 'react';
import {
  Check, X, Star, Trash2, Eye, Edit3, Shield, Users, Car, Loader2,
  Search, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, formatDate } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import {
  fetchAllListings,
  updateListingStatus,
  toggleListingFeatured as toggleFeaturedApi,
  deleteListing,
  updateListing,
} from '../../lib/listings';
import type { Listing, ListingStatus } from '../../types';

type AdminTab = 'listings' | 'dealerships' | 'users';
type StatusFilter = 'all' | 'pending' | 'active' | 'paused' | 'rejected' | 'sold';

interface DBUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface DBDealer {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  approved: boolean;
  owner_id: string;
  created_at: string;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('listings');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Data from Supabase
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [dealers, setDealers] = useState<DBDealer[]>([]);

  // Edit modal
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price_usd: 0, description: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [listingsData, usersRes, dealersRes] = await Promise.all([
      fetchAllListings(),
      supabase?.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase?.from('dealerships').select('*').order('created_at', { ascending: false }),
    ]);
    setListings(listingsData);
    if (usersRes?.data) setUsers(usersRes.data);
    if (dealersRes?.data) setDealers(dealersRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Listing actions ───
  const handleStatusChange = async (id: string, status: ListingStatus) => {
    try {
      await updateListingStatus(id, status);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (e) { console.error(e); }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await toggleFeaturedApi(id, !current);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, featured: !current } : l)));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio permanentemente?')) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) { console.error(e); }
  };

  const openEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm({ title: listing.title, price_usd: listing.price_usd, description: listing.description });
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    setSaving(true);
    try {
      await updateListing(editingListing.id, editForm);
      setListings((prev) =>
        prev.map((l) => (l.id === editingListing.id ? { ...l, ...editForm } : l))
      );
      setEditingListing(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // ─── User actions ───
  const handleRoleChange = async (userId: string, role: string) => {
    await supabase?.from('profiles').update({ role }).eq('id', userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  // ─── Dealer actions ───
  const handleDealerApprove = async (id: string, approved: boolean) => {
    await supabase?.from('dealerships').update({ approved }).eq('id', id);
    setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, approved } : d)));
  };

  const handleDealerVerify = async (id: string, verified: boolean) => {
    await supabase?.from('dealerships').update({ verified }).eq('id', id);
    setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, verified } : d)));
  };

  // ─── Filtered listings ───
  const filteredListings = listings.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.brand.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = {
    all: listings.length,
    pending: listings.filter((l) => l.status === 'pending').length,
    active: listings.filter((l) => l.status === 'active').length,
    paused: listings.filter((l) => l.status === 'paused').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  };

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'listings', label: 'Anuncios', icon: <Car size={16} />, count: listings.length },
    { key: 'dealerships', label: 'Concesionarias', icon: <Shield size={16} />, count: dealers.length },
    { key: 'users', label: 'Usuarios', icon: <Users size={16} />, count: users.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold font-heading text-text-primary mb-6">Panel de Administración</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-primary text-white shadow-card'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.icon} {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-white/20' : 'bg-border'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ LISTINGS TAB ═══ */}
      {tab === 'listings' && (
        <div>
          {/* Status filters + search */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.entries(statusCounts) as [StatusFilter, number][]).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === key
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                {key === 'all' ? 'Todos' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
              </button>
            ))}

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary rounded-2xl">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No hay anuncios{statusFilter !== 'all' ? ` con estado "${statusFilter}"` : ''}</p>
              <p className="text-sm text-text-muted mt-1">Los anuncios publicados aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border hover:shadow-card transition-shadow">
                  {/* Photo */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-bg-secondary flex-shrink-0">
                    {listing.photos?.[0]?.url ? (
                      <img src={listing.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Car size={20} className="text-text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{listing.title}</h3>
                      {listing.featured && (
                        <Star size={14} className="fill-primary text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatPrice(listing.price_usd)} · {listing.brand} {listing.model} · {formatDate(listing.created_at)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    listing.status === 'active' ? 'bg-success-green/10 text-success-green' :
                    listing.status === 'pending' ? 'bg-warning/10 text-warning' :
                    listing.status === 'rejected' ? 'bg-accent-red/10 text-accent-red' :
                    listing.status === 'sold' ? 'bg-accent/10 text-accent' :
                    'bg-bg-secondary text-text-secondary'
                  }`}>
                    {listing.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      to={`/vehiculo/${listing.id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                      title="Ver"
                    >
                      <Eye size={15} />
                    </Link>

                    <button
                      onClick={() => openEdit(listing)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>

                    {listing.status !== 'active' && (
                      <button
                        onClick={() => handleStatusChange(listing.id, 'active')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-success-green hover:bg-success-green/5 transition-colors cursor-pointer"
                        title="Aprobar"
                      >
                        <Check size={15} />
                      </button>
                    )}

                    {listing.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(listing.id, 'paused')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-warning hover:bg-warning/5 transition-colors cursor-pointer"
                        title="Pausar"
                      >
                        <X size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleFeatured(listing.id, listing.featured)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        listing.featured ? 'text-primary bg-primary/5' : 'text-text-muted hover:text-primary hover:bg-primary/5'
                      }`}
                      title={listing.featured ? 'Quitar destaque' : 'Destacar'}
                    >
                      <Star size={15} className={listing.featured ? 'fill-primary' : ''} />
                    </button>

                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/5 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ DEALERSHIPS TAB ═══ */}
      {tab === 'dealerships' && (
        <div>
          {dealers.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary rounded-2xl">
              <Shield className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No hay concesionarias registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dealers.map((d) => (
                <div key={d.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">{d.name}</h3>
                    <p className="text-xs text-text-secondary">{d.city} · {formatDate(d.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDealerApprove(d.id, !d.approved)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        d.approved ? 'bg-success-green/10 text-success-green' : 'bg-bg-secondary text-text-muted hover:bg-warning/10 hover:text-warning'
                      }`}
                    >
                      {d.approved ? 'Aprobada' : 'Aprobar'}
                    </button>
                    <button
                      onClick={() => handleDealerVerify(d.id, !d.verified)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        d.verified ? 'bg-accent/10 text-accent' : 'bg-bg-secondary text-text-muted hover:bg-accent/10 hover:text-accent'
                      }`}
                    >
                      {d.verified ? 'Verificada' : 'Verificar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab === 'users' && (
        <div>
          {users.length === 0 ? (
            <div className="text-center py-16 bg-bg-secondary rounded-2xl">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {u.name?.[0] || u.email?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{u.name || 'Sin nombre'}</h3>
                    <p className="text-xs text-text-secondary">{u.email} · {formatDate(u.created_at)}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="buyer">Comprador</option>
                    <option value="seller">Vendedor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4 font-heading">Editar anuncio</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Título</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Precio (USD)</label>
                <input
                  type="number"
                  value={editForm.price_usd}
                  onChange={(e) => setEditForm({ ...editForm, price_usd: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingListing(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
