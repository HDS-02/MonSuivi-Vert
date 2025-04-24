import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function useBadges() {
  const { toast } = useToast();
  
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
  });

  // Mettre à jour les badges liés à la collection de plantes
  const updatePlantCollectionBadges = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/badges/update-plant-collection");
      return response.json();
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        // Notifier l'utilisateur des nouveaux badges débloqués
        data.unlockedBadges.forEach(badge => {
          toast({
            title: "🏆 Nouveau badge débloqué !",
            description: `${badge.name} - ${badge.description}`
          });
        });
      }
      
      if (data.updatedBadge) {
        // Progression d'un badge mise à jour
        toast({
          title: "🔝 Progression de badge mise à jour",
          description: `${data.updatedBadge.name} - ${data.updatedBadge.progress}/${data.updatedBadge.maxProgress}`
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges de collection:", error);
    },
  });

  // Mettre à jour les badges liés aux tâches
  const updateTaskBadges = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/badges/update-tasks");
      return response.json();
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        // Notifier l'utilisateur des nouveaux badges débloqués
        data.unlockedBadges.forEach(badge => {
          toast({
            title: "🏆 Nouveau badge débloqué !",
            description: `${badge.name} - ${badge.description}`
          });
        });
      }
      
      if (data.updatedBadge) {
        // Progression d'un badge mise à jour
        toast({
          title: "🔝 Progression de badge mise à jour",
          description: `${data.updatedBadge.name} - ${data.updatedBadge.progress}/${data.updatedBadge.maxProgress}`
        });
      }
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la mise à jour des badges de tâches:", error);
    },
  });

  // Mettre à jour le badge de connexion consécutive
  const updateLoginStreakBadge = useMutation({
    mutationFn: async (days: number) => {
      const response = await apiRequest("POST", "/api/badges/login-streak", { days });
      return response.json();
    },
    onSuccess: (data: { unlockedBadges?: Badge[]; updatedBadge?: Badge }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      
      if (data.unlockedBadges && data.unlockedBadges.length > 0) {
        // Notifier l'utilisateur des nouveaux badges débloqués
        data.unlockedBadges.forEach(badge => {
          toast({
            title: "🏆 Nouveau badge débloqué !",
            description: `${badge.name} - ${badge.description}`
          });
        });
      }
      
      if (data.updatedBadge) {
        // Progression d'un badge mise à jour
        toast({
          title: "🔝 Progression de badge mise à jour",
          description: `${data.updatedBadge.name} - ${data.updatedBadge.progress}/${data.updatedBadge.maxProgress}`
        });
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