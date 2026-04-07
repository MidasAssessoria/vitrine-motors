import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: { Icon: CheckCircle2, cls: 'text-success-green' },
  error:   { Icon: XCircle,      cls: 'text-accent-red'    },
  info:    { Icon: Info,          cls: 'text-verified-blue' },
  warning: { Icon: AlertTriangle, cls: 'text-warning'       },
};

const BG = {
  success: 'border-status-success-border bg-status-success-bg',
  error:   'border-status-error-border bg-status-error-bg',
  info:    'border-status-info-border bg-status-info-bg',
  warning: 'border-status-warning-border bg-status-warning-bg',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const { Icon, cls } = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-in ${BG[toast.type]}`}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${cls}`} />
            <p className="flex-1 text-sm font-medium text-text-primary leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
