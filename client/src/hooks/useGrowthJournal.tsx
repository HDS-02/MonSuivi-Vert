import { useQuery, useMutation } from "@tanstack/react-query";
import { GrowthJournalEntry, InsertGrowthJournalEntry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook pour gérer le journal de croissance d'une plante
 * @param plantId ID de la plante (optionnel)
 */
export function useGrowthJournal(plantId?: number) {
  const { toast } = useToast();
  
  // Récupération des entrées pour une plante spécifique
  const {
    data: plantEntries = [],
    isLoading: isLoadingPlantEntries,
    error: plantEntriesError,
  } = useQuery<GrowthJournalEntry[]>({
    queryKey: plantId ? [`/api/plants/${plantId}/growth-journal`] : null,
    enabled: !!plantId,
    // Trier par date décroissante pour afficher les entrées les plus récentes en premier
    select: (data) => 
      [...data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
  });
  
  // Récupération de toutes les entrées de l'utilisateur connecté
  const {
    data: userEntries = [],
    isLoading: isLoadingUserEntries,
    error: userEntriesError,
  } = useQuery<GrowthJournalEntry[]>({
    queryKey: ["/api/growth-journal"],
    // Trier par date décroissante
    select: (data) => 
      [...data].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
  });
  
  // Création d'une nouvelle entrée
  const createEntryMutation = useMutation({
    mutationFn: async (entry: InsertGrowthJournalEntry) => {
      const res = await apiRequest("POST", "/api/growth-journal", entry);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: GrowthJournalEntry) => {
      toast({
        title: "Entrée créée",
        description: "L'entrée a été ajoutée au journal de croissance.",
      });
      
      // Invalider les requêtes pour rafraîchir les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: [`/api/plants/${plantId}/growth-journal`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/growth-journal"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'entrée au journal. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });
  
  // Mise à jour d'une entrée existante
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<GrowthJournalEntry> }) => {
      const res = await apiRequest("PATCH", `/api/growth-journal/${id}`, updates);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: GrowthJournalEntry) => {
      toast({
        title: "Entrée mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
      
      // Invalider les requêtes pour rafraîchir les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: [`/api/plants/${plantId}/growth-journal`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/growth-journal"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'entrée. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });
  
  // Suppression d'une entrée
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/growth-journal/${id}`);
      return id;
    },
    onSuccess: (id: number) => {
      toast({
        title: "Entrée supprimée",
        description: "L'entrée a été supprimée du journal de croissance.",
      });
      
      // Invalider les requêtes pour rafraîchir les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: [`/api/plants/${plantId}/growth-journal`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/growth-journal"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entrée. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });
  
  return {
    // Données pour une plante spécifique
    plantEntries,
    isLoadingPlantEntries,
    plantEntriesError,
    
    // Données pour toutes les plantes de l'utilisateur
    userEntries,
    isLoadingUserEntries,
    userEntriesError,
    
    // Mutations
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation,
  };
}