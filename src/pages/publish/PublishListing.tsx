import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Check, ChevronRight, ChevronLeft, Car, Bike, Ship, ImagePlus,
  DollarSign, Phone, Loader2, Settings2, Shield, FileText, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  CITIES, CATEGORIES_BY_TYPE, FUELS_BY_TYPE, TRANSMISSIONS, CONDITIONS,
  COLORS, INTERIOR_COLORS, EQUIPMENT_BY_TYPE, VEHICLE_TYPE_LABELS,
  MOTO_STARTERS, MOTO_COOLING, BARCO_HULL_MATERIALS,
} from '../../data/constants';
import { useAuthStore } from '../../stores/authStore';
import { createListing, uploadListingPhoto, fetchListingById, updateListing, deleteListingPhoto } from '../../lib/listings';
import { supabase } from '../../lib/supabase';
import { fetchBrands, fetchModelsByBrand, fetchTrimsByModel } from '../../lib/catalog';
import type { Brand, Model, Trim, VehicleType, ListingPhoto } from '../../types';

const STEPS = [
  { num: 1, label: 'Vehículo', icon: Car },
  { num: 2, label: 'Fotos', icon: ImagePlus },
  { num: 3, label: 'Detalles', icon: Settings2 },
  { num: 4, label: 'Contacto', icon: Phone },
];

