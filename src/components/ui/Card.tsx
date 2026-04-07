import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-bg border border-border shadow-card ${
        hover ? 'transition-shadow duration-300 hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
