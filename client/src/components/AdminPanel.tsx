import React, { useEffect, useState } from 'react';
import { CommunityTip } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Panneau d'administration pour les opérations de maintenance
 */
export default function AdminPanel() {
  const { toast } = useToast();
  const [pendingTips, setPendingTips] = useState<CommunityTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTips();
  }, []);

  const fetchPendingTips = async () => {
    try {
      const response = await fetch('/api/community/tips/pending', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des posts');
      }
      
      const data = await response.json();
      setPendingTips(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les posts du forum',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostAction = async (tipId: number, action: 'approve' | 'reject') => {
    try {
      const endpoint = `/api/community/tips/${tipId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de l'action ${action}`);
      }
      
      toast({
        title: 'Succès',
        description: `Post ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      });
      
      fetchPendingTips();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: `Impossible d'effectuer l'action ${action}`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Panneau d'administration</CardTitle>
          <CardDescription>
            Gestion des posts en attente de modération
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTips.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucun post en attente de modération
            </p>
          ) : (
            <div className="space-y-4">
              {pendingTips.map((tip) => (
                <Card key={tip.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Posté {formatDistanceToNow(tip.createdAt || new Date(), { addSuffix: true, locale: fr })}
                        </p>
                        <p className="mt-2">{tip.content}</p>
                        {tip.category && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                            {tip.category}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePostAction(tip.id, 'reject')}
                        >
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePostAction(tip.id, 'approve')}
                        >
                          Approuver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}