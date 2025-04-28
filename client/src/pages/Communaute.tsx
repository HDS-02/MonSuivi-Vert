import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Calendar, User, MessageSquare, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import NewTipDialog from "@/components/NewTipDialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Type pour les conseils communautaires
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

// Type pour les catégories
type Category = {
  id: string;
  name: string;
  description: string;
};

// Liste des catégories disponibles
const categories: Category[] = [
  { id: "entretien", name: "Entretien", description: "Conseils pour l'entretien quotidien des plantes" },
  { id: "maladies", name: "Maladies", description: "Identification et traitement des maladies" },
  { id: "multiplication", name: "Multiplication", description: "Méthodes pour multiplier vos plantes" },
  { id: "decoration", name: "Décoration", description: "Idées pour mettre en valeur vos plantes" },
  { id: "saisons", name: "Saisons", description: "Conseils spécifiques aux saisons" },
];

export default function Communaute() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewTipDialogOpen, setIsNewTipDialogOpen] = useState(false);
  
  // Requête pour récupérer tous les conseils communautaires
  const { data: tips, isLoading, error, refetch } = useQuery<CommunityTip[]>({
    queryKey: ["/api/community/tips", selectedCategory, searchQuery],
    queryFn: async () => {
      let url = "/api/community/tips";
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      } else if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des conseils");
      }
      return res.json();
    },
  });
  
  // Récupérer les conseils populaires
  const { data: popularTips, isLoading: isLoadingPopular } = useQuery<CommunityTip[]>({
    queryKey: ["/api/community/tips/popular"],
    queryFn: async () => {
      const res = await fetch("/api/community/tips/popular?limit=5");
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des conseils populaires");
      }
      return res.json();
    },
  });
  
  // Handler pour le vote sur un conseil
  const handleVote = async (tipId: number, value: 1 | -1) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour voter sur un conseil",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const res = await fetch(`/api/community/tips/${tipId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });
      
      if (!res.ok) {
        throw new Error("Erreur lors du vote");
      }
      
      // Rafraîchir les données
      refetch();
      
      toast({
        title: "Vote enregistré",
        description: value === 1 ? "Merci pour votre vote positif !" : "Merci pour votre retour !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du vote",
        variant: "destructive",
      });
    }
  };
  
  // Fonction pour le formatage de la date
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };
  
  // Rendu des conseils
  const renderTips = (tipsToRender: CommunityTip[] | undefined) => {
    if (!tipsToRender || tipsToRender.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Aucun conseil trouvé</p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tipsToRender.map((tip) => (
          <Card key={tip.id} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{tip.title}</CardTitle>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>{tip.rating.toFixed(1)}</span>
                </div>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(tip.createdAt)}</span>
                <span className="mx-1">•</span>
                <User className="h-4 w-4" />
                <span>Utilisateur #{tip.userId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="line-clamp-3">{tip.content}</p>
              {tip.tags && tip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {tip.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
              {tip.category && (
                <Badge className="mt-2" variant="secondary">{tip.category}</Badge>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleVote(tip.id, 1)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{tip.votes > 0 ? tip.votes : ""}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleVote(tip.id, -1)}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => window.location.href = `/communaute/${tip.id}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Commentaires</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Communauté</h1>
          <Button onClick={() => setIsNewTipDialogOpen(true)}>
            Partager un conseil
          </Button>
        </div>
        
        <Tabs defaultValue="tous" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="tous" onClick={() => setSelectedCategory(null)}>
                Tous les conseils
              </TabsTrigger>
              <TabsTrigger value="populaires">
                Populaires
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="px-4 py-2 rounded-md border border-input bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && refetch()}
              />
            </div>
          </div>
          
          <TabsContent value="tous" className="space-y-4">
            {isLoading ? (
              <div className="text-center p-8">
                <p>Chargement des conseils...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-destructive">
                <p>Erreur lors du chargement des conseils</p>
              </div>
            ) : (
              renderTips(tips)
            )}
          </TabsContent>
          
          <TabsContent value="populaires" className="space-y-4">
            {isLoadingPopular ? (
              <div className="text-center p-8">
                <p>Chargement des conseils populaires...</p>
              </div>
            ) : (
              renderTips(popularTips)
            )}
          </TabsContent>
          
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {isLoading ? (
                <div className="text-center p-8">
                  <p>Chargement des conseils...</p>
                </div>
              ) : (
                renderTips(tips?.filter(tip => tip.category === category.id))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <NewTipDialog 
        open={isNewTipDialogOpen} 
        onOpenChange={setIsNewTipDialogOpen}
        onSuccess={() => {
          refetch();
          setIsNewTipDialogOpen(false);
        }}
        categories={categories}
      />
    </div>
  );
}