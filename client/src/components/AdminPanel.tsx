import React, { useEffect, useState } from 'react';
import { CommunityTip, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Users, Ban, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Panneau d'administration pour les opérations de maintenance
 */
export default function AdminPanel() {
  const { toast } = useToast();
  const [pendingTips, setPendingTips] = useState<CommunityTip[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tips');

  useEffect(() => {
    if (activeTab === 'tips') {
      fetchPendingTips();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
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

  const handleUserAction = async (userId: number, action: 'ban' | 'unban' | 'promote' | 'demote') => {
    try {
      const endpoint = `/api/admin/users/${userId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de l'action ${action}`);
      }
      
      toast({
        title: 'Succès',
        description: `Action ${action} effectuée avec succès`,
      });
      
      fetchUsers();
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
      <Tabs defaultValue="tips" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tips">
            <Shield className="h-4 w-4 mr-2" />
            Modération
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips">
          <Card>
            <CardHeader>
              <CardTitle>Modération des posts</CardTitle>
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
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Liste des utilisateurs et gestion des rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {user.role}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {user.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Bannir
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'unban')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Débannir
                            </Button>
                          )}
                          {user.role === 'user' && (
                            <Button
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'promote')}
                            >
                              Promouvoir modérateur
                            </Button>
                          )}
                          {user.role === 'moderator' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'demote')}
                            >
                              Rétrograder
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}