export function PublishListing() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const user = useAuthStore((s) => s.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noPhotoWarning, setNoPhotoWarning] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [kycData, setKycData] = useState({ birth_date: '', nationality: '', state: '', postal_code: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Vehicle type
  const [vehicleType, setVehicleType] = useState<VehicleType>('auto');
  const currentEquipment = EQUIPMENT_BY_TYPE[vehicleType];

  // Catalog cascade state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [trims, setTrims] = useState<Trim[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Equipment checklist
  const [equipment, setEquipment] = useState<Record<string, boolean>>(
    Object.fromEntries(currentEquipment.map((e) => [e.key, false]))
  );

  const [form, setForm] = useState({
    condition: '',
    brandId: '',
    brandName: '',
    isCustomBrand: false,
    customBrand: '',
    modelId: '',
    modelName: '',
    trimId: '',
    year: '',
    version: '',
    category: '',
    fuel: '',
    transmission: '',
    mileage: '',
    colorExt: '',
    colorInt: '',
    plateMasked: '',
    doors: '',
    price: '',
    description: '',
    city: '',
    whatsapp: '',
    altPhone: '',
    // Moto-specific
    engineCc: '',
    brakeType: '',
    starter: '',
    cooling: '',
    // Barco-specific
    lengthFt: '',
    engineHp: '',
    hoursUsed: '',
    hullMaterial: '',
    passengerCapacity: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Load existing listing for edit mode ───
  useEffect(() => {
    if (!editId || !user) return;
    setEditLoading(true);
    fetchListingById(editId).then((listing) => {
      if (!listing) { navigate('/panel'); return; }
      // Verify ownership or admin
      if (listing.seller_id !== user.id && user.role !== 'admin') {
        navigate('/panel');
        return;
      }
      // Populate vehicle type
      setVehicleType((listing.vehicle_type || 'auto') as VehicleType);
      // Populate form fields
      setForm({
        condition: listing.condition || '',
        brandId: '',
        brandName: listing.brand || '',
        isCustomBrand: listing.is_custom_brand || false,
        customBrand: listing.custom_brand || '',
        modelId: '',
        modelName: listing.model || '',
        trimId: listing.trim_id || '',
        year: String(listing.year || ''),
        version: listing.version || '',
        category: listing.category || '',
        fuel: listing.fuel || '',
        transmission: listing.transmission || '',
        mileage: String(listing.mileage || ''),
        colorExt: listing.color_ext || listing.color || '',
        colorInt: listing.color_int || '',
        plateMasked: listing.plate_masked || '',
        doors: String(listing.doors || ''),
        price: String(listing.price_usd || ''),
        description: listing.description || '',
        city: listing.city || '',
        whatsapp: listing.whatsapp_contact || '',
        altPhone: '',
        engineCc: String(listing.engine_cc || ''),
        brakeType: listing.brake_type || '',
        starter: listing.starter || '',
        cooling: listing.cooling || '',
        lengthFt: String(listing.length_ft || ''),
        engineHp: String(listing.engine_hp || ''),
        hoursUsed: String(listing.hours_used || ''),
        hullMaterial: listing.hull_material || '',
        passengerCapacity: String(listing.passenger_capacity || ''),
      });
      // Populate existing photos
      if (listing.photos?.length) {
        setExistingPhotos(listing.photos.sort((a, b) => a.order_index - b.order_index));
      }
      // Populate equipment
      if (listing.equipment && typeof listing.equipment === 'object') {
        setEquipment(listing.equipment as Record<string, boolean>);
      }
      // Pre-accept terms in edit mode
      setAcceptTerms(true);
      setEditLoading(false);
    }).catch(() => {
      navigate('/panel');
    });
  }, [editId, user]);

  // ─── Fetch brands filtered by vehicle type ───
  // Pre-fill KYC data from user profile
  useEffect(() => {
    if (!user) return;
    setKycData({
      birth_date: user.birth_date || '',
      nationality: user.nationality || '',
      state: user.state || '',
      postal_code: user.postal_code || '',
    });
  }, [user]);

  useEffect(() => {
    fetchBrands(vehicleType).then(setBrands);
    // Reset brand selection when type changes
    setForm((prev) => ({ ...prev, brandId: '', brandName: '', isCustomBrand: false, customBrand: '', modelId: '', modelName: '', trimId: '', category: '' }));
    setModels([]);
    setTrims([]);
    // Reset equipment for new type
    const newEquip = EQUIPMENT_BY_TYPE[vehicleType];
    setEquipment(Object.fromEntries(newEquip.map((e) => [e.key, false])));
  }, [vehicleType]);

  // ─── Fetch models when brand changes ───
  useEffect(() => {
    if (!form.brandId) { setModels([]); setTrims([]); return; }
    setLoadingCatalog(true);
    fetchModelsByBrand(form.brandId).then((m) => {
      setModels(m);
      setTrims([]);
      updateField('modelId', '');
      updateField('modelName', '');
      updateField('trimId', '');
      updateField('category', '');
      setLoadingCatalog(false);
    });
  }, [form.brandId]);

  // ─── Fetch trims when model changes ───
  useEffect(() => {
    if (!form.modelId) { setTrims([]); return; }
    setLoadingCatalog(true);
    fetchTrimsByModel(form.modelId).then((t) => {
      setTrims(t);
      updateField('trimId', '');
      setLoadingCatalog(false);
    });
    // Auto-fill category from model
    const selectedModel = models.find((m) => m.id === form.modelId);
    if (selectedModel?.category) {
      updateField('category', selectedModel.category);
    }
  }, [form.modelId]);

  // ─── Auto-fill from trim ───
  const handleTrimChange = (trimId: string) => {
    updateField('trimId', trimId);
    const trim = trims.find((t) => t.id === trimId);
    if (trim) {
      if (trim.fuel) updateField('fuel', trim.fuel);
      if (trim.transmission) updateField('transmission', trim.transmission);
      if (trim.doors) updateField('doors', String(trim.doors));
      updateField('version', trim.name);
    }
  };

  const handleBrandChange = (brandId: string) => {
    if (brandId === '__custom__') {
      setForm((prev) => ({ ...prev, brandId: '', brandName: '', isCustomBrand: true, customBrand: '' }));
      setModels([]);
      setTrims([]);
    } else {
      updateField('brandId', brandId);
      const brand = brands.find((b) => b.id === brandId);
      updateField('brandName', brand?.name || '');
      setForm((prev) => ({ ...prev, isCustomBrand: false, customBrand: '' }));
    }
  };

  const handleModelChange = (modelId: string) => {
    updateField('modelId', modelId);
    const model = models.find((m) => m.id === modelId);
    updateField('modelName', model?.name || '');
  };

  const toggleEquipment = (key: string) => {
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Step validations ───
  const validateStep1 = (): boolean => {
    const brandDisplay = form.isCustomBrand ? form.customBrand : form.brandName;
    if (!form.condition) { setError('Seleccioná la condición del vehículo'); return false; }
    if (!brandDisplay) { setError(form.isCustomBrand ? 'Ingresá el nombre de la marca' : 'Seleccioná una marca'); return false; }
    if (!form.modelName && !form.isCustomBrand && !form.modelId) { setError('Seleccioná un modelo'); return false; }
    if (!form.year) { setError('Ingresá el año del vehículo'); return false; }
    if (!form.category) { setError('Seleccioná una categoría'); return false; }
    if (!form.fuel) { setError('Seleccioná el combustible'); return false; }
    setError(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!form.price || parseFloat(form.price) <= 0) { setError('Ingresá un precio válido'); return false; }
    if (!form.city) { setError('Seleccioná tu ciudad'); return false; }
    setError(null);
    return true;
  };

  const goToStep = (step: number) => {
    setError(null);
    if (step === 2 && !validateStep1()) return;
    const totalPhotos = photoFiles.length + existingPhotos.filter((p) => !photosToDelete.includes(p.id)).length;
    if (step === 3 && totalPhotos === 0 && !noPhotoWarning) {
      setNoPhotoWarning(true);
      return;
    }
    setNoPhotoWarning(false);
    if (step === 4 && !validateStep3()) return;
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Photos ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photoFiles.length + files.length > 10) {
      setError('Máximo 10 fotos permitidas');
      return;
    }
    const newFiles = [...photoFiles, ...files];
    setPhotoFiles(newFiles);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!form.whatsapp.trim()) { setError('El número de WhatsApp es obligatorio para que los compradores puedan contactarte'); return; }
    if (!isEditMode) {
      if (!user?.document_verified && !kycData.birth_date) { setError('La fecha de nacimiento es obligatoria para verificar tu identidad'); return; }
      if (!user?.document_verified && !kycData.nationality.trim()) { setError('La nacionalidad es obligatoria para verificar tu identidad'); return; }
      if (!user?.document_verified && !docFile) { setError('Debés subir tu documento de identidad para publicar tu primer anuncio'); return; }
      if (!acceptTerms) { setError('Debés aceptar las condiciones de publicación'); return; }
    }
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      const brandDisplay = form.isCustomBrand ? form.customBrand : form.brandName;
      const listingData = {
        vehicle_type: vehicleType,
        title: `${brandDisplay} ${form.modelName} ${form.version}`.trim(),
        brand: brandDisplay,
        model: form.modelName,
        year: parseInt(form.year) || new Date().getFullYear(),
        version: form.version,
        condition: form.condition,
        category: form.category,
        fuel: form.fuel,
        transmission: vehicleType === 'moto' || vehicleType === 'barco' ? undefined : form.transmission,
        mileage: parseInt(form.mileage) || 0,
        price_usd: parseFloat(form.price) || 0,
        color: form.colorExt,
        doors: vehicleType === 'auto' ? (parseInt(form.doors) || 4) : undefined,
        description: form.description,
        city: form.city,
        department: 'Central',
        whatsapp_contact: form.whatsapp,
        trim_id: form.trimId || null,
        color_ext: form.colorExt,
        color_int: form.colorInt,
        plate_masked: form.plateMasked,
        equipment: Object.fromEntries(currentEquipment.map((e) => [e.key, !!equipment[e.key]])),
        custom_brand: form.isCustomBrand ? form.customBrand : undefined,
        is_custom_brand: form.isCustomBrand || undefined,
        engine_cc: vehicleType === 'moto' && form.engineCc ? parseInt(form.engineCc) : undefined,
        brake_type: vehicleType === 'moto' ? form.brakeType || undefined : undefined,
        starter: vehicleType === 'moto' ? form.starter || undefined : undefined,
        cooling: vehicleType === 'moto' ? form.cooling || undefined : undefined,
        length_ft: vehicleType === 'barco' && form.lengthFt ? parseFloat(form.lengthFt) : undefined,
        engine_hp: vehicleType === 'barco' && form.engineHp ? parseInt(form.engineHp) : undefined,
        hours_used: vehicleType === 'barco' && form.hoursUsed ? parseInt(form.hoursUsed) : undefined,
        hull_material: vehicleType === 'barco' ? form.hullMaterial || undefined : undefined,
        passenger_capacity: vehicleType === 'barco' && form.passengerCapacity ? parseInt(form.passengerCapacity) : undefined,
      };

      if (isEditMode && editId) {
        // ─── Edit mode: update existing listing ───
        const isAdmin = user.role === 'admin';
        const isVerified = user.document_verified;
        // Non-admin, non-verified users trigger re-approval
        const updates: Record<string, unknown> = { ...listingData };
        if (!isAdmin && !isVerified) {
          updates.status = 'pending';
        }
        await updateListing(editId, updates);

        // Delete removed photos
        for (const photoId of photosToDelete) {
          const photo = existingPhotos.find((p) => p.id === photoId);
          if (photo) {
            try { await deleteListingPhoto(photo.id, photo.url); } catch { /* continue */ }
          }
        }

        // Upload new photos
        const remainingExisting = existingPhotos.filter((p) => !photosToDelete.includes(p.id));
        const startIndex = remainingExisting.length;
        for (let i = 0; i < photoFiles.length; i++) {
          await uploadListingPhoto(photoFiles[i], user.id, editId, startIndex + i);
        }
      } else {
        // ─── Create mode: new listing ───
        const listing = await createListing(listingData, user.id, user.document_verified);

        for (let i = 0; i < photoFiles.length; i++) {
          await uploadListingPhoto(photoFiles[i], user.id, listing.id, i);
        }

        // Upload identity document (best-effort)
        if (docFile && supabase) {
          try {
            const ext = docFile.name.split('.').pop();
            await supabase.storage
              .from('documents')
              .upload(`identity/${user.id}/doc.${ext}`, docFile, { upsert: true });
          } catch {
            // Silent fail
          }
        }

        // Save KYC personal data to profile (best-effort)
        if (!user.document_verified && supabase) {
          try {
            await supabase.from('profiles').update({
              birth_date: kycData.birth_date || null,
              nationality: kycData.nationality,
              state: kycData.state,
              postal_code: kycData.postal_code,
            }).eq('id', user.id);
          } catch {
            // Silent fail
          }
        }
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : isEditMode ? 'Error al guardar cambios' : 'Error al publicar';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const brandOptions = [
    ...brands.map((b) => ({ value: b.id, label: b.name })),
    { value: '__custom__', label: '— Otra marca —' },
  ];
  const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));
  const trimOptions = trims.map((t) => ({ value: t.id, label: `${t.name}${t.horsepower ? ` (${t.horsepower}hp)` : ''}` }));
  const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
  const currentCategories = CATEGORIES_BY_TYPE[vehicleType] || CATEGORIES_BY_TYPE.auto;
  const categoryOptions = currentCategories.filter((c) => c.value !== '').map((c) => ({ value: c.value, label: c.label }));
  const currentFuels = FUELS_BY_TYPE[vehicleType] || FUELS_BY_TYPE.auto;
  const fuelOptions = currentFuels.map((f) => ({ value: f.value, label: f.label }));
  const transmissionOptions = TRANSMISSIONS.map((t) => ({ value: t.value, label: t.label }));
  const conditionOptions = CONDITIONS.map((c) => ({ value: c.value, label: c.label }));
  const colorExtOptions = COLORS.map((c) => ({ value: c, label: c }));
  const colorIntOptions = INTERIOR_COLORS.map((c) => ({ value: c, label: c }));
  const doorOptions = [
    { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: '4', label: '4' }, { value: '5', label: '5' },
  ];
  const starterOptions = MOTO_STARTERS.map((s) => ({ value: s.value, label: s.label }));
  const coolingOptions = MOTO_COOLING.map((c) => ({ value: c.value, label: c.label }));
  const hullOptions = BARCO_HULL_MATERIALS.map((h) => ({ value: h.value, label: h.label }));

  const equipmentCount = Object.values(equipment).filter(Boolean).length;

  // Label lookup helpers for summary
  const categoryLabel = currentCategories.find((c) => c.value === form.category)?.label || form.category || '-';
  const fuelLabel = currentFuels.find((f) => f.value === form.fuel)?.label || form.fuel || '-';
  const transmissionLabel = TRANSMISSIONS.find((t) => t.value === form.transmission)?.label || form.transmission || '-';

  if (submitted) {
    const isAdmin = user?.role === 'admin';
    const isVerified = user?.document_verified;
    const wasAutoApproved = !isEditMode && isVerified;
    const editKeptStatus = isEditMode && (isAdmin || isVerified);
    const needsReApproval = isEditMode && !isAdmin && !isVerified;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card">
          <div className="w-20 h-20 rounded-full bg-success-green/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success-green" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-primary mb-3">
            {isEditMode ? '¡Anuncio actualizado!' : '¡Anuncio enviado!'}
          </h2>
          {wasAutoApproved ? (
            <>
              <p className="text-text-secondary mb-2">Tu anuncio ya está <span className="font-semibold text-success-green">activo</span>.</p>
              <p className="text-sm text-text-secondary mb-8">Como usuario verificado, tu anuncio se publicó automáticamente.</p>
            </>
          ) : editKeptStatus ? (
            <>
              <p className="text-text-secondary mb-2">Los cambios fueron guardados exitosamente.</p>
              <p className="text-sm text-text-secondary mb-8">Tu anuncio sigue activo con los nuevos datos.</p>
            </>
          ) : needsReApproval ? (
            <>
              <p className="text-text-secondary mb-2">Tu anuncio fue actualizado y está <span className="font-semibold text-amber-600">pendiente de re-aprobación</span>.</p>
              <p className="text-sm text-text-secondary mb-8">Nuestro equipo lo revisará en las próximas horas.</p>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-2">Tu anuncio está <span className="font-semibold text-amber-600">pendiente de aprobación</span>.</p>
              <p className="text-sm text-text-secondary mb-8">Nuestro equipo lo revisará en las próximas horas. Te notificaremos cuando esté activo.</p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/panel')}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Ver mis anuncios
            </button>
            {!isEditMode && (
              <button
                onClick={() => { setSubmitted(false); setCurrentStep(1); setForm({ condition:'',brandId:'',brandName:'',isCustomBrand:false,customBrand:'',modelId:'',modelName:'',trimId:'',year:'',version:'',category:'',fuel:'',transmission:'',mileage:'',colorExt:'',colorInt:'',plateMasked:'',doors:'',price:'',description:'',city:'',whatsapp:'',altPhone:'',engineCc:'',brakeType:'',starter:'',cooling:'',lengthFt:'',engineHp:'',hoursUsed:'',hullMaterial:'',passengerCapacity:''}); setPhotoFiles([]); setPhotoPreviews([]); setExistingPhotos([]); setPhotosToDelete([]); setAcceptTerms(false); setDocFile(null); }}
                className="px-6 py-3 rounded-xl border border-border text-text-primary font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                Publicar otro vehículo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (editLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-text-primary mb-8">
        {isEditMode ? 'Editar vehículo' : 'Publicar vehículo'}
      </h1>

      {/* Progress Stepper */}
      <div className="flex items-center mb-12">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  currentStep > step.num
                    ? 'border-success-green bg-success-green text-white'
                    : currentStep === step.num
                    ? 'border-primary bg-primary text-white shadow-float'
                    : 'border-border bg-white text-text-secondary'
                }`}
              >
                {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span className={`text-xs font-semibold mt-2 ${currentStep === step.num ? 'text-primary' : currentStep > step.num ? 'text-text-primary' : 'text-text-secondary'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-green rounded-full transition-all duration-500 ease-out"
                  style={{ width: currentStep > step.num ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {/* ──── Step 1: Datos del vehículo (Brand>Model>Trim cascade) ──── */}
      {currentStep === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card"
        >
          {/* Vehicle Type Selector */}
          <div className="mb-8">
            <label className="text-sm font-medium text-text-primary mb-3 block">Tipo de vehículo</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { type: 'auto' as VehicleType, icon: Car, label: 'Auto' },
                { type: 'moto' as VehicleType, icon: Bike, label: 'Moto' },
                { type: 'barco' as VehicleType, icon: Ship, label: 'Barco' },
              ]).map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all cursor-pointer ${
                    vehicleType === type
                      ? 'border-primary bg-primary-light text-primary shadow-sm'
                      : 'border-border bg-white text-text-secondary hover:border-primary/30'
                  }`}
                >
                  <Icon size={28} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            {vehicleType === 'moto' ? <Bike className="w-5 h-5 text-primary" /> :
             vehicleType === 'barco' ? <Ship className="w-5 h-5 text-primary" /> :
             <Car className="w-5 h-5 text-primary" />}
            Datos del {VEHICLE_TYPE_LABELS[vehicleType].singular.toLowerCase()}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Condición *"
              options={conditionOptions}
              placeholder="Seleccioná"
              value={form.condition}
              onChange={(e) => updateField('condition', e.target.value)}
            />

            {/* Brand cascade + Otra marca */}
            {form.isCustomBrand ? (
              <div>
                <Input
                  label="Marca (personalizada) *"
                  placeholder="Escribí el nombre de la marca"
                  value={form.customBrand}
                  onChange={(e) => updateField('customBrand', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isCustomBrand: false, customBrand: '' }))}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Volver a la lista de marcas
                </button>
              </div>
            ) : (
              <Select
                label="Marca *"
                options={brandOptions}
                placeholder={brands.length ? 'Seleccioná marca' : 'Cargando...'}
                value={form.brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
              />
            )}

            {/* Model cascade */}
            {!form.isCustomBrand ? (
              <Select
                label="Modelo *"
                options={modelOptions}
                placeholder={loadingCatalog ? 'Cargando...' : form.brandId ? 'Seleccioná modelo' : 'Seleccioná marca primero'}
                value={form.modelId}
                onChange={(e) => handleModelChange(e.target.value)}
              />
            ) : (
              <Input
                label="Modelo *"
                placeholder="Escribí el modelo"
                value={form.modelName}
                onChange={(e) => updateField('modelName', e.target.value)}
              />
            )}

            {/* Trim cascade (only for catalog brands) */}
            {!form.isCustomBrand && (
              <Select
                label="Versión / Trim"
                options={trimOptions}
                placeholder={loadingCatalog ? 'Cargando...' : form.modelId ? 'Seleccioná versión' : 'Seleccioná modelo primero'}
                value={form.trimId}
                onChange={(e) => handleTrimChange(e.target.value)}
              />
            )}

            <Input
              label="Año *"
              type="number"
              placeholder="Ej: 2023"
              value={form.year}
              onChange={(e) => updateField('year', e.target.value)}
            />
            <Input
              label="Versión (manual)"
              placeholder={vehicleType === 'moto' ? 'Ej: ABS 2023' : vehicleType === 'barco' ? 'Ej: Sport 200' : 'Ej: SRV 2.8 TDI'}
              value={form.version}
              onChange={(e) => updateField('version', e.target.value)}
            />

            <Select
              label="Categoría"
              options={categoryOptions}
              placeholder="Seleccioná"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
            />
            <Select
              label="Combustible"
              options={fuelOptions}
              placeholder="Seleccioná"
              value={form.fuel}
              onChange={(e) => updateField('fuel', e.target.value)}
            />

            {/* Auto-specific fields */}
            {vehicleType === 'auto' && (
              <>
                <Select
                  label="Transmisión"
                  options={transmissionOptions}
                  placeholder="Seleccioná"
                  value={form.transmission}
                  onChange={(e) => updateField('transmission', e.target.value)}
                />
                <Input
                  label="Kilometraje"
                  type="number"
                  placeholder="Ej: 18000"
                  value={form.mileage}
                  onChange={(e) => updateField('mileage', e.target.value)}
                />
                <Select
                  label="Puertas"
                  options={doorOptions}
                  placeholder="Seleccioná"
                  value={form.doors}
                  onChange={(e) => updateField('doors', e.target.value)}
                />
              </>
            )}

            {/* Moto-specific fields */}
            {vehicleType === 'moto' && (
              <>
                <Input
                  label="Cilindrada (cc) *"
                  type="number"
                  placeholder="Ej: 250"
                  value={form.engineCc}
                  onChange={(e) => updateField('engineCc', e.target.value)}
                />
                <Input
                  label="Kilometraje"
                  type="number"
                  placeholder="Ej: 8000"
                  value={form.mileage}
                  onChange={(e) => updateField('mileage', e.target.value)}
                />
                <Select
                  label="Tipo de freno"
                  options={[{ value: 'disco', label: 'Disco' }, { value: 'tambor', label: 'Tambor' }, { value: 'combinado', label: 'Combinado' }]}
                  placeholder="Seleccioná"
                  value={form.brakeType}
                  onChange={(e) => updateField('brakeType', e.target.value)}
                />
                <Select
                  label="Partida"
                  options={starterOptions}
                  placeholder="Seleccioná"
                  value={form.starter}
                  onChange={(e) => updateField('starter', e.target.value)}
                />
                <Select
                  label="Refrigeración"
                  options={coolingOptions}
                  placeholder="Seleccioná"
                  value={form.cooling}
                  onChange={(e) => updateField('cooling', e.target.value)}
                />
              </>
            )}

            {/* Barco-specific fields */}
            {vehicleType === 'barco' && (
              <>
                <Input
                  label="Eslora / Largo (pies)"
                  type="number"
                  placeholder="Ej: 22"
                  value={form.lengthFt}
                  onChange={(e) => updateField('lengthFt', e.target.value)}
                />
                <Input
                  label="Motor (HP)"
                  type="number"
                  placeholder="Ej: 150"
                  value={form.engineHp}
                  onChange={(e) => updateField('engineHp', e.target.value)}
                />
                <Input
                  label="Horas de uso"
                  type="number"
                  placeholder="Ej: 350"
                  value={form.hoursUsed}
                  onChange={(e) => updateField('hoursUsed', e.target.value)}
                />
                <Select
                  label="Material del casco"
                  options={hullOptions}
                  placeholder="Seleccioná"
                  value={form.hullMaterial}
                  onChange={(e) => updateField('hullMaterial', e.target.value)}
                />
                <Input
                  label="Capacidad de pasajeros"
                  type="number"
                  placeholder="Ej: 8"
                  value={form.passengerCapacity}
                  onChange={(e) => updateField('passengerCapacity', e.target.value)}
                />
              </>
            )}

            <Select
              label="Color exterior"
              options={colorExtOptions}
              placeholder="Seleccioná"
              value={form.colorExt}
              onChange={(e) => updateField('colorExt', e.target.value)}
            />
            <Select
              label="Color interior"
              options={colorIntOptions}
              placeholder="Seleccioná"
              value={form.colorInt}
              onChange={(e) => updateField('colorInt', e.target.value)}
            />
            <Input
              label="Placa (parcial)"
              placeholder="Ej: ABC-***"
              value={form.plateMasked}
              onChange={(e) => updateField('plateMasked', e.target.value)}
            />
          </div>

          <div className="flex justify-end mt-10 pt-6 border-t border-border">
            <Button onClick={() => goToStep(2)} size="lg" className="rounded-xl">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ──── Step 2: Fotos ──── */}
      {currentStep === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card"
        >
          <h2 className="text-xl font-heading font-bold text-text-primary mb-2 flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-primary" />
            Fotos del vehículo
          </h2>
          <p className="text-sm text-text-secondary mb-6">La primera foto será la portada del anuncio</p>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-2xl bg-primary-light/50 p-12 text-center cursor-pointer hover:border-primary hover:bg-primary-light transition-all mb-6"
          >
            <Camera className="w-14 h-14 text-primary mx-auto mb-4" />
            <p className="text-text-primary font-medium">Hacé clic para seleccionar fotos</p>
            <p className="text-sm text-text-secondary mt-1">Máximo 10 fotos · JPG, PNG o WebP</p>
          </div>

          {/* Existing photos (edit mode) */}
          {existingPhotos.filter((p) => !photosToDelete.includes(p.id)).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-text-secondary mb-2">Fotos actuales</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {existingPhotos.filter((p) => !photosToDelete.includes(p.id)).map((photo, i) => (
                  <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] shadow-card">
                    <img src={photo.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotosToDelete((prev) => [...prev, photo.id])}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur text-accent-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-card cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && photoPreviews.length === 0 && (
                      <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Portada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New photos (previews) */}
          {photoPreviews.length > 0 && (
            <div className="mb-6">
              {existingPhotos.length > 0 && <p className="text-xs font-medium text-text-secondary mb-2">Fotos nuevas</p>}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photoPreviews.map((photo, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] shadow-card">
                    <img src={photo} alt={`Foto nueva ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur text-accent-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-card cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && existingPhotos.filter((p) => !photosToDelete.includes(p.id)).length === 0 && (
                      <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Portada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {noPhotoWarning && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-sm text-amber-800 flex-1">Los anuncios con fotos reciben <span className="font-semibold">5× más contactos</span>. ¿Querés continuar sin fotos?</p>
              <button onClick={() => { setNoPhotoWarning(false); setCurrentStep(3); window.scrollTo({top:0,behavior:'smooth'}); }} className="text-xs font-semibold text-amber-700 underline whitespace-nowrap cursor-pointer">Continuar sin fotos</button>
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(1)} size="lg" className="rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button onClick={() => goToStep(3)} size="lg" className="rounded-xl">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ──── Step 3: Precio + Descripción + Equipamiento ──── */}
      {currentStep === 3 && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card"
        >
          <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Precio, descripción y equipamiento
          </h2>

          <div className="flex flex-col gap-5">
            {/* Price */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Precio (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-secondary">USD</span>
                <input
                  type="number"
                  placeholder="Ej: 48500"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className="w-full rounded-lg border border-border pl-16 pr-4 py-3 text-2xl font-bold text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">Descripción</label>
              <textarea
                rows={5}
                placeholder="Describí tu vehículo: estado, historial de mantenimiento, extras..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-text-secondary mt-1">{form.description.length}/500 caracteres</p>
            </div>

            {/* City */}
            <Select
              label="Ciudad *"
              options={cityOptions}
              placeholder="Seleccioná tu ciudad"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
            />

            {/* Equipment Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Equipamiento
                </label>
                <span className="text-xs text-text-secondary">{equipmentCount} seleccionados</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentEquipment.map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                      equipment[item.key]
                        ? 'border-primary bg-primary-light text-primary font-medium'
                        : 'border-border bg-white text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={equipment[item.key]}
                      onChange={() => toggleEquipment(item.key)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(2)} size="lg" className="rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button onClick={() => goToStep(4)} size="lg" className="rounded-xl">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ──── Step 4: Contacto y revisión ──── */}
      {currentStep === 4 && (
        <motion.div
          key="step-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-card"
        >
          <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Contacto y revisión
          </h2>

          <div className="flex flex-col gap-4 mb-6">
            <Input label="WhatsApp *" type="tel" placeholder="+595 9XX XXX XXX" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} />
            <Input label="Teléfono alternativo" type="tel" placeholder="+595 21 XXX XXX" value={form.altPhone} onChange={(e) => updateField('altPhone', e.target.value)} />
          </div>

          {/* Document upload — required for first-time publishers (skip in edit mode) */}
          {!isEditMode && !user?.document_verified && (
            <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Verificación de identidad <span className="text-xs font-semibold text-accent-red ml-1">* obligatorio</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Solo para tu primer anuncio. Completá tus datos y subí tu cédula. Lo revisamos manualmente — no es visible para los compradores.
                  </p>
                </div>
              </div>

              {/* KYC personal data fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Fecha de nacimiento <span className="text-accent-red">*</span></label>
                  <input
                    type="date"
                    value={kycData.birth_date}
                    onChange={(e) => setKycData((p) => ({ ...p, birth_date: e.target.value }))}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Nacionalidad <span className="text-accent-red">*</span></label>
                  <input
                    type="text"
                    value={kycData.nationality}
                    onChange={(e) => setKycData((p) => ({ ...p, nationality: e.target.value }))}
                    placeholder="Paraguayo/a"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Departamento</label>
                  <select
                    value={kycData.state}
                    onChange={(e) => setKycData((p) => ({ ...p, state: e.target.value }))}
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option value="">Seleccioná</option>
                    {['Asunción','Alto Paraguay','Alto Paraná','Amambay','Boquerón','Caaguazú','Caazapá','Canindeyú','Central','Concepción','Cordillera','Guairá','Itapúa','Misiones','Ñeembucú','Paraguarí','Presidente Hayes','San Pedro'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Código postal</label>
                  <input
                    type="text"
                    value={kycData.postal_code}
                    onChange={(e) => setKycData((p) => ({ ...p, postal_code: e.target.value }))}
                    placeholder="Ej: 001001"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Document file upload */}
              <input ref={docInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              {docFile ? (
                <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-amber-200">
                  <CheckCircle2 className="w-4 h-4 text-success-green shrink-0" />
                  <span className="text-sm text-text-primary truncate flex-1">{docFile.name}</span>
                  <button type="button" onClick={() => setDocFile(null)} className="text-text-secondary hover:text-accent-red transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-amber-400 rounded-xl py-4 text-sm text-amber-700 font-medium hover:border-amber-500 hover:bg-white/50 transition-all cursor-pointer"
                >
                  + Subir cédula o documento (JPG, PNG o PDF) <span className="text-accent-red">*</span>
                </button>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 mb-6">
            <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Resumen del anuncio</h3>
            <div className="flex flex-col gap-2.5 text-sm">
              {[
                ['Condición', form.condition === '0km' ? '0 km' : form.condition === 'usado' ? 'Usado' : '-'],
                ['Marca', form.brandName || '-'],
                ['Modelo', form.modelName || '-'],
                ['Año', form.year || '-'],
                ['Versión', form.version || '-'],
                ['Categoría', categoryLabel],
                ['Combustible', fuelLabel],
                ['Transmisión', transmissionLabel],
                ['Kilometraje', form.mileage ? `${Number(form.mileage).toLocaleString('es-PY')} km` : '-'],
                ['Color exterior', form.colorExt || '-'],
                ['Color interior', form.colorInt || '-'],
                ['Puertas', form.doors || '-'],
                ['Ciudad', form.city || '-'],
                ['Fotos', `${photoPreviews.length + existingPhotos.filter((p) => !photosToDelete.includes(p.id)).length} foto(s)`],
                ['Equipamiento', equipmentCount > 0 ? `${equipmentCount} items` : 'Ninguno'],
                ['WhatsApp', form.whatsapp || '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-text-secondary">{label}</span>
                  <span className="text-text-primary font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-text-secondary">Precio</span>
                <span className="text-lg font-bold text-primary">
                  {form.price ? `USD ${Number(form.price).toLocaleString('es-PY')}` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Terms (skip in edit mode) */}
          {!isEditMode && (
            <label className="flex items-start gap-2 cursor-pointer mb-6">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer" />
              <span className="text-sm text-text-secondary">Acepto las condiciones de publicación</span>
            </label>
          )}

          {error && (
            <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-sm text-accent-red mt-4">{error}</div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(3)} size="lg" className="rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="rounded-xl bg-success-green hover:bg-success-green/90 text-white px-8"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEditMode ? 'Guardando...' : 'Publicando...'}</>
              ) : (
                isEditMode ? 'Guardar cambios' : 'Publicar anuncio'
              )}
            </Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
