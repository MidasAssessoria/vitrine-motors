import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../stores/authStore';
import { CITIES } from '../../data/constants';
import { registerBaseSchema, registerDealerSchema, getFirstZodError } from '../../lib/validation';
import { sanitizeText, sanitizePhoneNumber } from '../../lib/sanitize';

type TabType = 'persona' | 'concesionaria';

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser, clearError, error: authError } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('persona');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Concesionaria fields
    companyName: '',
    ruc: '',
    address: '',
    city: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setError('');

    // Validacao com Zod
    const schema = activeTab === 'concesionaria' ? registerDealerSchema : registerBaseSchema;
    const validation = schema.safeParse(form);
    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    if (!acceptTerms) {
      setError('Debés aceptar los términos y condiciones');
      return;
    }

    setLoading(true);

    await registerUser({
      email: form.email,
      password: form.password,
      name: sanitizeText(form.name),
      phone: sanitizePhoneNumber(form.phone),
      role: activeTab === 'concesionaria' ? 'seller' : 'buyer',
      // Dados da concessionária (passados ao store para criar dealership)
      ...(activeTab === 'concesionaria' ? {
        companyName: form.companyName,
        ruc: form.ruc,
        address: form.address,
        city: form.city,
      } : {}),
    });

    setLoading(false);

    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      navigate(activeTab === 'concesionaria' ? '/dealer' : '/');
    }
  };

  const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
  const displayError = error || authError;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left side - photo (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <img
          src="/images/categories/pickup.png"
          alt="VitrineMotors"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 flex flex-col justify-end p-10">
          <h2 className="text-3xl font-heading font-bold text-white leading-tight">
            Empezá a vender<br />hoy mismo
          </h2>
          <p className="text-white/70 mt-3 text-sm max-w-sm">
            Registrate gratis y publicá tu primer vehículo en minutos
          </p>
        </div>
      </motion.div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src="/logo.png" alt="VitrineMotors" className="h-16 w-auto" style={{ mixBlendMode: 'multiply' }} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">
              Crear cuenta
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Registrate para comprar o vender vehículos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-bg-secondary rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('persona')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'persona'
                  ? 'bg-white text-text-primary shadow-card'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <User size={16} />
              Persona Física
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('concesionaria')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'concesionaria'
                  ? 'bg-white text-text-primary shadow-card'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building2 size={16} />
              Concesionaria
            </button>
          </div>

          {/* Info banner */}
          {activeTab === 'persona' && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-5 text-xs text-text-secondary">
              Como persona física podés comprar y vender vehículos. Para publicar, te pediremos una foto de tu cédula de identidad.
            </div>
          )}
          {activeTab === 'concesionaria' && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-5 text-xs text-text-secondary">
              Registrá tu concesionaria para acceder al panel de dealer con inventario, leads y analytics. Tu registro será revisado por nuestro equipo.
            </div>
          )}

          {displayError && (
            <div className="bg-status-error-bg border border-status-error-border text-accent-red text-sm rounded-lg p-3 mb-4">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              placeholder={activeTab === 'concesionaria' ? 'Nombre del representante' : 'Tu nombre'}
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />

            <Input
              label="Teléfono"
              type="tel"
              placeholder="+595 9XX XXX XXX"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              required
            />

            {/* Concesionaria-specific fields */}
            {activeTab === 'concesionaria' && (
              <div className="space-y-4 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider pt-3">Datos de la empresa</p>

                <Input
                  label="Nombre de la empresa *"
                  placeholder="Mi Concesionaria S.A."
                  value={form.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  required
                />

                <Input
                  label="RUC *"
                  placeholder="80012345-6"
                  value={form.ruc}
                  onChange={(e) => updateField('ruc', e.target.value)}
                  required
                />

                <Input
                  label="Dirección"
                  placeholder="Av. Ejemplo 1234"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />

                <Select
                  label="Ciudad *"
                  options={cityOptions}
                  placeholder="Seleccioná tu ciudad"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  required
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar contraseña"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repetí tu contraseña"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
              />
              <span className="text-sm text-text-secondary">
                Acepto los{' '}
                <Link to="/terminos" className="text-primary hover:underline">
                  términos y condiciones
                </Link>
              </span>
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creando cuenta...' : activeTab === 'concesionaria' ? 'Registrar concesionaria' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
