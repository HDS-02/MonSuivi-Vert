import React from 'react';
import { ForumPost, ForumCategory } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { ForumPost as ForumPostComponent } from './ForumPost';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface ForumListProps {
  posts: ForumPost[];
  onVote: (postId: number, vote: 'like' | 'dislike') => void;
  onComment: (postId: number, content: string) => void;
  onApprove: (postId: number) => void;
  onReject: (postId: number, reason: string) => void;
}

export function ForumList({
  posts,
  onVote,
  onComment,
  onApprove,
  onReject,
}: ForumListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<ForumCategory | 'all'>('all');
  const [showNewPostForm, setShowNewPostForm] = React.useState(false);
  const [newPost, setNewPost] = React.useState({
    title: '',
    content: '',
    category: 'conseils' as ForumCategory,
  });

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || post.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleNewPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPost),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du post');

      toast({
        title: 'Succès',
        description: 'Votre post a été créé et est en attente de modération',
      });

      setNewPost({ title: '', content: '', category: 'conseils' });
      setShowNewPostForm(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le post',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Forum</CardTitle>
            {user && (
              <Button onClick={() => setShowNewPostForm(!showNewPostForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau post
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={category} onValueChange={(value) => setCategory(value as ForumCategory | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="conseils">Conseils</SelectItem>
                <SelectItem value="questions">Questions</SelectItem>
                <SelectItem value="partage">Partage</SelectItem>
                <SelectItem value="identification">Identification</SelectItem>
                <SelectItem value="maladies">Maladies</SelectItem>
                <SelectItem value="autres">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showNewPostForm && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <form onSubmit={handleNewPostSubmit} className="space-y-4">
                  <Input
                    placeholder="Titre"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Select
                    value={newPost.category}
                    onValueChange={(value) => setNewPost({ ...newPost, category: value as ForumCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conseils">Conseils</SelectItem>
                      <SelectItem value="questions">Questions</SelectItem>
                      <SelectItem value="partage">Partage</SelectItem>
                      <SelectItem value="identification">Identification</SelectItem>
                      <SelectItem value="maladies">Maladies</SelectItem>
                      <SelectItem value="autres">Autres</SelectItem>
                    </SelectContent>
                  </Select>
                  <textarea
                    placeholder="Contenu"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={5}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
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
            {filteredPosts.map((post) => (
              <ForumPostComponent
                key={post.id}
                post={post}
                onVote={(vote) => onVote(post.id, vote)}
                onComment={(content) => onComment(post.id, content)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 