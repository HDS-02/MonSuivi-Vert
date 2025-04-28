import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Calendar, MessageSquare, User, Search, Filter, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import NewTipDialog from "@/components/NewTipDialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

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
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
          <p className="mt-2 text-muted-foreground">Aucun conseil trouvé</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setIsNewTipDialogOpen(true)}
          >
            Créer le premier sujet
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Discussions</h2>
            <p className="text-sm text-muted-foreground">{tipsToRender.length} conseil(s) disponible(s)</p>
          </div>
          <Button 
            onClick={() => setIsNewTipDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer un sujet
          </Button>
        </div>
        
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border">
          <div className="px-4 py-3 bg-muted/30 flex justify-between">
            <div className="w-7/12 md:w-8/12 font-medium">Sujet</div>
            <div className="w-2/12 text-center hidden md:block font-medium">Réponses</div>
            <div className="w-3/12 md:w-2/12 text-center font-medium">Activité</div>
          </div>
          
          <div className="divide-y">
            {tipsToRender.map((tip) => (
              <div key={tip.id} className="px-4 py-4 flex justify-between items-center hover:bg-muted/10">
                <div className="w-7/12 md:w-8/12">
                  <Link href={`/communaute/${tip.id}`}>
                    <a className="font-medium text-primary hover:underline block">{tip.title}</a>
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        U{tip.userId}
                      </AvatarFallback>
                    </Avatar>
                    <span>Utilisateur #{tip.userId}</span>
                    <span>•</span>
                    <span>{formatDate(tip.createdAt)}</span>
                    
                    {tip.category && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {tip.category}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="w-2/12 text-center hidden md:block">
                  <div className="text-sm font-medium text-gray-700">0</div>
                  <div className="text-xs text-muted-foreground">commentaires</div>
                </div>
                
                <div className="w-3/12 md:w-2/12 flex justify-end md:justify-center items-center gap-3">
                  <div className="flex items-center">
                    <button 
                      className="text-green-600 hover:text-green-700 p-1"
                      onClick={() => handleVote(tip.id, 1)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <span className="mx-1 text-sm font-medium">{tip.votes}</span>
                    <button 
                      className="text-red-600 hover:text-red-700 p-1"
                      onClick={() => handleVote(tip.id, -1)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <Link href={`/communaute/${tip.id}`}>
                    <a className="text-primary hover:text-primary-dark">
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-800">Forum - Mon Espace Vert</h1>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher dans le forum..."
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background focus-visible:ring-1 focus-visible:ring-green-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && refetch()}
                />
              </div>
            </div>
            
            <div className="relative">
              <select
                className="pl-10 pr-8 py-2 rounded-md border border-input bg-background w-full md:w-auto appearance-none"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des discussions...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm text-destructive">
              <p>Erreur lors du chargement des discussions</p>
            </div>
          ) : (
            renderTips(tips)
          )}
        </div>
        
        {/* Section populaire */}
        {popularTips && popularTips.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Discussions populaires</h2>
            <div className="space-y-4">
              {popularTips.slice(0, 3).map((tip) => (
                <div key={tip.id} className="flex items-start gap-3">
                  <Avatar className="mt-0.5">
                    <AvatarFallback>U{tip.userId}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/communaute/${tip.id}`}>
                      <a className="font-medium text-green-800 hover:text-green-700 hover:underline">{tip.title}</a>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tip.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(tip.createdAt)}</span>
                      <span>•</span>
                      <div className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span>{tip.votes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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