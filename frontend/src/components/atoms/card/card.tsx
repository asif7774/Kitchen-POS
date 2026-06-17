import React, { forwardRef } from 'react';

// Main Card Component
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card Header
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col space-y-1.5 p-6 border-b border-gray-100 bg-gray-50/50 ${className}`}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`font-semibold text-lg leading-none tracking-tight text-gray-900 ${className}`}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Content
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-6 flex-1 overflow-auto ${className}`}
        {...props}
      />
    );
  }
);
CardContent.displayName = 'CardContent';

// Card Footer
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center p-6 border-t border-gray-100 bg-gray-50/50 ${className}`}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';
