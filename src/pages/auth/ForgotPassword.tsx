import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!supabase) {
      setError('Supabase no configurado');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
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
            Correo enviado
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Revisa tu bandeja de entrada en <strong>{email}</strong>.
            Te enviamos un enlace para restablecer tu contrasena.
          </p>
          <Link to="/login">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Volver al inicio de sesion
            </Button>
          </Link>
        </motion.div>
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
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesion
        </Link>

        <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
          Recuperar contrasena
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contrasena.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-status-error-bg border border-status-error-border text-accent-red text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <Input
            label="Correo electronico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
