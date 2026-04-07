import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { HeroSlide } from '../../types';

const AUTOPLAY_INTERVAL = 5000;
const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface HeroCarouselProps {
  slides: HeroSlide[];
}

// Texto fallback quando não há slides no banco
const FALLBACK_TEXT = {
  title: 'Tu Próximo Vehículo está Aquí',
  subtitle: 'Financiación exclusiva en cuotas fijas',
  cta_label: 'Explorar Modelos',
  cta_url: '/autos',
  text_theme: 'dark' as const,
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goToNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [goToNext, slides.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];
  const text = currentSlide
    ? {
        title:      currentSlide.title      || FALLBACK_TEXT.title,
        subtitle:   currentSlide.subtitle   ?? FALLBACK_TEXT.subtitle,
        cta_label:  currentSlide.cta_label  ?? FALLBACK_TEXT.cta_label,
        cta_url:    currentSlide.cta_url    ?? FALLBACK_TEXT.cta_url,
        text_theme: currentSlide.text_theme ?? FALLBACK_TEXT.text_theme,
      }
    : FALLBACK_TEXT;

  const isDark = text.text_theme === 'dark';

  return (
    <section className="relative min-h-[55vh] md:min-h-[65vh] overflow-hidden">

      {/* ── BACKGROUND IMAGE — nunca toca o texto ── */}
      <AnimatePresence mode="sync">
        {currentSlide ? (
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute inset-0"
          >
            <picture>
              <source media="(max-width: 640px)"  srcSet={currentSlide.mobile_url} />
              <source media="(max-width: 1024px)" srcSet={currentSlide.tablet_url} />
              <img
                src={currentSlide.desktop_url}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          </motion.div>
        ) : (
          /* Fallback estático — trocar hero-bg.png por foto limpa sem texto */
          <div className="absolute inset-0">
            <img
              src="/hero-bg.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── OVERLAY DE LEGIBILIDADE ── */}
      {/* light-to-right para separar a área de texto do carro */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-r from-white/30 via-white/10 to-transparent'
            : 'bg-gradient-to-r from-black/50 via-black/20 to-transparent'
        }`}
      />

      {/* ── TEXTO HTML — sharp, vetorial, sem compressão ── */}
      <div className="relative z-10 flex items-center h-full min-h-[55vh] md:min-h-[65vh]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide?.id ?? 'fallback'}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="max-w-[520px]"
            >
              {/* Título — Oswald, sem compressão JPEG */}
              <h1
                className={`text-5xl sm:text-6xl md:text-7xl font-heading font-bold leading-[0.92] tracking-tight ${
                  isDark ? 'text-text-primary' : 'text-white drop-shadow-sm'
                }`}
              >
                {text.title}
              </h1>

              {/* Subtítulo */}
              {text.subtitle && (
                <p
                  className={`mt-4 text-base md:text-lg font-body leading-relaxed ${
                    isDark ? 'text-text-secondary' : 'text-white/85'
                  }`}
                >
                  {text.subtitle}
                </p>
              )}

              {/* CTA */}
              {text.cta_label && text.cta_url && (
                <Link
                  to={text.cta_url}
                  className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full text-base transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-float"
                >
                  {text.cta_label}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── DOTS — orange quando tema dark, branco quando tema light ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-8 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? `${isDark ? 'bg-primary' : 'bg-white'} w-8`
                  : `${isDark ? 'bg-primary/30 hover:bg-primary/50' : 'bg-white/40 hover:bg-white/60'} w-2`
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
