import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function useTasks() {
  const queryClient = useQueryClient();
  
  return useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000, // Re-fetch every 30 seconds for fresh data
    refetchOnWindowFocus: true,
    staleTime: 10000 // Consider data stale after 10 seconds
  });
}

// Fonction utilitaire pour supprimer une tâche via l'API avec hook personnalisé
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteTask = async (taskId: number): Promise<boolean> => {
    try {
      toast({
        title: "Suppression en cours",
        description: "Veuillez patienter...",
      });
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      // Invalidate the tasks cache to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche. Veuillez réessayer.",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  return deleteTask;
}
