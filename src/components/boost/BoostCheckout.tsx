import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Zap, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BoostPackage } from '../../types';

interface BoostCheckoutProps {
  pkg: BoostPackage;
  listingId: string;
  dealerId: string;
  userId: string;
  onCancel: () => void;
}

export function BoostCheckout({ pkg, listingId, dealerId, userId, onCancel }: BoostCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!supabase) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          package_id: pkg.id,
          package_name: pkg.name,
          price_usd: pkg.price_usd,
          listing_id: listingId,
          dealer_id: dealerId,
          user_id: userId,
          duration_days: pkg.duration_days,
        },
      });

      if (fnError) throw fnError;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('No se pudo crear la sesion de pago');
      }
    } catch (err) {
      setError('Error al procesar el pago. Intenta nuevamente.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-heading font-bold text-text-primary">
          Confirmar Boost
        </h3>
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{pkg.name}</span>
          <Badge variant={pkg.tier === 'gold' ? 'featured' : 'new'}>{pkg.badge_label}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Duracion</span>
          <span>{pkg.duration_days} dias</span>
        </div>
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Fotos maximas</span>
          <span>{pkg.max_photos}</span>
        </div>
        {pkg.auto_bump && (
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>Auto-bump diario</span>
            <span className="text-green-600 font-medium">Incluido</span>
          </div>
        )}
        <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
          <span className="font-bold text-text-primary">Total</span>
          <span className="text-xl font-bold text-primary">USD {pkg.price_usd}</span>
        </div>
      </div>

      {error && (
        <div className="bg-status-error-bg border border-status-error-border text-accent-red text-sm rounded-lg p-2.5 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handlePayment} className="flex-1" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <CreditCard size={16} className="mr-2" />
          )}
          {loading ? 'Procesando...' : 'Pagar con Stripe'}
        </Button>
      </div>
    </div>
  );
}
