import { useAccessibility } from '@/contexts/AccessibilityContext';
import logoLight from '@/assets/logo-light.png';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showWordmark = true, size = 'md' }: LogoProps) {
  const { theme } = useAccessibility();
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };

  const wordmarkSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  // The logo is white on black - in light mode we invert it, in dark mode we use it as-is
  const shouldInvert = theme === 'light';

  return (
    <div className={cn('ink-masthead', className)}>
      <img 
        src={logoLight} 
        alt="Inkscape" 
        className={cn(
          sizeClasses[size],
          'w-auto transition-all duration-200',
          shouldInvert && 'invert'
        )}
      />
      {showWordmark && (
        <span className={cn(
          'font-serif font-semibold tracking-tight',
          wordmarkSizes[size]
        )}>
          Inkscape
        </span>
      )}
    </div>
  );
}

// Minimal icon-only version for tight spaces
export function LogoIcon({ className, size = 'md' }: Omit<LogoProps, 'showWordmark'>) {
  return <Logo className={className} size={size} showWordmark={false} />;
}
