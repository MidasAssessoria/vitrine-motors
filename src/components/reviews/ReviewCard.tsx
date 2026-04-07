import { StarRating } from './StarRating';
import type { Review } from '../../types';
import { formatDate } from '../../utils/formatters';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const profileName = (review as { profile?: { name?: string } }).profile?.name || 'Usuario';

  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary text-sm font-bold">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{profileName}</p>
            <p className="text-xs text-text-secondary">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>
      {review.comment && (
        <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
