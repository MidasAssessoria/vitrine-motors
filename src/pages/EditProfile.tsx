import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Camera, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { uploadDocument, fetchUserDocuments } from '../lib/documents';
import { CITIES } from '../data/constants';
import type { UserDocument } from '../types';

export function EditProfile() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    bio: '',
    city: '',
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const ciFrenteRef = useRef<HTMLInputElement>(null);
  const ciVersoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      bio: user.bio || '',
      city: user.city || '',
    });
    fetchUserDocuments(user.id).then(setDocuments);
  }, [user]);

  const handleSave = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setSaved(false);
    await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      whatsapp: form.whatsapp,
      bio: form.bio,
      city: form.city,
    }).eq('id', user.id);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    await supabase.storage.from('vehicle-photos').upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  };

  const handleDocUpload = async (file: File, type: 'ci_frente' | 'ci_verso') => {
    if (!user) return;
    setUploadingDoc(true);
    await uploadDocument(file, user.id, type);
    const docs = await fetchUserDocuments(user.id);
    setDocuments(docs);
    setUploadingDoc(false);
  };

  const getDocStatus = (type: string) => {
    const doc = documents.find((d) => d.document_type === type);
    return doc?.status || null;
  };

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
  const profileUrl = `/vendedor/${user.id}`;

  return (
    <Container className="py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Mi perfil</h1>
        <Link to={profileUrl} className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver perfil público <ExternalLink size={14} />
        </Link>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl bg-bg-secondary flex items-center justify-center overflow-hidden border border-border cursor-pointer relative group"
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
          <div>
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <button
              onClick={() => avatarRef.current?.click()}
              className="text-xs text-primary hover:underline mt-1 cursor-pointer"
            >
              Cambiar foto de perfil
            </button>
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarUpload(file);
        }} />
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card mb-6">
        <h3 className="text-sm font-bold text-text-primary mb-4">Datos personales</h3>
        <div className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+595 9XX XXX XXX" />
          <Select label="Ciudad" options={cityOptions} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Seleccioná" />
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Sobre mí</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              placeholder="Contá algo sobre vos..."
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {saved && <span className="text-sm text-success-green flex items-center gap-1"><CheckCircle2 size={14} /> Guardado</span>}
        </div>
      </div>

      {/* Documentos de verificación */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-2">Verificación de identidad</h3>
        <p className="text-xs text-text-secondary mb-4">
          Para publicar anuncios necesitás verificar tu identidad subiendo tu cédula de identidad (frente y verso).
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

            <input ref={ciFrenteRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocUpload(file, 'ci_frente');
            }} />
            <input ref={ciVersoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDocUpload(file, 'ci_verso');
            }} />
          </div>
        )}
      </div>
    </Container>
  );
}
