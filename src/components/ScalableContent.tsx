import { ReactNode } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cn } from '@/lib/utils';

interface ScalableContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps content that should scale with the accessibility text size setting.
 * The slider and accessibility panel are NOT wrapped, so they remain stable.
 */
export function ScalableContent({ children, className }: ScalableContentProps) {
  const { textScale } = useAccessibility();

  return (
    <div
      className={cn('scalable-content', className)}
      style={{
        fontSize: `${textScale}rem`,
        transition: 'font-size 0.15s ease-out',
      }}
    >
      {children}
    </div>
  );
}