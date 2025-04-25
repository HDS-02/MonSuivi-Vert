import { useState, useMemo, useEffect } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fr } from "date-fns/locale";
import useTasks from "@/hooks/useTasks";
import { Task } from "@shared/schema";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import NewTaskDialog from "@/components/NewTaskDialog";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const { data: tasks, isLoading } = useTasks();
  const { toast } = useToast();
  
  // Effet pour forcer un recalcul des tâches quand la date change
  useEffect(() => {
    if (date && tasks) {
      console.log("La date a changé, recalcul des tâches pour:", formatDate(date));
    }
  }, [date]);

  function formatDate(date: Date | string | undefined): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  // Fonction utilitaire pour normaliser une date (sans l'heure)
  const normalizeDate = (date: Date | string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTasksForDate = (date: Date | undefined) => {
    // Si pas de date ou pas de tâches, retourner tableau vide
    if (!date || !tasks) return [];
    
    console.log("Recherche de tâches pour la date:", date);
    
    // Normaliser la date sélectionnée (sans l'heure)
    const normalizedSelectedDate = normalizeDate(date);
    
    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      // Normaliser la date de la tâche (sans l'heure)
      const normalizedTaskDate = normalizeDate(task.dueDate);
      
      // Comparer les dates normalisées
      const match = normalizedTaskDate === normalizedSelectedDate;
      
      console.log(
        `Tâche ${task.id}: ${task.description}, ` +
        `Date tâche: ${normalizedTaskDate}, ` +
        `Date sélectionnée: ${normalizedSelectedDate}, ` +
        `Correspond: ${match}`
      );
      
      return match;
    });
    
    console.log("Tâches filtrées:", filteredTasks);
    return filteredTasks;
  };

  // Calcul des tâches pour la date sélectionnée avec mise à jour automatique
  // On utilise useMemo pour recalculer uniquement si date ou tasks changent
  const tasksForSelectedDate = useMemo(() => {
    return date && tasks ? getTasksForDate(date) : [];
  }, [date, tasks]);

  const getDotColorForDate = (date: Date) => {
    if (!tasks) return null;
    
    const tasksOnDate = getTasksForDate(date);
    if (tasksOnDate.length === 0) return null;
    
    const hasDangerTask = tasksOnDate.some(task => task.type === "water" && !task.completed);
    if (hasDangerTask) return "bg-alert";
    
    return "bg-primary";
  };
  
  const completeTask = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      
      toast({
        title: "Tâche complétée",
        description: "La tâche a été marquée comme terminée.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de compléter la tâche",
        variant: "destructive",
      });
    }
  };
  
  const deleteTask = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  };

  function getTaskIcon(type: string) {
    switch (type) {
      case "water":
        return <span className="material-icons text-primary">opacity</span>;
      case "light":
        return <span className="material-icons text-info">wb_sunny</span>;
      case "fertilize":
        return <span className="material-icons text-green-500">spa</span>;
      case "repot":
        return <span className="material-icons text-amber-700">yard</span>;
      default:
        return <span className="material-icons text-gray-500">eco</span>;
    }
  }

  function getTaskTypeBackground(type: string) {
    switch (type) {
      case "water":
        return "bg-primary-light/10";
      case "light":
        return "bg-info/10";
      case "fertilize":
        return "bg-green-500/10";
      case "repot":
        return "bg-amber-700/10";
      default:
        return "bg-gray-100";
    }
  }

  return (
    <div className="organic-bg min-h-screen pb-24">
      <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
        <Link href="/" className="flex items-center text-white/90 mb-4 hover:text-white transition-colors">
          <span className="material-icons mr-1">arrow_back</span>
          Retour
        </Link>
        <h2 className="text-2xl font-raleway font-semibold">Calendrier d'entretien</h2>
        <p className="text-white/80 mt-1">Suivez les tâches d'entretien de vos plantes</p>
      </div>

      <div className="px-4">
        <Card className="glass-card backdrop-blur-sm shadow-lg border border-gray-100/80 rounded-xl mb-6">
          <CardContent className="p-2 md:p-4">
            <CalendarUI
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={fr}
              modifiers={{
                booked: (date) => {
                  return getTasksForDate(date).length > 0;
                },
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold"
                }
              }}
              classNames={{
                head_cell: "text-primary-dark font-medium text-center",
                day_today: "bg-primary/10",
                day_selected: "bg-gradient-to-r from-primary to-primary-light text-white",
                nav_button: "hover:bg-primary/10",
                nav_button_previous: "text-primary",
                nav_button_next: "text-primary"
              }}
              components={{
                Day: ({ date, displayMonth }) => {
                  // Ne pas afficher les points pour les jours qui ne sont pas du mois affiché
                  const isCurrentMonth = date.getMonth() === displayMonth.getMonth();
                  const color = isCurrentMonth ? getDotColorForDate(date) : null;
                  const day = date.getDate();
                  
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div>{day}</div>
                      {color && (
                        <div className="absolute bottom-0.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
                        </div>
                      )}
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h3 className="text-lg font-raleway font-medium text-primary-dark">
            Tâches du {date ? formatDate(date) : ""}
          </h3>
          <Button 
            className="bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 w-full sm:w-auto"
            onClick={() => setIsNewTaskDialogOpen(true)}
          >
            <span className="material-icons mr-2">add_circle</span>
            Nouvelle tâche
          </Button>
        </div>

        <Card className="glass-card backdrop-blur-sm shadow-lg border border-gray-100/80 rounded-xl">
          <CardContent className="p-5">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="rounded-full bg-primary/20 h-14 w-14 flex items-center justify-center mb-4">
                    <span className="material-icons text-primary/40 text-3xl">event</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : tasksForSelectedDate.length > 0 ? (
              <div className="divide-y divide-gray-100/50">
                {tasksForSelectedDate.map((task: Task) => (
                  <div key={task.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center">
                    <div className={`w-12 h-12 ${getTaskTypeBackground(task.type)} rounded-full flex items-center justify-center mr-4 shadow-sm mb-3 sm:mb-0`}>
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-primary-dark">{task.description}</h4>
                        {task.completed && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center">
                            <span className="material-icons text-xs mr-1">check_circle</span>
                            Terminé
                          </span>
                        )}
                      </div>
                      <Link href={`/plants/${task.plantId}`} className="text-sm text-primary flex items-center mt-1 hover:underline">
                        <span className="material-icons text-xs mr-1">visibility</span>
                        Voir la plante
                      </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0 sm:ml-2 w-full sm:w-auto">
                      {!task.completed && (
                        <Button
                          variant="outline"
                          className="p-2.5 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                          onClick={() => completeTask(task.id)}
                        >
                          <span className="material-icons text-primary mr-2 sm:mr-0">check_circle</span>
                          <span className="sm:hidden">Terminer</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="p-2.5 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                        onClick={() => {
                          if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
                            deleteTask(task.id);
                          }
                        }}
                      >
                        <span className="material-icons text-red-500 mr-2 sm:mr-0">delete</span>
                        <span className="sm:hidden">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mb-4 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full p-4 inline-block">
                  <span className="material-icons text-primary text-4xl">event_available</span>
                </div>
                <p className="text-lg font-medium text-primary-dark mb-2">Aucune tâche pour cette date</p>
                <p className="text-sm text-gray-600 mb-4">Sélectionnez une autre date ou planifiez un nouvel entretien</p>
                <Button 
                  variant="outline" 
                  className="border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => setIsNewTaskDialogOpen(true)}
                >
                  <span className="material-icons mr-2">add</span>
                  Ajouter une tâche
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogue pour créer une nouvelle tâche */}
      <NewTaskDialog 
        open={isNewTaskDialogOpen} 
        onOpenChange={setIsNewTaskDialogOpen}
        selectedDate={date}
      />
    </div>
  );
}
