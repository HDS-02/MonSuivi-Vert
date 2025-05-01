import React from 'react';
import { ForumPost, ForumComment } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface ForumPostProps {
  post: ForumPost;
  onVote: (vote: 'like' | 'dislike') => void;
  onComment: (content: string) => void;
}

export function ForumPost({ post, onVote, onComment }: ForumPostProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newComment, setNewComment] = React.useState('');
  const [showCommentForm, setShowCommentForm] = React.useState(false);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(newComment);
    setNewComment('');
    setShowCommentForm(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.username[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{post.title}</CardTitle>
              <p className="text-sm text-gray-500">
                Par {post.author.username} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
          <Badge variant={post.approved ? 'default' : 'secondary'}>
            {post.approved ? 'Approuvé' : 'En attente'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge variant="outline" className="mb-2">
            {post.category}
          </Badge>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.rejected && (
          <div className="bg-red-50 p-3 rounded-md mb-4">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <p className="font-medium">Post rejeté</p>
            </div>
            <p className="text-red-600 mt-1">{post.rejectionReason}</p>
          </div>
        )}

        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote('like')}
            className={post.userVote === 'like' ? 'text-blue-600' : ''}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {post.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote('dislike')}
            className={post.userVote === 'dislike' ? 'text-red-600' : ''}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {post.dislikes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {post.comments.length} commentaires
          </Button>
        </div>

        {showCommentForm && user && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full p-2 border rounded-md mb-2"
              rows={3}
            />
            <Button type="submit" size="sm">
              Commenter
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {post.comments.map((comment) => (
            <div key={comment.id} className="border-l-2 pl-4">
              <div className="flex items-center space-x-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.username[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{comment.author.username}</span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 