import { type ReactNode } from 'react';

type BadgeVariant = 'featured' | 'verified' | 'new' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  featured: 'bg-primary/15 text-primary',
  verified: 'bg-verified-blue/15 text-verified-blue',
  new: 'bg-success-green/15 text-success-green',
  default: 'bg-bg-secondary text-text-secondary',
};

export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
