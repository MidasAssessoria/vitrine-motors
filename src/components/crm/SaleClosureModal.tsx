import { useState } from 'react';
import { DollarSign, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { updateLeadStatus } from '../../lib/leads';
import { supabase } from '../../lib/supabase';

export type PaymentMethod = 'cash' | 'financing' | 'trade_in' | 'mixed';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash:       'Contado',
  financing:  'Financiado',
  trade_in:   'Permuta',
  mixed:      'Mixto (parcial + finan.)',
};

interface Props {
  leadId: string;
  buyerName: string;
  listingTitle?: string;
  currentDealValue?: number | null;
  onConfirm: (data: { deal_value: number; payment_method: PaymentMethod; notes: string }) => void;
  onCancel: () => void;
}

export function SaleClosureModal({ leadId, buyerName, listingTitle, currentDealValue, onConfirm, onCancel }: Props) {
  const [dealValue, setDealValue] = useState(currentDealValue ? String(currentDealValue) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const value = parseFloat(dealValue);
    if (isNaN(value) || value <= 0) return;

    setSaving(true);

    // Atualizar status + dados de fechamento em uma única chamada
    if (supabase) {
      await supabase
        .from('leads')
        .update({
          status: 'sold',
          deal_value: value,
          notes: notes.trim()
            ? `[${PAYMENT_LABELS[paymentMethod]}] ${notes.trim()}`
            : `[${PAYMENT_LABELS[paymentMethod]}]`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } else {
      await updateLeadStatus(leadId, 'sold');
    }

    setSaving(false);
    onConfirm({ deal_value: value, payment_method: paymentMethod, notes });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success-green" />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-text-primary">Registrar venta</h3>
            <p className="text-xs text-text-secondary">{buyerName}{listingTitle ? ` · ${listingTitle}` : ''}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Deal value */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Precio final de venta (USD) <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="number"
                min="0"
                step="100"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="25000"
                className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Forma de pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    paymentMethod === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  {PAYMENT_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Observaciones (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Entrega acordada para el viernes, incluye patente..."
              rows={3}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-secondary rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !dealValue || parseFloat(dealValue) <= 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-success-green hover:bg-success-green/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar venta
          </button>
        </div>
      </div>
    </div>
  );
}
