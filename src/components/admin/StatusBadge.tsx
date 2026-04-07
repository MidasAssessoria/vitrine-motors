const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-green/10 text-success-green',
  pending: 'bg-primary/10 text-primary',
  paused: 'bg-bg-secondary text-text-secondary',
  rejected: 'bg-accent-red/10 text-accent-red',
  new: 'bg-verified-blue/10 text-verified-blue',
  contacted: 'bg-primary/10 text-primary',
  negotiating: 'bg-primary/15 text-primary-dark',
  sold: 'bg-success-green/10 text-success-green',
  lost: 'bg-bg-secondary text-text-secondary',
  verified: 'bg-verified-blue/10 text-verified-blue',
  admin: 'bg-accent-red/10 text-accent-red',
  seller: 'bg-primary/10 text-primary',
  buyer: 'bg-bg-secondary text-text-secondary',
  free: 'bg-bg-secondary text-text-secondary',
  premium: 'bg-primary/10 text-primary',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  paused: 'Pausado',
  rejected: 'Rechazado',
  new: 'Nuevo',
  contacted: 'Contactado',
  negotiating: 'Negociando',
  sold: 'Vendido',
  lost: 'Perdido',
  verified: 'Verificado',
  admin: 'Admin',
  seller: 'Vendedor',
  buyer: 'Comprador',
  free: 'Free',
  premium: 'Premium',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-bg-secondary text-text-secondary';
  const text = label ?? STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
}
