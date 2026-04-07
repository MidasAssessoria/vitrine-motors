import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface PhotoLightboxProps {
  photos: { url: string; id: string }[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function PhotoLightbox({ photos, currentIndex, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const photo = photos[currentIndex];
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/95">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div className="w-full h-full flex items-center justify-center p-16 sm:p-20">
        <img
          src={photo.url}
          alt={`Foto ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Thumbnails strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1 px-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                // navigate to index via parent callbacks
                const diff = i - currentIndex;
                for (let d = 0; d < Math.abs(diff); d++) diff > 0 ? onNext() : onPrev();
              }}
              className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors cursor-pointer ${
                i === currentIndex ? 'border-primary' : 'border-white/20 hover:border-white/50'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

// Trigger badge to show on hoverable images
export function ZoomBadge() {
  return (
    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
      <ZoomIn size={12} />
      Ver fotos
    </div>
  );
}
