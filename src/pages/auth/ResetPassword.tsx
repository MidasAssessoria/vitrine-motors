import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Parse recovery tokens from URL (BrowserRouter: tokens come in hash fragment or query params)
  // Supabase sends: /reset-password#access_token=xxx&refresh_token=yyy&type=recovery
  useEffect(() => {
    if (!supabase) return;

    const recoverSession = async () => {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Strategy 1: Parse from hash fragment (Supabase default)
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      // Strategy 2: Parse from query string
      if (!accessToken) {
        const searchParams = new URLSearchParams(window.location.search);
        accessToken = searchParams.get('access_token');
        refreshToken = searchParams.get('refresh_token');
      }

      if (accessToken && refreshToken && supabase) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError('El enlace de recuperacion ha expirado. Solicitá uno nuevo.');
        } else {
          setSessionReady(true);
          // Clean URL
          window.history.replaceState(null, '', `${window.location.origin}/reset-password`);
        }
      } else {
        // Try getting existing session (user might already be authenticated via recovery)
        const { data: { session } } = await supabase!.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          setError('Auth session missing! El enlace puede haber expirado. Solicitá uno nuevo desde "Olvide mi contrasena".');
        }
      }
    };

    recoverSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (!supabase || !sessionReady) {
      setError('Sesion no disponible. Solicitá un nuevo enlace.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-md w-full text-center"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-status-success-bg mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-green" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
            Contrasena actualizada
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Tu contrasena fue cambiada exitosamente. Redirigiendo al inicio de sesion...
          </p>
          <Link to="/login">
            <Button variant="primary">Ir al inicio de sesion</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Show loading while parsing tokens
  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-md w-full"
      >
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
          Nueva contrasena
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Ingresa tu nueva contrasena para restablecer el acceso a tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-status-error-bg border border-status-error-border text-accent-red text-sm rounded-lg p-3">
              {error}
              {!sessionReady && (
                <Link to="/olvide-contrasena" className="block mt-2 text-primary font-medium hover:underline">
                  Solicitar nuevo enlace
                </Link>
              )}
            </div>
          )}

          <Input
            label="Nueva contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
            required
          />

          <Input
            label="Confirmar contrasena"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetir contrasena"
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar nueva contrasena'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
