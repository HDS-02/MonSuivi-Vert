import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function useBadges() {
  const { toast } = useToast();
  
  // Pour limiter les notifications de badges
  const showBadgeNotification = () => {
    const lastTime = localStorage.getItem('lastBadgeNotification');
    if (!lastTime) {
      localStorage.setItem('lastBadgeNotification', Date.now().toString());
      return true;
    }
    
    // Attendre au moins 5 secondes entre les notifications
    const cooldownPeriod = 5000;
    const now = Date.now();
    const lastNotification = parseInt(lastTime);
    
    if (now - lastNotification > cooldownPeriod) {
      localStorage.setItem('lastBadgeNotification', now.toString());
      return true;
    }
    
    return false;
  };
  
  // Fonction de notification groupée pour les badges
  const notifyBadges = (badges: Badge[]) => {
    if (!badges || !badges.length || !showBadgeNotification()) {
      return;
    }
    
    if (badges.length === 1) {
      toast({
        title: "🏆 Nouveau badge débloqué !",
        description: `${badges[0].name} - ${badges[0].description}`
      });
    } else {
      toast({
        title: "🏆 Nouveaux badges débloqués !",
        description: `Vous avez débloqué ${badges.length} nouveaux badges`
      });
    }
  };
  
  // Récupérer tous les badges
  const {
    data: badges = [],
    isLoading: isBadgesLoading,
    isError: isBadgesError,
    error: badgesError,
  } = useQuery({
    queryKey: ["/api/badges"],
    // La requête est autorisée à échouer silencieusement si l'utilisateur n'est pas connecté
    retry: 1,
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0]);
        if (!response.ok) {
          if (response.status === 401) {
            // Si non authentifié, retourner un tableau vide plutôt que de lancer une erreur
            return [];
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la récupération des badges", error);
        return [];
      }
    }
  });

  // Mettre à jour les badges liés à la collection de plantes
  const updatePlantCollectionBadges = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/badges/update-plant-collection");
        if (!response.ok) {
          if (response.status === 401) {
            // Si non authentifié, retourner un objet vide plutôt que de lancer une erreur
            return { unlockedBadges: [] };
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la mise à jour des badges de collection:", error);
        return { unlockedBadges: [] };
      }
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data && data.unlockedBadges && data.unlockedBadges.length > 0) {
        notifyBadges(data.unlockedBadges);
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges de collection:", error);
    },
  });

  // Mettre à jour les badges liés aux tâches
  const updateTaskBadges = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/badges/update-tasks");
        if (!response.ok) {
          if (response.status === 401) {
            // Si non authentifié, retourner un objet vide plutôt que de lancer une erreur
            return { unlockedBadges: [] };
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la mise à jour des badges de tâches:", error);
        return { unlockedBadges: [] };
      }
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data && data.unlockedBadges && data.unlockedBadges.length > 0) {
        notifyBadges(data.unlockedBadges);
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges de tâches:", error);
    },
  });

  // Mettre à jour le badge de connexion consécutive
  const updateLoginStreakBadge = useMutation({
    mutationFn: async (days: number) => {
      try {
        const response = await apiRequest("POST", "/api/badges/login-streak", { days });
        if (!response.ok) {
          if (response.status === 401) {
            // Si non authentifié, retourner un objet vide plutôt que de lancer une erreur
            return { unlockedBadges: [] };
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du badge de connexion:", error);
        return { unlockedBadges: [] };
      }
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data && data.unlockedBadges && data.unlockedBadges.length > 0) {
        notifyBadges(data.unlockedBadges);
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour du badge de connexion:", error);
    },
  });

  // Filtrer les badges par catégorie
  const getBadgesByCategory = (category: string) => {
    if (!badges) return [];
    return badges.filter((badge: Badge) => badge.category === category);
  };

  // Obtenir les badges débloqués
  const getUnlockedBadges = () => {
    if (!badges) return [];
    return badges.filter((badge: Badge) => badge.unlocked);
  };

  // Obtenir les badges en cours de progression
  const getInProgressBadges = () => {
    if (!badges) return [];
    return badges.filter(
      (badge: Badge) => 
        !badge.unlocked && 
        badge.progress !== undefined && 
        badge.maxProgress !== undefined &&
        badge.progress > 0
    );
  };

  return {
    badges,
    isBadgesLoading,
    isBadgesError,
    badgesError,
    updatePlantCollectionBadges,
    updateTaskBadges,
    updateLoginStreakBadge,
    getBadgesByCategory,
    getUnlockedBadges,
    getInProgressBadges,
  };
}