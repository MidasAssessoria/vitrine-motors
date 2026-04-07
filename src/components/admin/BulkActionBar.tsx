import { Check, X, Star, Trash2, DollarSign } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onApprove?: () => void;
  onReject?: () => void;
  onFeature?: () => void;
  onDelete?: () => void;
  onPriceChange?: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  count,
  onApprove,
  onReject,
  onFeature,
  onDelete,
  onPriceChange,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-border shadow-lg glow-gold">
      <span className="text-sm font-medium text-primary mr-2">{count} seleccionados</span>

      {onApprove && (
        <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-green/10 text-success-green text-xs font-medium hover:bg-success-green/20 transition-colors cursor-pointer">
          <Check className="w-3.5 h-3.5" /> Aprobar
        </button>
      )}
      {onReject && (
        <button onClick={onReject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red text-xs font-medium hover:bg-accent-red/20 transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5" /> Rechazar
        </button>
      )}
      {onFeature && (
        <button onClick={onFeature} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer">
          <Star className="w-3.5 h-3.5" /> Destacar
        </button>
      )}
      {onPriceChange && (
        <button onClick={onPriceChange} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors cursor-pointer">
          <DollarSign className="w-3.5 h-3.5" /> Precio
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red text-xs font-medium hover:bg-accent-red/20 transition-colors cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      )}

      <div className="w-px h-6 bg-border mx-1" />

      <button onClick={onClear} className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer">
        Cancelar
      </button>
    </div>
  );
}
