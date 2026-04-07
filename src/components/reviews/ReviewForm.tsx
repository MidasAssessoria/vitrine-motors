import { useState } from 'react';
import { Button } from '../ui/Button';
import { StarRating } from './StarRating';
import { createReview } from '../../lib/reviews';
import { CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  dealerId: string;
  listingId?: string;
  userId: string;
}

export function ReviewForm({ dealerId, listingId, userId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Selecciona una calificacion');
      return;
    }

    setLoading(true);
    setError('');

    const review = await createReview({
      user_id: userId,
      dealer_id: dealerId,
      listing_id: listingId || null,
      rating,
      comment: comment.trim(),
    });

    setLoading(false);

    if (review) {
      setSubmitted(true);
    } else {
      setError('No se pudo enviar tu resena. Quizas ya dejaste una para este vendedor.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-status-success-border bg-status-success-bg p-4 text-center">
        <CheckCircle className="w-8 h-8 text-success-green mx-auto mb-2" />
        <p className="text-sm font-medium text-text-primary">Gracias por tu resena</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Calificacion
        </label>
        <StarRating rating={rating} onChange={setRating} interactive size={24} />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuenta tu experiencia..."
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" variant="outline" size="sm" disabled={loading || rating === 0}>
        {loading ? 'Enviando...' : 'Dejar resena'}
      </Button>
    </form>
  );
}
