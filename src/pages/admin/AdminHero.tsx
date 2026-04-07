import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Loader2,
  Image, Monitor, Tablet, Smartphone, Pencil, Check, X,
  Sun, Moon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  fetchAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  uploadHeroBanner,
} from '../../lib/heroSlides';
import type { HeroSlide } from '../../types';

const MAX_SLIDES = 3;

const VARIANT_CONFIG = [
  { key: 'desktop' as const, label: 'Desktop', icon: Monitor, size: '1920 × 800 px' },
  { key: 'tablet'  as const, label: 'Tablet',  icon: Tablet,  size: '1024 × 600 px' },
  { key: 'mobile'  as const, label: 'Mobile',  icon: Smartphone, size: '640 × 900 px' },
];

type TextEdit = {
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  text_theme: 'dark' | 'light';
};

export function AdminHero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit-in-place: one slide being edited at a time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TextEdit>({
    title: '', subtitle: '', cta_label: '', cta_url: '', text_theme: 'dark',
  });
  const [editSaving, setEditSaving] = useState(false);

  // New slide form
  const [newTitle, setNewTitle]       = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCtaLabel, setNewCtaLabel] = useState('Ver ofertas');
  const [newCtaUrl, setNewCtaUrl]     = useState('/autos');
  const [newTextTheme, setNewTextTheme] = useState<'dark' | 'light'>('dark');
  const [files, setFiles]             = useState<{ desktop?: File; tablet?: File; mobile?: File }>({});
  const [previews, setPreviews]       = useState<{ desktop?: string; tablet?: string; mobile?: string }>({});
  const fileRefs = {
    desktop: useRef<HTMLInputElement>(null),
    tablet:  useRef<HTMLInputElement>(null),
    mobile:  useRef<HTMLInputElement>(null),
  };

  const loadSlides = async () => {
    setLoading(true);
    const data = await fetchAllHeroSlides();
    setSlides(data);
    setLoading(false);
  };

  useEffect(() => { loadSlides(); }, []);

  // ── File handling ──

  const handleFileChange = (variant: 'desktop' | 'tablet' | 'mobile', file: File) => {
    setFiles((prev) => ({ ...prev, [variant]: file }));
    setPreviews((prev) => ({ ...prev, [variant]: URL.createObjectURL(file) }));
  };

  const resetForm = () => {
    setNewTitle(''); setNewSubtitle('');
    setNewCtaLabel('Ver ofertas'); setNewCtaUrl('/autos');
    setNewTextTheme('dark');
    setFiles({}); setPreviews({});
    setShowNew(false);
  };

  // ── Create ──

  const handleCreate = async () => {
    if (!files.desktop || !files.tablet || !files.mobile) {
      alert('Debés subir las 3 imágenes (desktop, tablet y mobile)');
      return;
    }
    setSaving(true);
    try {
      const slide = await createHeroSlide({
        title: newTitle || 'Banner',
        desktop_url: '', tablet_url: '', mobile_url: '',
        order_index: slides.length,
      });

      const [desktopUrl, tabletUrl, mobileUrl] = await Promise.all([
        uploadHeroBanner(files.desktop, slide.id, 'desktop'),
        uploadHeroBanner(files.tablet,  slide.id, 'tablet'),
        uploadHeroBanner(files.mobile,  slide.id, 'mobile'),
      ]);

      await updateHeroSlide(slide.id, {
        desktop_url: desktopUrl,
        tablet_url:  tabletUrl,
        mobile_url:  mobileUrl,
        subtitle:    newSubtitle,
        cta_label:   newCtaLabel,
        cta_url:     newCtaUrl,
        text_theme:  newTextTheme,
      });

      resetForm();
      await loadSlides();
    } catch (err) {
      console.error('Error creating slide:', err);
      alert('Error al crear el banner');
    } finally {
      setSaving(false);
    }
  };

  // ── Inline text edit ──

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setEditForm({
      title:      slide.title,
      subtitle:   slide.subtitle   ?? '',
      cta_label:  slide.cta_label  ?? 'Ver ofertas',
      cta_url:    slide.cta_url    ?? '/autos',
      text_theme: slide.text_theme ?? 'dark',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      await updateHeroSlide(id, {
        title:      editForm.title,
        subtitle:   editForm.subtitle,
        cta_label:  editForm.cta_label,
        cta_url:    editForm.cta_url,
        text_theme: editForm.text_theme,
      });
      setSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...editForm } : s))
      );
      setEditingId(null);
    } catch (err) {
      console.error('Error saving slide text:', err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Toggle / Delete / Reorder ──

  const handleToggleActive = async (id: string, current: boolean) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, active: !current } : s)));
    await updateHeroSlide(id, { active: !current });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner? Se borrarán también las imágenes.')) return;
    await deleteHeroSlide(id);
    await loadSlides();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;
    const a = slides[idx], b = slides[swapIdx];
    await Promise.all([
      updateHeroSlide(a.id, { order_index: b.order_index }),
      updateHeroSlide(b.id, { order_index: a.order_index }),
    ]);
    await loadSlides();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Banners del Hero</h1>
          <p className="text-sm text-text-secondary mt-1">{slides.length} de {MAX_SLIDES} banners</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)} disabled={slides.length >= MAX_SLIDES}>
          <Plus size={16} className="mr-1" /> Nuevo banner
        </Button>
      </div>

      {/* ── FORM NUEVO BANNER ── */}
      {showNew && (
        <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-card">
          <h3 className="text-lg font-heading font-bold text-text-primary mb-5">Nuevo banner</h3>

          {/* Imágenes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {VARIANT_CONFIG.map(({ key, label, icon: Icon, size }) => (
              <div key={key}>
                <label className="text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1.5">
                  <Icon size={14} /> {label}
                  <span className="text-text-secondary font-normal">({size})</span>
                </label>
                <input
                  ref={fileRefs[key]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(key, f); }}
                />
                {previews[key] ? (
                  <div
                    className="relative rounded-xl overflow-hidden border border-border cursor-pointer group"
                    onClick={() => fileRefs[key].current?.click()}
                  >
                    <img
                      src={previews[key]}
                      alt={`Preview ${label}`}
                      className={`w-full object-cover ${key === 'mobile' ? 'h-48' : 'h-32'}`}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Cambiar</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRefs[key].current?.click()}
                    className={`border-2 border-dashed border-primary/30 rounded-xl bg-primary-light/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light transition-all ${key === 'mobile' ? 'h-48' : 'h-32'}`}
                  >
                    <Image size={24} className="text-primary mb-1" />
                    <span className="text-xs text-text-secondary">{size}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Texto del slide */}
          <div className="border-t border-border pt-5 space-y-4">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Pencil size={14} /> Texto superpuesto (HTML — nítido en cualquier resolución)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Título (H1)"
                placeholder="Ej: Tu Próximo SUV está Aquí"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Input
                label="Subtítulo"
                placeholder="Ej: Financiación exclusiva en cuotas fijas"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
              />
              <Input
                label="Texto del botón CTA"
                placeholder="Ej: Explorar Modelos"
                value={newCtaLabel}
                onChange={(e) => setNewCtaLabel(e.target.value)}
              />
              <Input
                label="URL del botón"
                placeholder="Ej: /autos"
                value={newCtaUrl}
                onChange={(e) => setNewCtaUrl(e.target.value)}
              />
            </div>

            {/* Theme toggle */}
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">Color del texto</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewTextTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    newTextTheme === 'dark'
                      ? 'bg-text-primary text-white border-text-primary'
                      : 'bg-white text-text-secondary border-border hover:border-text-primary'
                  }`}
                >
                  <Moon size={14} /> Oscuro
                  <span className="text-xs opacity-60">para fondos claros</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewTextTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    newTextTheme === 'light'
                      ? 'bg-white text-text-primary border-text-primary shadow-sm'
                      : 'bg-white text-text-secondary border-border hover:border-text-primary'
                  }`}
                >
                  <Sun size={14} /> Claro
                  <span className="text-xs opacity-60">para fondos oscuros</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin mr-1" />Guardando...</> : 'Guardar banner'}
            </Button>
          </div>
        </div>
      )}

      {/* ── LISTA DE SLIDES ── */}
      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-card">
          <Image className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Sin banners</h3>
          <p className="text-sm text-text-secondary">Agregá tu primer banner para el hero de la página principal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">

              {/* Preview + info row */}
              <div className="flex items-start gap-4 p-5">
                {/* Desktop thumbnail */}
                <div className="w-56 shrink-0 rounded-xl overflow-hidden border border-border">
                  <img src={slide.desktop_url} alt={slide.title} className="w-full h-28 object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-heading font-bold text-text-primary truncate">
                      {slide.title || `Banner ${idx + 1}`}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      slide.active ? 'bg-success-green/10 text-success-green' : 'bg-gray-100 text-text-secondary'
                    }`}>
                      {slide.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      (slide.text_theme ?? 'dark') === 'dark'
                        ? 'bg-text-primary/10 text-text-primary'
                        : 'bg-gray-200 text-text-secondary'
                    }`}>
                      Texto {(slide.text_theme ?? 'dark') === 'dark' ? 'oscuro' : 'claro'}
                    </span>
                  </div>

                  {/* Subtítulo preview */}
                  {slide.subtitle && (
                    <p className="text-xs text-text-secondary mb-2 truncate">{slide.subtitle}</p>
                  )}

                  {/* Tablet + Mobile thumbnails */}
                  <div className="flex gap-2 mb-3">
                    <div className="w-20 h-12 rounded-lg overflow-hidden border border-border">
                      <img src={slide.tablet_url} alt="Tablet" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-10 h-12 rounded-lg overflow-hidden border border-border">
                      <img src={slide.mobile_url} alt="Mobile" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleActive(slide.id, slide.active)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                        slide.active
                          ? 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                          : 'bg-success-green/10 text-success-green hover:bg-success-green/20'
                      }`}
                    >
                      {slide.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => startEdit(slide)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Pencil size={11} /> Editar texto
                    </button>
                    <button
                      onClick={() => handleReorder(slide.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-full hover:bg-bg-secondary text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      onClick={() => handleReorder(slide.id, 'down')}
                      disabled={idx === slides.length - 1}
                      className="p-1.5 rounded-full hover:bg-bg-secondary text-text-secondary disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="p-1.5 rounded-full hover:bg-accent-red/10 text-text-secondary hover:text-accent-red transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Painel de edição de texto inline ── */}
              {editingId === slide.id && (
                <div className="border-t border-border bg-bg-secondary px-5 py-4 space-y-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Texto del banner — se renderiza en HTML, sin pérdida de calidad
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-text-primary block mb-1">Título (H1)</label>
                      <input
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Tu Próximo SUV está Aquí"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-primary block mb-1">Subtítulo</label>
                      <input
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        value={editForm.subtitle}
                        onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))}
                        placeholder="Financiación exclusiva en cuotas fijas"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-primary block mb-1">Texto del botón</label>
                      <input
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        value={editForm.cta_label}
                        onChange={(e) => setEditForm((f) => ({ ...f, cta_label: e.target.value }))}
                        placeholder="Explorar Modelos"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-primary block mb-1">URL del botón</label>
                      <input
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                        value={editForm.cta_url}
                        onChange={(e) => setEditForm((f) => ({ ...f, cta_url: e.target.value }))}
                        placeholder="/autos"
                      />
                    </div>
                  </div>

                  {/* Theme toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-primary">Color del texto:</span>
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, text_theme: 'dark' }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        editForm.text_theme === 'dark'
                          ? 'bg-text-primary text-white border-text-primary'
                          : 'bg-white text-text-secondary border-border'
                      }`}
                    >
                      <Moon size={12} /> Oscuro
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, text_theme: 'light' }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        editForm.text_theme === 'light'
                          ? 'bg-white text-text-primary border-text-primary shadow-sm'
                          : 'bg-white text-text-secondary border-border'
                      }`}
                    >
                      <Sun size={12} /> Claro
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(slide.id)}
                      disabled={editSaving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-text-secondary border border-border rounded-full text-sm font-medium hover:bg-bg-secondary transition-colors cursor-pointer"
                    >
                      <X size={13} /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
