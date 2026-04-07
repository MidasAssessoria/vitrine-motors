import { useState } from 'react';
import { MessageCircle, X, Phone, User } from 'lucide-react';
import { createLead } from '../../lib/leads';

interface WhatsAppLeadModalProps {
  listingId: string;
  listingTitle: string;
  sellerId?: string | null;
  dealershipId?: string | null;
  whatsappUrl: string;
  onClose: () => void;
}

export function WhatsAppLeadModal({
  listingId, listingTitle, sellerId, dealershipId, whatsappUrl, onClose,
}: WhatsAppLeadModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContact = async () => {
    setSubmitting(true);
    // Save lead if we have enough info
    if (name.trim() && phone.trim() && sellerId) {
      await createLead({
        listing_id: listingId,
        seller_id: sellerId,
        dealer_id: dealershipId ?? null,
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        source: 'whatsapp',
        temperature: 'hot',
      }).catch(() => null); // silent fail
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleSkip = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-text-primary text-sm">Contactar por WhatsApp</h3>
            <p className="text-xs text-text-secondary line-clamp-1">{listingTitle}</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Dejá tus datos para que el vendedor pueda contactarte (opcional).
        </p>

        <div className="space-y-3">
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="tel"
              placeholder="Tu teléfono (ej: +595981...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-xl hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            Saltar
          </button>
          <button
            onClick={handleContact}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-whatsapp hover:bg-whatsapp/90 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <MessageCircle size={15} />
            {submitting ? 'Abriendo...' : 'Ir a WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
