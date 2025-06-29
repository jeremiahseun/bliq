import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`font-display font-bold ${sizeClasses[size]} ${className}`}>
      <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        Bliq
      </span>
    </div>
  );
};

export default Logo;