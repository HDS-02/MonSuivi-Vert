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
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/communaute">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour à la communauté
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{tip.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(tip.createdAt)}</span>
                <span className="mx-1">•</span>
                <User className="h-4 w-4" />
                <span>Utilisateur #{tip.userId}</span>
                {tip.category && (
                  <>
                    <span className="mx-1">•</span>
                    <Badge variant="secondary">{tip.category}</Badge>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>{tip.rating.toFixed(1)}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{tip.votes}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {tip.imageUrl && (
              <img 
                src={tip.imageUrl} 
                alt={tip.title} 
                className="w-full max-h-96 object-cover rounded-md mb-4"
              />
            )}
            <p className="whitespace-pre-line">{tip.content}</p>
          </div>
          
          {tip.plantSpecies && (
            <div className="mt-4">
              <Badge variant="outline">Espèce: {tip.plantSpecies}</Badge>
            </div>
          )}
          
          {tip.tags && tip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {tip.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="flex items-center gap-1"
              onClick={() => handleVote(1)}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Utile</span>
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => handleVote(-1)}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Non utile</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Separator className="my-8" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Commentaires ({comments?.length || 0})</h2>
          {!isReplyFormVisible && (
            <Button onClick={() => setIsReplyFormVisible(true)}>
              Ajouter un commentaire
            </Button>
          )}
        </div>
        
        {isReplyFormVisible && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajouter un commentaire</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Partagez votre avis ou posez une question..." 
                            className="min-h-[100px]"
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
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi...
                        </>
                      ) : "Publier"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {isLoadingComments ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <Avatar>
                        <AvatarFallback>{comment.userId.toString().substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Utilisateur #{comment.userId}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{comment.content}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    <Heart className="h-4 w-4" />
                    <span>{comment.likes > 0 ? comment.likes : ""}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Aucun commentaire pour l'instant. Soyez le premier à commenter !</p>
          </div>
        )}
      </div>
    </div>
  );
}