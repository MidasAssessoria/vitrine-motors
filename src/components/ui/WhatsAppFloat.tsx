import { MessageCircle } from 'lucide-react';

const SUPPORT_PHONE = import.meta.env.VITE_WHATSAPP_SUPPORT;

export function WhatsAppFloat() {
  if (!SUPPORT_PHONE) return null;

  return (
    <a
      href={`https://wa.me/${SUPPORT_PHONE}?text=Hola, necesito ayuda`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6 group"
      aria-label="Contactar por WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
      <span className="relative w-14 h-14 rounded-full bg-whatsapp shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-110 group-active:scale-95 group-hover:shadow-xl">
        <MessageCircle className="w-6 h-6" />
      </span>
    </a>
  );
}
