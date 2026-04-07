import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Car, Search } from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../stores/authStore';
import { fetchConversations } from '../../lib/chat';
import { formatDate } from '../../utils/formatters';
import type { Conversation } from '../../types';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

function ChatSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-border p-4">
          <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ChatsPage() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchConversations(user.id).then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((conv) => {
      const isBuyer = conv.buyer_id === user?.id;
      const other = isBuyer ? conv.seller : conv.buyer;
      return (
        other?.name?.toLowerCase().includes(q) ||
        conv.listing?.title?.toLowerCase().includes(q) ||
        conv.last_message_preview?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, user]);

  if (!user) return null;

  return (
    <Container className="py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-text-primary">Mis mensajes</h1>
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por contacto o vehículo..."
            className="w-full border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {loading ? (
        <ChatSkeleton />
      ) : conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="bg-white rounded-2xl border border-border p-12 text-center shadow-card"
        >
          <MessageSquare className="w-12 h-12 text-border mx-auto mb-4" />
          <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Sin mensajes</h3>
          <p className="text-sm text-text-secondary mb-6">
            Los mensajes aparecerán cuando contactes a un vendedor desde la página del vehículo.
          </p>
          <Link to="/comprar" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Buscar vehículos
          </Link>
        </motion.div>
      ) : filtered.length === 0 && search ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-card">
          <Search className="w-10 h-10 text-border mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Sin resultados para <strong>"{search}"</strong></p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {filtered.map((conv) => {
            const isBuyer = conv.buyer_id === user.id;
            const other = isBuyer ? conv.seller : conv.buyer;
            const unread = isBuyer ? conv.buyer_unread : conv.seller_unread;
            const listing = conv.listing;
            const thumb = (listing?.photos as { url: string }[] | undefined)?.[0]?.url;

            return (
              <motion.div key={conv.id} variants={fadeUp}>
                <Link
                  to={`/mensajes/${conv.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-border p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* Vehicle thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-bg-secondary shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={listing?.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-border" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {other?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {listing?.title || 'Vehículo'}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {conv.last_message_preview || 'Iniciá la conversación'}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-text-secondary">
                      {formatDate(conv.last_message_at)}
                    </span>
                    {unread > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </Container>
  );
}
