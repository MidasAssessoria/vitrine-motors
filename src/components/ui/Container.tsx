import { forwardRef } from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Container = forwardRef<HTMLElement, ContainerProps>(
  ({ children, className = '', as: Tag = 'div', ...rest }, ref) => (
    <Tag
      ref={ref}
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
);

Container.displayName = 'Container';
