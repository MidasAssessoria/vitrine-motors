import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary bg-bg transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] ${
            error
              ? 'border-accent-red focus:border-accent-red'
              : 'border-border focus:border-primary'
          } ${className}`}
          {...rest}
        />
        {error && (
          <p className="text-xs text-accent-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
