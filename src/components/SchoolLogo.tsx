import React, { useState } from 'react';

interface SchoolLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customSrc?: string;
  alt?: string;
}

export default function SchoolLogo({
  className = '',
  imgClassName = '',
  size = 'md',
  customSrc,
  alt = 'Logo SMP Negeri 3 Kras'
}: SchoolLogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
    custom: ''
  };

  // Primary source is vector SVG, fallback to JPG
  const primarySrc = customSrc || (hasError ? '/logo.jpg' : '/logo.svg');

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${size !== 'custom' ? sizeMap[size] : ''} ${className}`}>
      <img
        src={primarySrc}
        alt={alt}
        className={`w-full h-full object-contain filter drop-shadow-md select-none transition-transform duration-200 ${imgClassName}`}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
