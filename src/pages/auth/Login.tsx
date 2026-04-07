import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema } from '../../lib/validation';

export function Login() {
  const navigate = useNavigate();
  const { login, error, loading, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      // Usar o error state do authStore nao e ideal, entao mostramos inline
      return;
    }

    await login(email, password);

    // Se login com sucesso, redireciona
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'seller') navigate('/panel');
      else navigate('/');
    }
  };

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
          src="/images/categories/suv.png"
          alt="VitrineMotors"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 flex flex-col justify-end p-10">
          <h2 className="text-3xl font-heading font-bold text-white leading-tight">
            Tu próximo vehículo<br />está aquí
          </h2>
          <p className="text-white/70 mt-3 text-sm max-w-sm">
            La vitrina digital de vehículos más grande de Paraguay
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
              Iniciar sesión
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Ingresá a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-accent-red/10 border border-accent-red/20 px-4 py-3 text-sm text-accent-red">
                {error}
              </div>
            )}

            {/* Email */}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                />
                <span className="text-sm text-text-secondary">Recordarme</span>
              </label>
              <Link to="/olvide-contrasena" className="text-sm text-primary hover:underline font-medium">
                ¿Olvidaste tu contrasena?
              </Link>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-text-secondary mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-primary font-semibold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
