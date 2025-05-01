import React, { useEffect, useState } from 'react';
import { CommunityTip } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Posts du Forum</CardTitle>
        <CardDescription>
          Approuvez ou rejetez les posts du forum
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingTips.length === 0 ? (
            <p className="text-center text-gray-500">Aucun post en attente d'approbation</p>
          ) : (
            pendingTips.map((tip) => (
              <div key={tip.id} className="border rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold">{tip.title}</h3>
                <p className="text-sm text-gray-500">Catégorie: {tip.category}</p>
                <p className="text-gray-700">{tip.content}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePostAction(tip.id, 'approve')}
                    variant="default"
                  >
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handlePostAction(tip.id, 'reject')}
                    variant="destructive"
                  >
                    Rejeter
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}