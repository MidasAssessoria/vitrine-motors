import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { createLead } from '../../lib/leads';
import { contactFormSchema, getFirstZodError } from '../../lib/validation';
import { sanitizeText, sanitizePhoneNumber } from '../../lib/sanitize';

interface ContactFormProps {
  listingId: string;
  sellerId: string;
  dealerId?: string | null;
}

export function ContactForm({ listingId, sellerId, dealerId }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validacao com Zod
    const validation = contactFormSchema.safeParse({ name, phone, email, message });
    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setLoading(true);
    setError('');

    const lead = await createLead({
      listing_id: listingId,
      seller_id: sellerId,
      dealer_id: dealerId || null,
      buyer_name: sanitizeText(name.trim()),
      buyer_phone: sanitizePhoneNumber(phone.trim()),
      buyer_email: email.trim() || undefined,
      source: 'form',
      notes: message.trim() ? sanitizeText(message.trim()) : undefined,
    });

    setLoading(false);

    if (lead) {
      setSent(true);
    } else {
      setError('No se pudo enviar tu consulta. Intenta nuevamente.');
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-status-success-border bg-status-success-bg p-6 text-center">
        <CheckCircle className="w-10 h-10 text-success-green mx-auto mb-3" />
        <h4 className="font-heading font-bold text-text-primary mb-1">Consulta enviada</h4>
        <p className="text-sm text-text-secondary">
          El vendedor recibira tu mensaje y se pondra en contacto contigo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
      <h4 className="font-heading font-bold text-text-primary mb-4">
        Enviar consulta
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-status-error-bg border border-status-error-border text-accent-red text-sm rounded-lg p-2.5">
            {error}
          </div>
        )}

        <Input
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
        />

        <Input
          label="Telefono"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0981 123 456"
          required
        />

        <Input
          label="Email (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Mensaje (opcional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hola, me interesa este vehiculo..."
            rows={3}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          <MessageSquare size={16} className="mr-2" />
          {loading ? 'Enviando...' : 'Enviar consulta'}
        </Button>
      </form>
    </div>
  );
}
