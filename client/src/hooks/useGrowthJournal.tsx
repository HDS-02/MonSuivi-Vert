import { useState } from "react";
import { 
  useQuery, 
  useMutation, 
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { GrowthJournalEntry, InsertGrowthJournalEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useGrowthJournal(plantId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<GrowthJournalEntry | null>(null);

  // Récupérer les entrées du journal pour une plante spécifique
  const {
    data: plantEntries = [],
    isLoading: isLoadingPlantEntries,
    error: plantEntriesError,
    refetch: refetchPlantEntries
  } = useQuery<GrowthJournalEntry[]>({
    queryKey: plantId ? ['/api/plants', plantId, 'growth-journal'] : [],
    queryFn: plantId 
      ? async () => {
          const res = await apiRequest("GET", `/api/plants/${plantId}/growth-journal`);
          return await res.json();
        }
      : () => Promise.resolve([]),
    enabled: !!plantId
  });

  // Récupérer toutes les entrées du journal pour l'utilisateur connecté
  const {
    data: userEntries = [],
    isLoading: isLoadingUserEntries,
    error: userEntriesError,
    refetch: refetchUserEntries
  } = useQuery<GrowthJournalEntry[]>({
    queryKey: ['/api/growth-journal'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/growth-journal");
      return await res.json();
    },
    enabled: !!user, // Activé uniquement si l'utilisateur est connecté
  });

  // Créer une nouvelle entrée dans le journal
  const createEntryMutation = useMutation({
    mutationFn: async (entry: InsertGrowthJournalEntry) => {
      const res = await apiRequest("POST", "/api/growth-journal", entry);
      return await res.json();
    },
    onSuccess: (data: GrowthJournalEntry) => {
      toast({
        title: "Entrée ajoutée",
        description: "L'entrée a été ajoutée au journal de croissance avec succès.",
      });
      
      // Invalider les requêtes pour mettre à jour les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: ['/api/plants', plantId, 'growth-journal'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/growth-journal'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter l'entrée : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mettre à jour une entrée existante
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<GrowthJournalEntry> }) => {
      const res = await apiRequest("PATCH", `/api/growth-journal/${id}`, updates);
      return await res.json();
    },
    onSuccess: (data: GrowthJournalEntry) => {
      toast({
        title: "Entrée mise à jour",
        description: "L'entrée du journal a été mise à jour avec succès.",
      });
      
      // Invalider les requêtes pour mettre à jour les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: ['/api/plants', plantId, 'growth-journal'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/growth-journal'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour l'entrée : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Supprimer une entrée
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
      
      // Invalider les requêtes pour mettre à jour les données
      if (plantId) {
        queryClient.invalidateQueries({ queryKey: ['/api/plants', plantId, 'growth-journal'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/growth-journal'] });
      
      // Réinitialiser l'entrée sélectionnée si elle vient d'être supprimée
      if (selectedEntry && selectedEntry.id === id) {
        setSelectedEntry(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'entrée : ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    // Données
    plantEntries,
    userEntries,
    selectedEntry,
    setSelectedEntry,
    
    // États de chargement
    isLoadingPlantEntries,
    isLoadingUserEntries,
    
    // Erreurs
    plantEntriesError,
    userEntriesError,
    
    // Mutations
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation,
    
    // Méthodes de rafraîchissement
    refetchPlantEntries,
    refetchUserEntries
  };
}