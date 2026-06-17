import React from 'react';
import { SvgIconProps } from '../../../types/svg-sprite';
import { useSvgSprite } from './svg-sprite-loader';

const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  width = '24',
  height = '24',
  fill = 'currentColor',
  stroke,
  strokeWidth,
  className = '',
  onClick,
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = false,
  ...props
}) => {
  const { isLoaded, isLoading, error } = useSvgSprite();

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style
        }}
        aria-hidden="true"
      />
    );
  }

  // Show error state
  if (error) {
    if (import.meta.env.DEV) {
      console.warn(`SVG Icon "${name}" failed to load:`, error.message);
    }
    return (
      <div
        className={`bg-red-100 border border-red-300 rounded flex items-center justify-center text-red-600 text-xs ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style
        }}
        title={`Failed to load icon: ${name}`}
        aria-label={ariaLabel ?? `Failed to load icon: ${name}`}
      >
        ?
      </div>
    );
  }

  // Show fallback if sprite not loaded
  if (!isLoaded) {
    return (
      <div
        className={`bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-600 text-xs ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style
        }}
        title={`Icon not available: ${name}`}
        aria-label={ariaLabel ?? `Icon not available: ${name}`}
      >
        ?
      </div>
    );
  }

  const svgProps: React.SVGProps<SVGSVGElement> = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    fill,
    className,
    onClick,
    style,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    role: onClick ? 'button' : 'img',
    tabIndex: onClick ? 0 : undefined,
    ...props
  };

  if (stroke) {
    svgProps.stroke = stroke;
  }
  if (strokeWidth) {
    svgProps.strokeWidth = strokeWidth;
  }

  return (
    <svg {...svgProps}>
      <use href={`#${name}`} />
    </svg>
  );
};

export default SvgIcon;
