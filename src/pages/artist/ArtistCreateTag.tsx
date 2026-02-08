import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FileDropzone } from '@/components/FileDropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { uploadArtwork, Permission } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type TrainingPermission = 'yes' | 'no' | 'conditional';

const useCases = [
  { id: 'general', label: 'General Training' },
  { id: 'fine_tuning', label: 'Fine-tuning' },
  { id: 'style_learning', label: 'Style Learning' },
  { id: 'commercial', label: 'Commercial Use' },
  { id: 'research', label: 'Research Only' },
  { id: 'other', label: 'Other' },
];

export default function ArtistCreateTag() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [trainingPermission, setTrainingPermission] = useState<TrainingPermission>('conditional');
  const [allowedUseCases, setAllowedUseCases] = useState<string[]>(['research']);
  const [otherUseCaseText, setOtherUseCaseText] = useState('');
  const [attributionRequired, setAttributionRequired] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUseCaseToggle = (useCaseId: string) => {
    setAllowedUseCases((prev) =>
      prev.includes(useCaseId)
        ? prev.filter((id) => id !== useCaseId)
        : [...prev, useCaseId]
    );
    // Clear other text when unchecking "other"
    if (useCaseId === 'other' && allowedUseCases.includes('other')) {
      setOtherUseCaseText('');
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please upload an artwork to generate a tag.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const permissions: Permission = {
        ai_training: trainingPermission,
        allowed_use_cases: trainingPermission === 'conditional' ? allowedUseCases : [],
        attribution: attributionRequired,
        notes: notes.trim() || undefined,
        other_use_case: allowedUseCases.includes('other') ? otherUseCaseText.trim() : undefined,
      };

      await uploadArtwork(files[0], permissions, user.id);

      setIsSuccess(true);
      toast({
        title: 'Security tag created!',
        description: 'Your artwork is now protected with a unique security tag.',
      });

      // Redirect after short delay
      setTimeout(() => {
        navigate('/artist/artworks');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not create security tag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
          <div className="p-4 rounded-sm bg-status-allowed/10 mb-6">
            <CheckCircle className="h-12 w-12 text-status-allowed" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Tag Created Successfully!</h2>
          <p className="text-muted-foreground mb-4">Redirecting to your artworks...</p>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <p className="ink-section-title">New Tag</p>
        <h1 className="font-serif text-2xl font-semibold mb-1">Create Security Tag</h1>
        <p className="text-muted-foreground">
          Upload your artwork and set permissions for AI training use
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-6">
          <div className="ink-card">
            <h2 className="font-serif text-lg font-semibold mb-4">Upload Artwork</h2>
            <FileDropzone
              onFilesSelected={setFiles}
              accept="image/*"
              multiple={false}
            />
          </div>
        </div>

        {/* Right: Permissions */}
        <div className="space-y-6">
          {/* Training Permission */}
          <div className="ink-card">
            <h2 className="font-serif text-lg font-semibold mb-4">AI Training Permission</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { value: 'yes', label: 'Allow', color: 'status-allowed' },
                { value: 'conditional', label: 'Conditional', color: 'status-conditional' },
                { value: 'no', label: 'Deny', color: 'status-restricted' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTrainingPermission(option.value as TrainingPermission)}
                  className={cn(
                    'py-3 px-4 rounded-sm border-2 font-medium transition-all text-sm',
                    trainingPermission === option.value
                      ? `border-${option.color} bg-${option.color}/10`
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Conditional Use Cases */}
            {trainingPermission === 'conditional' && (
              <div className="space-y-3 p-4 rounded-sm bg-accent/50 animate-fade-in">
                <Label className="text-sm font-medium">Allowed Use Cases</Label>
                <div className="grid grid-cols-2 gap-3">
                  {useCases.map((useCase) => (
                    <div key={useCase.id} className="flex items-center space-x-2">
                      {useCase.id === 'other' ? (
                        <Popover open={allowedUseCases.includes('other')}>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={useCase.id}
                              checked={allowedUseCases.includes(useCase.id)}
                              onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                            />
                            <PopoverTrigger asChild>
                              <label
                                htmlFor={useCase.id}
                                className="text-sm cursor-pointer"
                              >
                                {useCase.label}
                              </label>
                            </PopoverTrigger>
                          </div>
                          <PopoverContent className="w-80" align="start">
                            <div className="space-y-2">
                              <Label htmlFor="other-use-case" className="text-sm font-medium">
                                Specify allowed use case
                              </Label>
                              <Input
                                id="other-use-case"
                                placeholder="e.g., Educational materials only..."
                                value={otherUseCaseText}
                                onChange={(e) => setOtherUseCaseText(e.target.value)}
                                className="text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe what is allowed if not listed above
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <>
                          <Checkbox
                            id={useCase.id}
                            checked={allowedUseCases.includes(useCase.id)}
                            onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                          />
                          <label
                            htmlFor={useCase.id}
                            className="text-sm cursor-pointer"
                          >
                            {useCase.label}
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attribution */}
          <div className="ink-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Attribution Required</h3>
                <p className="text-sm text-muted-foreground">
                  Require credit when your artwork is used
                </p>
              </div>
              <Switch
                checked={attributionRequired}
                onCheckedChange={setAttributionRequired}
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={files.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Tag...
              </>
            ) : (
              <>
                <Tag className="h-4 w-4" />
                Generate Security Tag
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
