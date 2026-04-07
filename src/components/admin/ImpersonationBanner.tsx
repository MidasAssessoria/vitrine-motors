import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useImpersonationStore } from '../../stores/impersonationStore';

export function ImpersonationBanner() {
  const { impersonating, stop } = useImpersonationStore();
  const navigate = useNavigate();

  if (!impersonating) return null;

  const handleExit = () => {
    stop();
    navigate('/admin/impersonate');
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium">
      <Eye className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        Estás viendo el panel como{' '}
        <strong className="font-bold">{impersonating.name}</strong>
      </span>
      <button
        type="button"
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
        Salir
      </button>
    </div>
  );
}
