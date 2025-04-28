import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThumbsUp, ThumbsDown, Calendar, User, MessageSquare, Award, ChevronLeft, Heart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Types
interface CommunityTip {
  id: number;
  title: string;
  content: string;
  userId: number;
  imageUrl: string | null;
  plantSpecies: string | null;
  tags: string[] | null;
  category: string | null;
  createdAt: Date;
  votes: number;
  rating: number;
  approved: boolean;
}

interface CommunityComment {
  id: number;
  userId: number;
  tipId: number;
  content: string;
  createdAt: Date;
  likes: number;
}

// Schéma de validation pour le formulaire de commentaire
const commentFormSchema = z.object({
  content: z.string().min(3, {
    message: "Le commentaire doit contenir au moins 3 caractères",
  }).max(1000, {
    message: "Le commentaire ne peut pas dépasser 1000 caractères",
  }),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

export default function ConseilDetail() {
  const { id } = useParams<{ id: string }>();
  const tipId = parseInt(id);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // État pour indiquer si le formulaire de commentaire est affiché
  const [isReplyFormVisible, setIsReplyFormVisible] = useState(false);
  
  // Initialisation du formulaire de commentaire
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Requête pour récupérer les détails du conseil
  const { data: tip, isLoading: isLoadingTip } = useQuery<CommunityTip>({
    queryKey: [`/api/community/tips/${tipId}`],
    queryFn: async () => {
      const res = await fetch(`/api/community/tips/${tipId}`);
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération du conseil");
      }
      return res.json();
    },
  });
  
  // Requête pour récupérer les commentaires du conseil
  const { data: comments, isLoading: isLoadingComments } = useQuery<CommunityComment[]>({
    queryKey: [`/api/community/tips/${tipId}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/community/tips/${tipId}/comments`);
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des commentaires");
      }
      return res.json();
    },
  });
  
  // Mutation pour ajouter un commentaire
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      return apiRequest("POST", `/api/community/tips/${tipId}/comments`, data);
    },
    onSuccess: () => {
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
      });
      form.reset();
      setIsReplyFormVisible(false);
      queryClient.invalidateQueries({ queryKey: [`/api/community/tips/${tipId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'ajout du commentaire: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour liker un commentaire
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("POST", `/api/community/comments/${commentId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/tips/${tipId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour voter sur le conseil
  const voteTipMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: 1 | -1 }) => {
      return apiRequest("POST", `/api/community/tips/${id}/vote`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/tips/${tipId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handler pour le vote sur un conseil
  const handleVote = (value: 1 | -1) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voter",
        variant: "destructive",
      });
      return;
    }
    
    voteTipMutation.mutate({ id: tipId, value });
  };
  
  // Handler pour liker un commentaire
  const handleLikeComment = (commentId: number) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer un commentaire",
        variant: "destructive",
      });
      return;
    }
    
    likeCommentMutation.mutate(commentId);
  };
  
  // Soumission du formulaire de commentaire
  const onSubmit = (data: CommentFormValues) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter",
        variant: "destructive",
      });
      return;
    }
    
    addCommentMutation.mutate(data);
  };
  
  // Fonction pour le formatage de la date
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };
  
  // Afficher un chargement si les données sont en cours de chargement
  if (isLoadingTip) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Afficher un message si le conseil n'existe pas
  if (!tip) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Ce conseil n'existe pas ou n'est pas accessible.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/communaute">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Retour à la communauté
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6 max-w-5xl">
      {/* Navigation */}
      <div className="mb-6 flex items-center text-sm text-muted-foreground">
        <Link href="/communaute">
          <span className="hover:text-primary hover:underline flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour au forum
          </span>
        </Link>
        <span className="mx-2">/</span>
        <span className="text-primary font-medium">Discussion</span>
      </div>
      
      {/* Thread Container */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
        {/* Thread Header */}
        <div className="p-4 bg-green-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-green-800">{tip.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(tip.createdAt)}</span>
                <span>•</span>
                <User className="h-4 w-4" />
                <span>Utilisateur #{tip.userId}</span>
                {tip.category && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="bg-white">{tip.category}</Badge>
                  </>
                )}
                
                {tip.plantSpecies && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="bg-white">Espèce: {tip.plantSpecies}</Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-md border">
              <ThumbsUp
                className={`h-4 w-4 cursor-pointer ${tip.votes > 0 ? 'text-green-600' : ''}`}
                onClick={() => handleVote(1)}
              />
              <span className="mx-1 font-medium">{tip.votes}</span>
              <ThumbsDown
                className="h-4 w-4 cursor-pointer text-red-600 hover:text-red-700"
                onClick={() => handleVote(-1)}
              />
            </div>
          </div>
        </div>
        
        {/* Original Post Content */}
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-700">
                  U{tip.userId}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-grow">
              <div className="prose max-w-none">
                {tip.imageUrl && (
                  <img 
                    src={tip.imageUrl} 
                    alt={tip.title} 
                    className="w-full max-h-96 object-cover rounded-md mb-4"
                  />
                )}
                <p className="whitespace-pre-line text-gray-700">{tip.content}</p>
              </div>
              
              {tip.tags && tip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {tip.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">#{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Replies Section */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
        <div className="px-4 py-3 bg-muted/30 flex justify-between items-center border-b">
          <h2 className="font-medium">Réponses ({comments?.length || 0})</h2>
          
          {!isReplyFormVisible && (
            <Button 
              onClick={() => setIsReplyFormVisible(true)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Répondre
            </Button>
          )}
        </div>
        
        {isLoadingComments ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="divide-y">
            {comments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-100">
                        U{comment.userId}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Utilisateur #{comment.userId}</span>
                        <span className="text-xs text-muted-foreground">• {formatDate(comment.createdAt)}</span>
                      </div>
                      
                      <button 
                        className="flex items-center gap-1 text-primary hover:text-primary-dark"
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart className={`h-4 w-4 ${comment.likes > 0 ? 'fill-primary' : ''}`} />
                        <span className="text-xs">{comment.likes > 0 ? comment.likes : ""}</span>
                      </button>
                    </div>
                    
                    <p className="whitespace-pre-line text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Aucune réponse pour le moment</p>
            <p className="text-sm">Soyez le premier à répondre à cette discussion</p>
          </div>
        )}
        
        {/* Reply Form */}
        {isReplyFormVisible && (
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user ? user.username.substring(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-grow">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Répondez à cette discussion..." 
                              className="min-h-[120px] bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsReplyFormVisible(false)}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addCommentMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {addCommentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : "Publier la réponse"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Related or Popular Discussions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-medium mb-4">À explorer aussi</h3>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/communaute">
            <div className="p-3 rounded-md border hover:bg-muted/20 cursor-pointer">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-green-700">Toutes les discussions</h4>
                <ChevronLeft className="h-4 w-4 transform rotate-180" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Explorez toutes les discussions de la communauté
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}