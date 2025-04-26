import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plant } from "@shared/schema";

interface ReminderTimeSelectorProps {
  plant: Plant;
}

export default function ReminderTimeSelector({ plant }: ReminderTimeSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminderTime, setReminderTime] = useState(plant.reminderTime || "08:00");
  const [isEditing, setIsEditing] = useState(false);

  // Mutation pour mettre à jour l'heure de rappel de la plante
  const updateReminderTimeMutation = useMutation({
    mutationFn: async (newTime: string) => {
      console.log("État actuel d'arrosage automatique avant mise à jour:", plant.autoWatering);
      
      const response = await apiRequest("PATCH", `/api/plants/${plant.id}/reminder-time`, {
        reminderTime: newTime,
        autoWatering: plant.autoWatering // Forcer explicitement le même état d'arrosage automatique
      });
      
      const data = await response.json();
      console.log("Réponse de l'API après mise à jour:", data);
      return data;
    },
    onSuccess: (data) => {
      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: [`/api/plants/${plant.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      
      // Notification de réussite
      toast({
        title: "Heure de rappel mise à jour",
        description: `Les rappels pour ${plant.name} seront envoyés à ${reminderTime}`,
      });
      
      // Si la plante a l'arrosage automatique activé, afficher un message supplémentaire
      if (plant.autoWatering) {
        toast({
          title: "Arrosage automatique conservé",
          description: "L'arrosage automatique reste activé avec la nouvelle heure",
          duration: 3000
        });
      }
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour l'heure de rappel: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Affichage d'un message pour indiquer que l'arrosage automatique sera conservé
    if (plant.autoWatering) {
      toast({
        title: "Modification en cours...",
        description: "L'état d'arrosage automatique sera conservé",
        duration: 2000
      });
    }
    
    updateReminderTimeMutation.mutate(reminderTime);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 mt-4">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm">
          Rappels programmés à: <strong>{plant.reminderTime || "08:00"}</strong>
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsEditing(true)}
          className="ml-2"
        >
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="reminderTime">Heure des rappels</Label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Input
            id="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-32"
          />
        </div>
      </div>
      <div className="flex space-x-2 pt-2">
        <Button 
          type="submit" 
          size="sm"
          disabled={updateReminderTimeMutation.isPending}
        >
          {updateReminderTimeMutation.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setReminderTime(plant.reminderTime || "08:00");
            setIsEditing(false);
          }}
          disabled={updateReminderTimeMutation.isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}