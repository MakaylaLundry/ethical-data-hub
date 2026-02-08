import { useState } from 'react';
import { Building2, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const useCaseOptions = [
  { value: 'general_llm', label: 'General LLM Training' },
  { value: 'image_gen', label: 'Image Generation' },
  { value: 'research', label: 'Research' },
  { value: 'fine_tuning', label: 'Fine-tuning' },
  { value: 'other', label: 'Other' },
];

export default function CompanyProfile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [useCase, setUseCase] = useState(user?.useCase || '');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: 'Company name required',
        description: 'Please enter your company name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateProfile({
      companyName,
      useCase,
    });

    setIsSaved(true);
    toast({
      title: 'Profile updated',
      description: 'Your company profile has been saved.',
    });

    setTimeout(() => setIsSaved(false), 2000);
    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">Settings</p>
        <h1 className="font-serif text-2xl font-semibold mb-1">Company Profile</h1>
        <p className="text-muted-foreground">
          Set up your company information for compliance tracking
        </p>
      </div>

      <div className="max-w-xl">
        <div className="ink-card space-y-6">
          {/* Company Icon */}
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="p-4 rounded-sm bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-serif font-semibold">Company Details</h2>
              <p className="text-sm text-muted-foreground">
                This information helps artists understand who is using their work
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCase">Primary AI Use Case</Label>
              <Select value={useCase} onValueChange={setUseCase}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select your primary use case" />
                </SelectTrigger>
                <SelectContent>
                  {useCaseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe your AI project or company..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-sm"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
