export function formatPrice(price: number): string {
  return `USD ${price.toLocaleString('es-PY')}`;
}

export function formatMileage(km: number): string {
  if (km === 0) return '0 km';
  return `${km.toLocaleString('es-PY')} km`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getWhatsAppUrl(phone: string, title: string): string {
  const message = encodeURIComponent(`Hola, me interesa el ${title}`);
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export function getFuelLabel(fuel: string): string {
  const map: Record<string, string> = {
    nafta: 'Nafta',
    diesel: 'Diésel',
    hibrido: 'Híbrido',
    electrico: 'Eléctrico',
  };
  return map[fuel] || fuel;
}

export function getTransmissionLabel(transmission: string): string {
  const map: Record<string, string> = {
    manual: 'Manual',
    automatico: 'Automático',
    cvt: 'CVT',
  };
  return map[transmission] || transmission;
}
