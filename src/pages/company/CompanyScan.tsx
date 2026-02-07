import { useState } from 'react';
import { ScanLine, Loader2, FileCheck, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FileDropzone } from '@/components/FileDropzone';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { scanDataset, generateAgreement, ScanResult, ScanResultItem } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function CompanyScan() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  // Agreement modal state
  const [selectedItem, setSelectedItem] = useState<ScanResultItem | null>(null);
  const [agreementText, setAgreementText] = useState('');
  const [isGeneratingAgreement, setIsGeneratingAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const handleScan = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload files to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await scanDataset(files);
      setScanResult(result);
      toast({
        title: 'Scan complete',
        description: `Found ${result.total_files} files with ${result.restricted} restricted and ${result.conditional} conditional items.`,
      });
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: 'Could not complete the scan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateAgreement = async (item: ScanResultItem) => {
    setSelectedItem(item);
    setShowAgreementModal(true);
    setIsGeneratingAgreement(true);
    setAgreementText('');

    try {
      const text = await generateAgreement(item.tag_id, 'Your Company', 'AI Training');
      setAgreementText(text);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not generate agreement.',
        variant: 'destructive',
      });
      setShowAgreementModal(false);
    } finally {
      setIsGeneratingAgreement(false);
    }
  };

  const handleAcceptAgreement = () => {
    if (selectedItem && scanResult) {
      // Update the item status to allowed
      const updatedItems = scanResult.items.map(item =>
        item.tag_id === selectedItem.tag_id
          ? { ...item, status: 'allowed' as const }
          : item
      );
      setScanResult({
        ...scanResult,
        items: updatedItems,
        conditional: scanResult.conditional - 1,
        safe_to_use: scanResult.safe_to_use + 1,
      });
      
      toast({
        title: 'Agreement accepted',
        description: `You can now use ${selectedItem.file_name} in your dataset.`,
      });
    }
    setShowAgreementModal(false);
  };

  const handleRemoveFile = (item: ScanResultItem) => {
    if (scanResult) {
      const updatedItems = scanResult.items.filter(i => i.tag_id !== item.tag_id);
      const removedStatus = item.status;
      
      setScanResult({
        ...scanResult,
        items: updatedItems,
        total_files: scanResult.total_files - 1,
        safe_to_use: removedStatus === 'allowed' ? scanResult.safe_to_use - 1 : scanResult.safe_to_use,
        restricted: removedStatus === 'restricted' ? scanResult.restricted - 1 : scanResult.restricted,
        conditional: removedStatus === 'conditional' ? scanResult.conditional - 1 : scanResult.conditional,
      });
      
      toast({
        title: 'File removed',
        description: `${item.file_name} has been removed from your dataset.`,
      });
    }
  };

  const resetScan = () => {
    setFiles([]);
    setScanResult(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Scan Dataset</h1>
        <p className="text-muted-foreground">
          Upload files to check for compliance with artist permissions
        </p>
      </div>

      {/* Main content */}
      {!scanResult ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="ink-card">
            <h2 className="text-lg font-semibold mb-4">Upload Dataset</h2>
            <FileDropzone
              onFilesSelected={setFiles}
              accept="image/*,.zip"
              multiple
              maxFiles={50}
            />
          </div>

          {files.length > 0 && (
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hashing & Scanning...
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  Scan {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="ink-card text-center">
              <p className="text-3xl font-bold text-foreground">{scanResult.total_files}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
            <div className="ink-card text-center">
              <p className="text-3xl font-bold text-status-allowed">{scanResult.safe_to_use}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <FileCheck className="h-4 w-4" /> Safe to Use
              </p>
            </div>
            <div className="ink-card text-center">
              <p className="text-3xl font-bold text-status-conditional">{scanResult.conditional}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Conditional
              </p>
            </div>
            <div className="ink-card text-center">
              <p className="text-3xl font-bold text-status-restricted">{scanResult.restricted}</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <XCircle className="h-4 w-4" /> Restricted
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="ink-card overflow-hidden p-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Scan Results</h2>
              <Button variant="outline" size="sm" onClick={resetScan}>
                New Scan
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Filename
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Artist
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scanResult.items.map((item) => (
                    <tr key={item.tag_id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm">{item.file_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.artist_name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'conditional' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleGenerateAgreement(item)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Agreement
                          </Button>
                        )}
                        {item.status === 'restricted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleRemoveFile(item)}
                          >
                            Remove
                          </Button>
                        )}
                        {item.status === 'allowed' && (
                          <span className="text-sm text-status-allowed font-medium">
                            ✓ Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Agreement Modal */}
      <Dialog open={showAgreementModal} onOpenChange={setShowAgreementModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Data Use Agreement</DialogTitle>
            <DialogDescription>
              Review and accept the agreement to use {selectedItem?.file_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-accent/30 rounded-lg font-mono text-sm whitespace-pre-wrap">
            {isGeneratingAgreement ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Generating agreement...</span>
              </div>
            ) : (
              agreementText
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAgreementModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedItem && handleRemoveFile(selectedItem)}
            >
              Remove File
            </Button>
            <Button onClick={handleAcceptAgreement} disabled={isGeneratingAgreement}>
              Accept Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
