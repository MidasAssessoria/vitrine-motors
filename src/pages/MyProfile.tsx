import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/admin/StatusBadge';
import {
  Camera, CheckCircle2, Clock, XCircle, ExternalLink,
  Car, Eye, ChevronRight, Loader2, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { uploadDocument, fetchUserDocuments } from '../lib/documents';
import { CITIES } from '../data/constants';
import { formatPrice } from '../utils/formatters';
import type { UserDocument, Listing } from '../types';

const PY_DEPARTMENTS = [
  'Asunción', 'Alto Paraguay', 'Alto Paraná', 'Amambay', 'Boquerón',
  'Caaguazú', 'Caazapá', 'Canindeyú', 'Central', 'Concepción',
  'Cordillera', 'Guairá', 'Itapúa', 'Misiones', 'Ñeembucú',
  'Paraguarí', 'Presidente Hayes', 'San Pedro',
];

export function MyProfile() {
  const user = useAuthStore((s) => s.user);

  // Personal data
  const [personalForm, setPersonalForm] = useState({
    name: '', phone: '', whatsapp: '', bio: '', city: '',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savedPersonal, setSavedPersonal] = useState(false);

  // Identity data
  const [identityForm, setIdentityForm] = useState({
    birth_date: '', nationality: '', state: '', postal_code: '',
  });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savedIdentity, setSavedIdentity] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Listings
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const avatarRef = useRef<HTMLInputElement>(null);
  const ciFrenteRef = useRef<HTMLInputElement>(null);
  const ciVersoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setPersonalForm({
      name: user.name || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      bio: user.bio || '',
      city: user.city || '',
    });
    setIdentityForm({
      birth_date: user.birth_date || '',
      nationality: user.nationality || '',
      state: user.state || '',
      postal_code: user.postal_code || '',
    });
    fetchUserDocuments(user.id).then(setDocuments);

    // Fetch listings
    if (supabase) {
      supabase
        .from('listings')
        .select('id, title, price_usd, status, views_count, photos')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)
        .then(({ data }) => {
          setListings((data as Listing[]) || []);
          setLoadingListings(false);
        });
    } else {
      setLoadingListings(false);
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    await supabase.storage.from('vehicle-photos').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    useAuthStore.setState((s) => ({ user: s.user ? { ...s.user, avatar_url: publicUrl } : null }));
  };

  const handleSavePersonal = async () => {
    if (!user || !supabase) return;
    setSavingPersonal(true);
    await supabase.from('profiles').update({
      name: personalForm.name,
      phone: personalForm.phone,
      whatsapp: personalForm.whatsapp,
      bio: personalForm.bio,
      city: personalForm.city,
    }).eq('id', user.id);
    setSavingPersonal(false);
    setSavedPersonal(true);
    setTimeout(() => setSavedPersonal(false), 3000);
  };

  const handleSaveIdentity = async () => {
    if (!user || !supabase) return;
    setSavingIdentity(true);
    await supabase.from('profiles').update({
      birth_date: identityForm.birth_date || null,
      nationality: identityForm.nationality,
      state: identityForm.state,
      postal_code: identityForm.postal_code,
    }).eq('id', user.id);
    setSavingIdentity(false);
    setSavedIdentity(true);
    setTimeout(() => setSavedIdentity(false), 3000);
  };

  const handleDocUpload = async (file: File, type: 'ci_frente' | 'ci_verso') => {
    if (!user) return;
    setUploadingDoc(true);
    await uploadDocument(file, user.id, type);
    const docs = await fetchUserDocuments(user.id);
    setDocuments(docs);
    setUploadingDoc(false);
  };

  const getDocStatus = (type: string) => documents.find((d) => d.document_type === type)?.status || null;

  const statusIcon = (status: string | null) => {
    if (status === 'approved') return <CheckCircle2 size={14} className="text-success-green" />;
    if (status === 'pending') return <Clock size={14} className="text-amber-500" />;
    if (status === 'rejected') return <XCircle size={14} className="text-accent-red" />;
    return null;
  };

  const statusLabel = (status: string | null) => {
    if (status === 'approved') return 'Aprobado';
    if (status === 'pending') return 'Pendiente de revisión';
    if (status === 'rejected') return 'Rechazado — subí nuevamente';
    return 'No enviado';
  };

  if (!user) return null;

  const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
  const deptOptions = PY_DEPARTMENTS.map((d) => ({ value: d, label: d }));

  return (
    <Container className="py-8 max-w-2xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
      <motion.h1
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="text-2xl font-heading font-bold text-text-primary mb-6"
      >Mi perfil</motion.h1>

      {/* ── Card 1: Header ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="bg-white rounded-2xl border border-border p-6 shadow-card mb-5"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl bg-bg-secondary flex items-center justify-center overflow-hidden border border-border cursor-pointer relative group shrink-0"
            onClick={() => avatarRef.current?.click()}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-border" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-text-primary truncate">{user.name}</p>
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {user.role === 'seller' ? 'Vendedor' : user.role === 'admin' ? 'Admin' : 'Comprador'}
              </span>
              {user.document_verified ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-success-green bg-success-green/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  <ShieldAlert size={11} /> Sin verificar
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/vendedor/${user.id}`}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            Ver público <ExternalLink size={12} />
          </Link>
        </div>
        <button
          onClick={() => avatarRef.current?.click()}
          className="text-xs text-primary hover:underline mt-3 cursor-pointer block"
        >
          Cambiar foto de perfil
        </button>
      </motion.div>

      {/* ── Card 2: Datos personales ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="bg-white rounded-2xl border border-border p-6 shadow-card mb-5"
      >
        <h3 className="text-sm font-bold text-text-primary mb-4">Datos personales</h3>
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            value={personalForm.name}
            onChange={(e) => setPersonalForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Teléfono"
            value={personalForm.phone}
            onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+595 21 XXX XXX"
          />
          <Input
            label="WhatsApp"
            value={personalForm.whatsapp}
            onChange={(e) => setPersonalForm((p) => ({ ...p, whatsapp: e.target.value }))}
            placeholder="+595 9XX XXX XXX"
          />
          <Select
            label="Ciudad"
            options={cityOptions}
            value={personalForm.city}
            onChange={(e) => setPersonalForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="Seleccioná"
          />
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Sobre mí</label>
            <textarea
              value={personalForm.bio}
              onChange={(e) => setPersonalForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              placeholder="Contá algo sobre vos..."
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <Button onClick={handleSavePersonal} disabled={savingPersonal}>
            {savingPersonal ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {savedPersonal && (
            <span className="text-sm text-success-green flex items-center gap-1">
              <CheckCircle2 size={14} /> Guardado
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Card 3: Datos de identidad ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="bg-white rounded-2xl border border-border p-6 shadow-card mb-5"
      >
        <h3 className="text-sm font-bold text-text-primary mb-1">Datos de identidad</h3>
        <p className="text-xs text-text-secondary mb-4">
          Información personal requerida para la verificación de identidad.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Fecha de nacimiento</label>
            <input
              type="date"
              value={identityForm.birth_date}
              onChange={(e) => setIdentityForm((p) => ({ ...p, birth_date: e.target.value }))}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>
          <Input
            label="Nacionalidad"
            value={identityForm.nationality}
            onChange={(e) => setIdentityForm((p) => ({ ...p, nationality: e.target.value }))}
            placeholder="Paraguayo/a"
          />
          <Select
            label="Departamento"
            options={deptOptions}
            value={identityForm.state}
            onChange={(e) => setIdentityForm((p) => ({ ...p, state: e.target.value }))}
            placeholder="Seleccioná"
          />
          <Input
            label="Código postal"
            value={identityForm.postal_code}
            onChange={(e) => setIdentityForm((p) => ({ ...p, postal_code: e.target.value }))}
            placeholder="Ej: 001001"
          />
        </div>
        <div className="flex items-center gap-3 mt-5">
          <Button onClick={handleSaveIdentity} disabled={savingIdentity}>
            {savingIdentity ? 'Guardando...' : 'Guardar datos'}
          </Button>
          {savedIdentity && (
            <span className="text-sm text-success-green flex items-center gap-1">
              <CheckCircle2 size={14} /> Guardado
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Card 4: Verificación de identidad ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="bg-white rounded-2xl border border-border p-6 shadow-card mb-5"
      >
        <h3 className="text-sm font-bold text-text-primary mb-2">Verificación de identidad</h3>
        <p className="text-xs text-text-secondary mb-4">
          Subí tu cédula de identidad (frente y dorso) para verificar tu cuenta.
          Solo el equipo de VitrineMOTORS puede ver estos documentos.
        </p>

        {user.document_verified ? (
          <div className="flex items-center gap-2 bg-success-green/10 text-success-green rounded-xl p-3 text-sm font-medium">
            <CheckCircle2 size={16} /> Identidad verificada
          </div>
        ) : (
          <div className="space-y-3">
            {/* CI Frente */}
            <div className="flex items-center justify-between bg-bg-secondary rounded-xl p-3">
              <div className="flex items-center gap-2">
                {statusIcon(getDocStatus('ci_frente'))}
                <span className="text-sm font-medium">CI Frente</span>
                <span className="text-xs text-text-secondary">{statusLabel(getDocStatus('ci_frente'))}</span>
              </div>
              {(!getDocStatus('ci_frente') || getDocStatus('ci_frente') === 'rejected') && (
                <button
                  onClick={() => ciFrenteRef.current?.click()}
                  className="text-xs text-primary font-medium hover:underline cursor-pointer"
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? 'Subiendo...' : 'Subir'}
                </button>
              )}
            </div>

            {/* CI Verso */}
            <div className="flex items-center justify-between bg-bg-secondary rounded-xl p-3">
              <div className="flex items-center gap-2">
                {statusIcon(getDocStatus('ci_verso'))}
                <span className="text-sm font-medium">CI Dorso</span>
                <span className="text-xs text-text-secondary">{statusLabel(getDocStatus('ci_verso'))}</span>
              </div>
              {(!getDocStatus('ci_verso') || getDocStatus('ci_verso') === 'rejected') && (
                <button
                  onClick={() => ciVersoRef.current?.click()}
                  className="text-xs text-primary font-medium hover:underline cursor-pointer"
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? 'Subiendo...' : 'Subir'}
                </button>
              )}
            </div>

            <input
              ref={ciFrenteRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, 'ci_frente'); }}
            />
            <input
              ref={ciVersoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f, 'ci_verso'); }}
            />
          </div>
        )}
      </motion.div>

      {/* ── Card 5: Mis publicaciones ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
        className="bg-white rounded-2xl border border-border p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-primary">Mis publicaciones</h3>
          <Link
            to="/panel"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={12} />
          </Link>
        </div>

        {loadingListings ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">Aún no publicaste ningún vehículo</p>
            <Link to="/publicar">
              <Button>Publicar vehículo</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/vehiculo/${listing.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-secondary transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg-secondary shrink-0">
                  {listing.photos?.[0]?.url ? (
                    <img
                      src={listing.photos[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-border" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{listing.title}</p>
                  <p className="text-xs font-bold text-primary">{formatPrice(listing.price_usd)}</p>
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={listing.status} />
                  <span className="flex items-center gap-0.5 text-[11px] text-text-secondary">
                    <Eye size={10} /> {listing.views_count ?? 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
      </motion.div>
    </Container>
  );
}
