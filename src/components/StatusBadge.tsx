import { cn } from '@/lib/utils';

type Status = 'allowed' | 'restricted' | 'conditional' | 'yes' | 'no';

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<Status, { label: string; className: string; icon: string }> = {
  allowed: {
    label: 'Allowed',
    className: 'bg-status-allowed text-status-allowed-foreground',
    icon: '✓',
  },
  yes: {
    label: 'Allowed',
    className: 'bg-status-allowed text-status-allowed-foreground',
    icon: '✓',
  },
  conditional: {
    label: 'Conditional',
    className: 'bg-status-conditional text-status-conditional-foreground',
    icon: '~',
  },
  restricted: {
    label: 'Restricted',
    className: 'bg-status-restricted text-status-restricted-foreground',
    icon: '✕',
  },
  no: {
    label: 'Restricted',
    className: 'bg-status-restricted text-status-restricted-foreground',
    icon: '✕',
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && (
        <span className="font-bold" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  );
}
