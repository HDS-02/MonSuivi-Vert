import React from 'react';
import { ForumList } from '@/components/Forum/ForumList';
import { ForumPost } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function Forum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<ForumPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/forum/posts', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les posts du forum',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: number, vote: 'like' | 'dislike') => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vote }),
      });

      if (!response.ok) throw new Error('Erreur lors du vote');

      const updatedPost = await response.json();
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de voter pour ce post',
        variant: 'destructive',
      });
    }
  };

  const handleComment = async (postId: number, content: string) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout du commentaire');

      const updatedPost = await response.json();
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (postId: number) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erreur lors de l\'approbation');

      const updatedPost = await response.json();
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));

      toast({
        title: 'Succès',
        description: 'Post approuvé avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver le post',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (postId: number, reason: string) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Erreur lors du rejet');

      const updatedPost = await response.json();
      setPosts(posts.map(post => 
        post.id === postId ? updatedPost : post
      ));

      toast({
        title: 'Succès',
        description: 'Post rejeté avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le post',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ForumList
        posts={posts}
        onVote={handleVote}
        onComment={handleComment}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
} 