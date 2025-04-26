import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useNotifications from "@/hooks/useNotifications";

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  progress: number;
  goalValue: number;
  image: string;
}

export default function useBadges() {
  const { toast } = useToast();
  const { notifyBadgeUnlocked } = useNotifications();
  
  // Récupérer tous les badges
  const { data: badges, isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/badges");
      return res.json();
    }
  });
  
  // Mettre à jour les badges liés à la collection de plantes
  const updatePlantCollectionBadges = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/badges/update-plant-collection");
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate badges query to fetch updated badges
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      // Notify user about unlocked badges
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        data.unlockedBadges.forEach((badge: Badge) => {
          // Utiliser la fonction spécifique pour les notifications de badges
          notifyBadgeUnlocked(badge.name);
          
          toast({
            title: "Nouveau badge débloqué !",
            description: `Félicitations ! Vous avez obtenu le badge "${badge.name}"`,
          });
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges:", error);
    }
  });

  // Mettre à jour les badges liés aux tâches complétées
  const updateTaskCompletionBadges = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/badges/update-tasks");
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate badges query to fetch updated badges
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      // Notify user about unlocked badges
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        data.unlockedBadges.forEach((badge: Badge) => {
          // Utiliser la fonction spécifique pour les notifications de badges
          notifyBadgeUnlocked(badge.name);
          
          toast({
            title: "Nouveau badge débloqué !",
            description: `Félicitations ! Vous avez obtenu le badge "${badge.name}"`,
          });
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges:", error);
    }
  });

  // Mettre à jour le badge de connexion consécutive
  const updateLoginStreakBadge = useMutation({
    mutationFn: async (days: number) => {
      const res = await apiRequest("POST", "/api/badges/login-streak", { days });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate badges query to fetch updated badges
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      // Notify user about unlocked badges
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        data.unlockedBadges.forEach((badge: Badge) => {
          // Utiliser la fonction spécifique pour les notifications de badges
          notifyBadgeUnlocked(badge.name);
          
          toast({
            title: "Nouveau badge débloqué !",
            description: `Félicitations ! Vous avez obtenu le badge "${badge.name}"`,
          });
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour du badge de connexion:", error);
    }
  });

  return {
    badges,
    isLoading,
    updatePlantCollectionBadges,
    updateTaskCompletionBadges,
    updateLoginStreakBadge
  };
}