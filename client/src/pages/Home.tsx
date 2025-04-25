import { Link } from "wouter";
import usePlants from "@/hooks/usePlants";
import useTasks from "@/hooks/useTasks";
import { Plant, Task } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import WeatherWidget from "@/components/WeatherWidget";

export default function Home() {
  const { data: plants, isLoading: plantsLoading } = usePlants();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { toast } = useToast();
  const { user } = useAuth();

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
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/pending"] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de compléter la tâche",
        variant: "destructive",
      });
    }
  };

  function getPlantStatusIcon(status: string) {
    switch (status) {
      case "healthy":
        return <span className="material-icons text-sm text-green-500">favorite</span>;
      case "warning":
        return <span className="material-icons text-sm text-yellow-500">warning</span>;
      case "danger":
        return <span className="material-icons text-sm text-alert">warning</span>;
      default:
        return <span className="material-icons text-sm text-gray-500">help_outline</span>;
    }
  }

  function getPlantStatusText(status: string) {
    switch (status) {
      case "healthy":
        return "Bonne santé";
      case "warning":
        return "Attention requise";
      case "danger":
        return "Besoin d'aide";
      default:
        return "État inconnu";
    }
  }

  function getPlantStatusColor(status: string) {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "danger":
        return "bg-alert";
      default:
        return "bg-gray-500";
    }
  }

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
    <div>
      {/* WELCOME SECTION */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-primary/80 to-primary-light/80 backdrop-blur-md rounded-xl shadow-lg p-6 flex items-center">
          <div className="mr-4 bg-white/20 p-3 rounded-full">
            <span className="material-icons text-white text-4xl">eco</span>
          </div>
          <div>
            <h2 className="text-xl font-raleway font-semibold mb-1 text-white">
              Bonjour {user?.firstName || "Jardinier"} !
            </h2>
            <p className="text-white/90">
              Votre collection contient{" "}
              <span className="font-semibold text-white">
                {!plantsLoading ? plants?.length || 0 : "..."} plantes
              </span>
              {!tasksLoading && tasks && tasks.filter(t => !t.completed).length > 0 && (
                <>. <span className="font-semibold text-white">{tasks.filter(t => !t.completed).length}</span> tâche{tasks.filter(t => !t.completed).length > 1 ? 's' : ''} à accomplir aujourd'hui</>
              )}.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS AND WEATHER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <h2 className="text-lg font-raleway font-semibold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="ghost" 
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 h-auto hover:shadow-lg hover:bg-white/90 transition-all duration-200 flex flex-col items-center w-full border border-gray-100"
              onClick={() => window.location.href = '/add-plant'}
            >
              <div className="bg-gradient-to-br from-primary/90 to-primary-light/90 rounded-full p-3 mb-2 text-white">
                <span className="material-icons">add_circle</span>
              </div>
              <span className="text-sm font-medium">Ajouter une plante</span>
            </Button>
            <Button 
              variant="ghost" 
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 h-auto hover:shadow-lg hover:bg-white/90 transition-all duration-200 flex flex-col items-center w-full border border-gray-100"
              onClick={() => window.location.href = '/plants'}
            >
              <div className="bg-gradient-to-br from-green-500/90 to-green-400/90 rounded-full p-3 mb-2 text-white">
                <span className="material-icons">format_list_bulleted</span>
              </div>
              <span className="text-sm font-medium">Mes plantes</span>
            </Button>
            <Button 
              variant="ghost" 
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 h-auto hover:shadow-lg hover:bg-white/90 transition-all duration-200 flex flex-col items-center w-full border border-gray-100"
              onClick={() => window.location.href = '/calendar'}
            >
              <div className="bg-gradient-to-br from-blue-500/90 to-blue-400/90 rounded-full p-3 mb-2 text-white">
                <span className="material-icons">calendar_today</span>
              </div>
              <span className="text-sm font-medium">Calendrier</span>
            </Button>
            <Button 
              variant="ghost" 
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 h-auto hover:shadow-lg hover:bg-white/90 transition-all duration-200 flex flex-col items-center w-full border border-gray-100"
              onClick={() => window.location.href = '/tips'}
            >
              <div className="bg-gradient-to-br from-amber-500/90 to-amber-400/90 rounded-full p-3 mb-2 text-white">
                <span className="material-icons">tips_and_updates</span>
              </div>
              <span className="text-sm font-medium">Conseils</span>
            </Button>
          </div>
        </div>
        <div>
          <WeatherWidget />
        </div>
      </div>

      {/* TODAY'S TASKS */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-raleway font-semibold">Tâches du jour</h2>
          <button 
            onClick={() => window.location.href = '/calendar'}
            className="text-primary text-sm font-medium flex items-center hover:underline focus:outline-none"
          >
            Voir tout
            <span className="material-icons text-sm ml-1">chevron_right</span>
          </button>
        </div>
        <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-gray-100">
          {tasksLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse flex justify-center">
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
              <p className="mt-2 text-gray-400">Chargement des tâches...</p>
            </div>
          ) : tasks && tasks.filter(t => !t.completed).length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tasks
                .filter((task: Task) => !task.completed)
                .map((task: Task) => (
                  <div key={task.id} className="p-4 flex items-center hover:bg-gray-50/50 transition-colors">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      task.type === 'water' ? 'from-blue-500/80 to-blue-400/80' :
                      task.type === 'light' ? 'from-amber-500/80 to-amber-400/80' :
                      task.type === 'fertilize' ? 'from-green-500/80 to-green-400/80' :
                      task.type === 'repot' ? 'from-amber-700/80 to-amber-600/80' :
                      'from-gray-500/80 to-gray-400/80'
                    } rounded-full flex items-center justify-center mr-4 shadow-sm text-white`}>
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{task.description}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(task.dueDate || Date.now()).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <button 
                      className="ml-2 p-2 rounded-full hover:bg-white/80 active:bg-white/90 transition-all"
                      onClick={() => completeTask(task.id)}
                    >
                      <span className="material-icons text-gray-400 hover:text-green-500 transition-colors">check_circle_outline</span>
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gradient-to-br from-gray-50/50 to-white/80">
              <div className="mb-3 rounded-full bg-gray-100/80 p-3 inline-block">
                <span className="material-icons text-gray-400 text-xl">check_circle</span>
              </div>
              <p className="text-gray-500">Aucune tâche pour aujourd'hui</p>
            </div>
          )}
        </Card>
      </section>

      {/* MY PLANTS */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-raleway font-semibold">Mes plantes</h2>
          <button 
            onClick={() => window.location.href = '/plants'}
            className="text-primary text-sm font-medium flex items-center hover:underline focus:outline-none"
          >
            Voir toutes
            <span className="material-icons text-sm ml-1">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {plantsLoading ? (
            <div className="col-span-full bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="animate-pulse flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
                  <span className="material-icons text-primary/40 animate-bounce">eco</span>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
              </div>
              <p className="text-gray-400 mt-4">Chargement des plantes...</p>
            </div>
          ) : plants && plants.length > 0 ? (
            plants.slice(0, 4).map((plant: Plant) => (
              <div 
                key={plant.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 cursor-pointer"
                onClick={() => window.location.href = `/plants/${plant.id}`}
              >
                <div className="h-36 relative">
                  {plant.image ? (
                    <img 
                      src={plant.image} 
                      alt={plant.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary-light/10">
                      <span className="material-icons text-primary/80 text-5xl">eco</span>
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 ${
                    plant.status === 'healthy' ? 'bg-green-500/90' : 
                    plant.status === 'warning' ? 'bg-yellow-500/90' : 
                    plant.status === 'danger' ? 'bg-alert/90' : 
                    'bg-gray-500/90'
                  } text-white backdrop-blur-sm shadow-sm px-2 py-1 rounded-full text-xs flex items-center`}>
                    {plant.status === 'healthy' && <span className="material-icons text-sm mr-1">favorite</span>}
                    {plant.status === 'warning' && <span className="material-icons text-sm mr-1">warning</span>}
                    {plant.status === 'danger' && <span className="material-icons text-sm mr-1">warning</span>}
                    {getPlantStatusText(plant.status)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-1">{plant.name}</h3>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="material-icons text-xs mr-1">calendar_today</span>
                    {plant.dateAdded ? new Date(plant.dateAdded).toLocaleDateString("fr-FR", {
                      day: 'numeric',
                      month: 'short'
                    }) : 'Date inconnue'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-100">
              <div className="mb-4 rounded-full bg-primary/10 p-5 inline-block">
                <span className="material-icons text-primary/70 text-3xl">eco</span>
              </div>
              <p className="text-gray-500 mb-6">Vous n'avez pas encore de plantes</p>
              <Button 
                className="bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-md transition-shadow"
                onClick={() => window.location.href = '/add-plant'}
              >
                Ajouter une plante
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
