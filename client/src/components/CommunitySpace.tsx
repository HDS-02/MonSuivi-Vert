import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Share2, Flag } from 'lucide-react';
import { CommunitySpacePost, CommunitySpaceComment } from '@shared/schema';

export default function CommunitySpace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunitySpacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'conseils'
  });
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/community/posts', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des posts');
      }
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPost),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du post');
      }
      
      toast({
        title: 'Succès',
        description: 'Votre post a été créé et est en attente de modération',
      });
      
      setNewPost({ title: '', content: '', category: 'conseils' });
      setShowNewPostForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le post',
        variant: 'destructive',
      });
    }
  };

  const handleVote = async (postId: number, vote: 'like' | 'dislike') => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vote }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du vote');
      }
      
      fetchPosts();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer votre vote',
        variant: 'destructive',
      });
    }
  };

  const handleReport = async (postId: number) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/report`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du signalement');
      }
      
      toast({
        title: 'Succès',
        description: 'Le post a été signalé aux modérateurs',
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de signaler le post',
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
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Espace Communautaire</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <Button onClick={() => setShowNewPostForm(true)}>
              Nouveau partage
            </Button>
          ) : (
            <p className="text-center text-muted-foreground">
              Connectez-vous pour partager vos expériences
            </p>
          )}
        </CardContent>
      </Card>

      {showNewPostForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Input
                placeholder="Titre"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
              />
              <Select
                value={newPost.category}
                onValueChange={(value) => setNewPost({ ...newPost, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conseils">Conseils</SelectItem>
                  <SelectItem value="experiences">Expériences</SelectItem>
                  <SelectItem value="questions">Questions</SelectItem>
                  <SelectItem value="astuces">Astuces</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Partagez votre expérience..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
                className="min-h-[150px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewPostForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Publier</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Par {post.author.username} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, 'like')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, 'dislike')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      {post.dislikes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post.comments.length}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReport(post.id)}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Signaler
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 