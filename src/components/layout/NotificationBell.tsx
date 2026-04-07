import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const TYPE_ICONS: Record<string, string> = {
  new_lead: '👤',
  listing_approved: '✅',
  listing_rejected: '❌',
  dealer_approved: '🏪',
  lead_status_change: '🔄',
  boost_expired: '⏰',
  system: '📢',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-bg-secondary transition-colors cursor-pointer"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell size={20} className="text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-red text-white text-[10px] font-bold px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-float border border-border overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50">
            <h3 className="text-sm font-bold text-text-primary font-heading">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  markAllAsRead(user.id);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                Marcar todo leido
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={32} className="text-border mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-bg-secondary/50 transition-colors ${
                    !n.read ? 'bg-primary-light/30' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-secondary/70">{timeAgo(n.created_at)}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => {
                            markAsRead(n.id);
                            setOpen(false);
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          Ver <ExternalLink size={8} />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 mt-1 p-1 rounded-full hover:bg-primary-light transition-colors cursor-pointer"
                      title="Marcar como leido"
                    >
                      <Check size={12} className="text-primary" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
