import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus:ring-primary/40',
  outline:
    'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/40',
  ghost:
    'text-text-primary hover:bg-bg-secondary focus:ring-primary/40',
  danger:
    'bg-accent-red text-white hover:bg-accent-red/90 focus:ring-accent-red/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  href,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href && !disabled) {
    return (
      <Link to={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
