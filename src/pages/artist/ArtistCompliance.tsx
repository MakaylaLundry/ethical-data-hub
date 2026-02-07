import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { getComplianceLogs, ComplianceLog } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function ArtistCompliance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getComplianceLogs(user.id);
      setLogs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load compliance logs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOutcomeStatus = (outcome: string): 'allowed' | 'restricted' | 'conditional' => {
    switch (outcome) {
      case 'allowed':
        return 'allowed';
      case 'removed':
        return 'restricted';
      case 'agreement_accepted':
        return 'conditional';
      default:
        return 'conditional';
    }
  };

  const getOutcomeLabel = (outcome: string): string => {
    switch (outcome) {
      case 'allowed':
        return 'Allowed';
      case 'removed':
        return 'Removed';
      case 'agreement_accepted':
        return 'Agreement Accepted';
      default:
        return outcome;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Compliance Logs</h1>
        <p className="text-muted-foreground">
          Track how companies are using your artwork
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="ink-card text-center py-16">
          <div className="p-4 rounded-full bg-accent inline-block mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No compliance logs yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            When companies scan datasets containing your tagged artwork, you'll see the activity here.
          </p>
        </div>
      ) : (
        <div className="ink-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Artwork
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Use Case
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium">{log.company_name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.artwork_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent">
                        {log.use_case}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getOutcomeStatus(log.outcome)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
