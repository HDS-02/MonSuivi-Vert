import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plant, InsertTask } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Schéma de validation pour le formulaire de tâche
const taskSchema = z.object({
  plantId: z.coerce.number({
    required_error: "Veuillez sélectionner une plante",
  }),
  type: z.string({
    required_error: "Veuillez sélectionner un type de tâche",
  }),
  description: z.string().min(3, "La description doit contenir au moins 3 caractères"),
  dueDate: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
});

// Type pour les valeurs du formulaire
type TaskFormValues = z.infer<typeof taskSchema>;

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

export default function NewTaskDialog({
  open,
  onOpenChange,
  selectedDate,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Configuration du formulaire avec react-hook-form et zod
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
      type: "water",
      dueDate: selectedDate || new Date(),
    },
  });

  // Effet pour charger les plantes lors de l'ouverture du dialogue
  useEffect(() => {
    if (open) {
      const fetchPlants = async () => {
        try {
          const response = await fetch("/api/plants");
          if (!response.ok) throw new Error("Erreur lors du chargement des plantes");
          const data = await response.json();
          setPlants(data);
          
          // Si des plantes sont disponibles, sélectionner la première par défaut
          if (data.length > 0) {
            form.setValue("plantId", data[0].id);
          }
        } catch (error) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les plantes",
            variant: "destructive",
          });
        }
      };

      fetchPlants();
    }
  }, [open, form, toast]);

  // Réinitialiser le formulaire quand on ouvre le dialogue
  useEffect(() => {
    if (open) {
      form.reset({
        description: "",
        type: "water",
        dueDate: selectedDate || new Date(),
      });
    }
  }, [open, selectedDate, form]);

  // Gérer la soumission du formulaire
  const onSubmit = async (data: TaskFormValues) => {
    setIsLoading(true);

    try {
      // Formater les données pour l'API
      const taskData: InsertTask = {
        plantId: data.plantId,
        type: data.type,
        description: data.description,
        dueDate: data.dueDate,
      };

      // Envoyer les données à l'API
      await apiRequest("POST", "/api/tasks", taskData);

      // Rafraîchir les données de tâches dans le cache
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      // Notification de succès
      toast({
        title: "Tâche créée",
        description: "La nouvelle tâche a été ajoutée avec succès",
      });

      // Fermer le dialogue
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la tâche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche d'entretien</DialogTitle>
          <DialogDescription>
            Créez une nouvelle tâche d'entretien pour votre plante
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Sélection de la plante */}
            <FormField
              control={form.control}
              name="plantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plante</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une plante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id.toString()}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type de tâche */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de tâche</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="water">Arrosage</SelectItem>
                      <SelectItem value="fertilize">Fertilisation</SelectItem>
                      <SelectItem value="repot">Rempotage</SelectItem>
                      <SelectItem value="light">Exposition</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Arroser abondamment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date d'échéance */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date prévue</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                    Création...
                  </>
                ) : (
                  "Créer la tâche"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}