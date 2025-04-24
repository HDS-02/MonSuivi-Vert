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
    queryKey: [`/api/plants/${plantId}/growth-journal`],
    enabled: !!plantId,
    // Trier par date décroissante pour afficher les entrées les plus récentes en premier
    select: (data) => 
      [...data].sort((a, b) => 
        new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime()
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
        new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime()
      ),
  });
  
  // Création d'une nouvelle entrée
  const createEntryMutation = useMutation({
    mutationFn: async (entry: InsertGrowthJournalEntry) => {
      console.log("Mutation createEntry - Données envoyées:", entry);
      
      try {
        // S'assurer que les types de données sont corrects
        const processedEntry = {
          ...entry,
          plantId: Number(entry.plantId),
          userId: Number(entry.userId),
          // S'assurer que les valeurs numériques sont soit des nombres, soit null
          healthRating: entry.healthRating !== undefined ? Number(entry.healthRating) : null,
          height: entry.height !== undefined ? Number(entry.height) : null,
          leaves: entry.leaves !== undefined ? Number(entry.leaves) : null,
        };
        
        console.log("Mutation createEntry - Données traitées:", processedEntry);
        
        const res = await apiRequest("POST", "/api/growth-journal", processedEntry);
        if (!res.ok) {
          // Tenter d'extraire les détails de l'erreur de la réponse
          const errorData = await res.json().catch(() => ({}));
          console.error("Mutation createEntry - Erreur de réponse:", res.status, errorData);
          throw new Error(errorData.message || `Erreur ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log("Mutation createEntry - Réponse reçue:", data);
        return data;
      } catch (error) {
        console.error("Mutation createEntry - Erreur:", error);
        throw error;
      }
    },
    onSuccess: (data: GrowthJournalEntry) => {
      console.log("Entrée de journal créée avec succès:", data);
      
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
    onError: (error: any) => {
      console.error("Erreur lors de la création d'une entrée:", error);
      
      // Afficher un message plus détaillé si possible
      const errorMessage = error.message || "Impossible d'ajouter l'entrée au journal. Veuillez réessayer.";
      
      toast({
        title: "Erreur",
        description: errorMessage,
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