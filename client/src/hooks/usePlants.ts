import { useQuery, useMutation } from "@tanstack/react-query";
import { Plant } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function usePlants() {
  return useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });
}

export function usePlantDelete() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (plantId: number) => {
      await apiRequest("DELETE", `/api/plants/${plantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/plants"]});
      toast({
        title: "Plante supprimée",
        description: "La plante a été supprimée avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la plante: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}
