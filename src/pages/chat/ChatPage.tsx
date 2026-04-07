import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Car, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import {
  fetchConversations, fetchMessages, sendMessage, markConversationRead,
} from '../../lib/chat';
import { formatDate } from '../../utils/formatters';
import type { Conversation, Message } from '../../types';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBuyer = conversation?.buyer_id === user?.id;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Load conversation + messages
  useEffect(() => {
    if (!user || !id) return;

    fetchConversations(user.id).then((convs) => {
      const conv = convs.find((c) => c.id === id) || null;
      if (!conv) { navigate('/mensajes'); return; }
      setConversation(conv);
    });

    fetchMessages(id).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });
  }, [user, id, navigate, scrollToBottom]);

  // Mark as read when entering
  useEffect(() => {
    if (!id || !conversation) return;
    markConversationRead(id, isBuyer);
  }, [id, conversation, isBuyer]);

  // Realtime subscription — same pattern as notificationStore.ts
  useEffect(() => {
    if (!supabase || !id) return;

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates (own messages already added optimistically)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [id, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || !user || !id || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: id,
      sender_id: user.id,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    await sendMessage(id, user.id, body, isBuyer);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  const other = isBuyer ? conversation?.seller : conversation?.buyer;
  const listing = conversation?.listing;
  const thumb = (listing?.photos as { url: string }[] | undefined)?.[0]?.url;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-border shadow-card shrink-0">
        <Link to="/mensajes" className="text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Listing context */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-secondary shrink-0">
          {thumb ? (
            <img src={thumb} alt={listing?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-4 h-4 text-border" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {other?.name || 'Usuario'}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {listing?.title || 'Vehículo'}
          </p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-bg-secondary bg-dots">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-sm text-text-secondary">
            Enviá el primer mensaje
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? 'bg-primary text-white rounded-br-sm shadow-sm'
                      : 'bg-white text-text-primary rounded-bl-sm border border-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70 text-right' : 'text-text-secondary'}`}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-border shadow-card shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors max-h-28 overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
