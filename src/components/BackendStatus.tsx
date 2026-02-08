import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className }: BackendStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await apiClient.checkHealth();
      setStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      setStatus('disconnected');
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium',
        status === 'connected' && 'bg-status-allowed/10 text-status-allowed',
        status === 'disconnected' && 'bg-status-restricted/10 text-status-restricted',
        status === 'checking' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status === 'checking' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Checking...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <Wifi className="h-3 w-3" />
          <span>Backend Connected</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Backend Offline</span>
        </>
      )}
    </div>
  );
}
