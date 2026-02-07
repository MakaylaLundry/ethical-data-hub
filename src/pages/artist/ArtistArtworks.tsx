import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Image as ImageIcon, Tag, Trash2, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { getArtworks, revokeTag, ArtworkTag } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ArtistArtworks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [artworks, setArtworks] = useState<ArtworkTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getArtworks(user.id);
      setArtworks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load artworks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (tagId: string) => {
    setDeletingId(tagId);
    try {
      await revokeTag(tagId);
      setArtworks(artworks.filter(a => a.tag_id !== tagId));
      toast({
        title: 'Tag revoked',
        description: 'The security tag has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not revoke tag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Artworks</h1>
          <p className="text-muted-foreground">
            Manage your tagged artworks and permissions
          </p>
        </div>
        <Link to="/artist/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Tag
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : artworks.length === 0 ? (
        <div className="ink-card text-center py-16">
          <div className="p-4 rounded-full bg-accent inline-block mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No artworks yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your first artwork and generate a security tag to protect it from unauthorized AI training.
          </p>
          <Link to="/artist/create">
            <Button className="gap-2">
              <Tag className="h-4 w-4" />
              Create your first tag
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="ink-card-hover group">
              {/* Image Preview */}
              <div className="aspect-video rounded-lg bg-accent overflow-hidden mb-4">
                <img
                  src={artwork.file_url}
                  alt={artwork.file_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{artwork.file_name}</h3>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {artwork.tag_id}
                    </p>
                  </div>
                  <StatusBadge status={artwork.permissions.ai_training} />
                </div>

                {/* Permissions summary */}
                {artwork.permissions.ai_training === 'conditional' && (
                  <div className="flex flex-wrap gap-1">
                    {artwork.permissions.allowed_use_cases.map((useCase) => (
                      <span
                        key={useCase}
                        className="px-2 py-0.5 text-xs rounded bg-accent text-muted-foreground"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Created {new Date(artwork.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={deletingId === artwork.tag_id}
                      >
                        {deletingId === artwork.tag_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke security tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the security tag from "{artwork.file_name}". 
                          Companies will no longer be able to verify permissions for this artwork.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevoke(artwork.tag_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoke tag
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
