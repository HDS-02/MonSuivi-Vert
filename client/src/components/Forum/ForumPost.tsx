import React, { useState } from 'react';
import { ForumPost, ForumComment } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle, Flag, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ForumPostProps {
  post: ForumPost;
  onVote: (vote: 'like' | 'dislike') => void;
  onComment: (content: string) => void;
  onReport?: (reason: string) => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

export function ForumPost({ post, onVote, onComment, onReport, onEdit, onDelete }: ForumPostProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newComment, setNewComment] = React.useState('');
  const [showCommentForm, setShowCommentForm] = React.useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onComment(newComment.trim());
      setNewComment('');
      setShowCommentForm(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedContent.trim() && onEdit) {
      onEdit(editedContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Avatar className="h-8 w-8">
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
          </div>
          {(user?.id === post.userId || user?.isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {user?.id === post.userId && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
                {user?.isAdmin && (
                  <DropdownMenuItem onClick={() => onReport?.('Signalé par un modérateur')}>
                    <Flag className="h-4 w-4 mr-2" />
                    Signaler
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <Badge variant="outline" className="mb-2">
            {post.category}
          </Badge>
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex space-x-2">
                <Button type="submit" size="sm">Enregistrer</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          )}
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
            className={post.userVotes[user?.id || 0] === 'like' ? 'text-blue-600' : ''}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {post.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote('dislike')}
            className={post.userVotes[user?.id || 0] === 'dislike' ? 'text-red-600' : ''}
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
          {onReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReport('Contenu inapproprié')}
            >
              <Flag className="h-4 w-4 mr-1" />
              Signaler
            </Button>
          )}
        </div>

        {showCommentForm && user && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="mb-2"
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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback>{comment.author.username[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{comment.author.username}</span>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                {(user?.id === comment.userId || user?.isAdmin) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {user?.id === comment.userId && (
                        <>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                      {user?.isAdmin && (
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Signaler
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 