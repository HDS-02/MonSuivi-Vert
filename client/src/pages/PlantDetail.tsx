import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plant, Task, PlantAnalysis } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import EditPlantDialog from "@/components/EditPlantDialog";
import SOSPlantDialog from "@/components/SOSPlantDialog";
import { PlantQRCode } from "@/components/PlantQRCode";
import { PlantGrowthJournal } from "@/components/PlantGrowthJournal";

export default function PlantDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [displayTab, setDisplayTab] = useState<"overview" | "history" | "growth-journal">("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  
  const { data: plant, isLoading: plantLoading } = useQuery<Plant>({
    queryKey: [`/api/plants/${id}`],
  });
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/plants/${id}/tasks`],
  });
  
  const { data: analyses, isLoading: analysesLoading } = useQuery<PlantAnalysis[]>({
    queryKey: [`/api/plants/${id}/analyses`],
  });
  
  // Mutation pour mettre à jour une plante
  const updatePlantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Plant> }) => {
      const response = await apiRequest("PATCH", `/api/plants/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants/${id}`] });
      toast({
        title: "Plante mise à jour",
        description: "Les modifications ont été enregistrées avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la plante.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation pour marquer une tâche comme terminée
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants/${id}/tasks`] });
      toast({
        title: "Tâche terminée",
        description: "La tâche a été marquée comme terminée."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la tâche comme terminée.",
        variant: "destructive"
      });
    }
  });

  function formatDate(dateString: string | Date | null | undefined) {
    if (!dateString) return "Non défini";
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "danger":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusText(status: string) {
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

  if (plantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Chargement des informations...</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg mb-4">Plante non trouvée</p>
        <Button
          onClick={() => navigate("/plants")}
          className="bg-primary text-white"
        >
          Retour à mes plantes
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          className="flex items-center text-primary mb-4"
          onClick={() => navigate("/plants")}
        >
          <span className="material-icons mr-1">arrow_back</span>
          Retour
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-48 bg-gray-200 relative">
          {/* Forcer l'affichage de l'image de la Monstera */}
          {plant.name === "Monstera Deliciosa" ? (
            <img
              src="https://images.pexels.com/photos/3571563/pexels-photo-3571563.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          ) : plant.image ? (
            <img
              src={plant.image.startsWith('http') ? plant.image : `${plant.image}`}
              alt={plant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // En cas d'erreur de chargement, utiliser une div avec un icône au lieu d'une image
                e.currentTarget.style.display = 'none';
                // Afficher un message d'erreur pour faciliter le débogage
                console.error("Erreur de chargement d'image:", plant.image);
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10">
              <span className="material-icons text-primary text-4xl">eco</span>
              <p className="text-xs text-primary">Aucune image disponible</p>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-raleway font-semibold">{plant.name}</h2>
            <div className="flex gap-2">
              <PlantQRCode plantId={plant.id} plantName={plant.name} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-primary"
                onClick={() => setEditDialogOpen(true)}
              >
                <span className="material-icons">edit</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center mb-4">
            <div className={`px-2 py-1 ${getStatusClass(plant.status)} rounded-full text-xs font-medium`}>
              {getStatusText(plant.status)}
            </div>
            <div className="mx-2 text-gray-300">•</div>
            <div className="text-xs text-gray-500">
              Ajouté le {formatDate(plant.dateAdded)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full p-2 w-10 h-10 flex items-center justify-center mx-auto mb-1">
                <span className="material-icons text-blue-500">opacity</span>
              </div>
              <div className="text-xs font-medium">Arrosage</div>
              <div className="text-xs text-gray-500">
                {plant.wateringFrequency 
                  ? `Tous les ${plant.wateringFrequency} jours` 
                  : "Non défini"}
              </div>
            </div>
            <div className="text-center">
              <div className="bg-yellow-50 rounded-full p-2 w-10 h-10 flex items-center justify-center mx-auto mb-1">
                <span className="material-icons text-yellow-500">wb_sunny</span>
              </div>
              <div className="text-xs font-medium">Lumière</div>
              <div className="text-xs text-gray-500">{plant.light || "Non défini"}</div>
            </div>
            <div className="text-center">
              <div className="bg-green-50 rounded-full p-2 w-10 h-10 flex items-center justify-center mx-auto mb-1">
                <span className="material-icons text-green-500">thermostat</span>
              </div>
              <div className="text-xs font-medium">Température</div>
              <div className="text-xs text-gray-500">{plant.temperature || "Non défini"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <Button
            variant={displayTab === "overview" ? "default" : "outline"}
            className={displayTab === "overview" ? "bg-primary text-white" : ""}
            onClick={() => setDisplayTab("overview")}
          >
            Aperçu
          </Button>
          <Button
            variant={displayTab === "history" ? "default" : "outline"}
            className={displayTab === "history" ? "bg-primary text-white" : ""}
            onClick={() => setDisplayTab("history")}
          >
            Historique de santé
          </Button>
          <Button
            variant={displayTab === "growth-journal" ? "default" : "outline"}
            className={displayTab === "growth-journal" ? "bg-primary text-white" : ""}
            onClick={() => setDisplayTab("growth-journal")}
          >
            Journal de croissance
          </Button>
        </div>
        
        <Button 
          variant="outline"
          className="flex items-center justify-center rounded-full w-14 h-14 bg-white border-2 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-md p-0 flex-shrink-0 ml-2" 
          onClick={() => setSosDialogOpen(true)}
        >
          <span className="material-icons text-2xl">healing</span>
        </Button>
      </div>

      {displayTab === "overview" && (
        <>
          <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
            <CardContent className="p-0">
              <h3 className="font-raleway font-semibold mb-3">Conseils d'entretien</h3>
              {plant.careNotes ? (
                <div className="space-y-3">
                  {plant.careNotes.split('.').filter(note => note.trim()).map((note, index) => (
                    <div key={index} className="flex items-start">
                      <span className="material-icons text-primary mr-2 mt-0.5 text-sm">arrow_right</span>
                      <span className="text-sm">{note.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun conseil d'entretien disponible.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Section pour les maladies fréquentes */}
          <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
            <CardContent className="p-0">
              <h3 className="font-raleway font-semibold mb-3">Maladies fréquentes</h3>
              {plant.commonDiseases && Array.isArray(plant.commonDiseases) && plant.commonDiseases.length > 0 ? (
                <div className="space-y-4">
                  {plant.commonDiseases.map((disease: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50/30 border border-red-100 rounded-md">
                      <div className="flex items-start mb-2">
                        <span className="material-icons text-red-500 mr-2">pest_control</span>
                        <h4 className="font-medium text-red-800">{disease.name}</h4>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{disease.description}</p>
                      <div className="flex items-start">
                        <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-red-100 text-red-600">
                          <span className="material-icons text-xs mr-1 align-text-top">healing</span>
                          Traitement
                        </span>
                        <p className="text-xs text-gray-600 ml-2">{disease.treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="material-icons text-gray-300 text-4xl mb-2">verified</span>
                  <p className="text-sm text-gray-500">Cette plante ne présente pas de maladies fréquentes connues.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Section pour la taille de pot recommandée */}
          {plant.potSize && (
            <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
              <CardContent className="p-0">
                <h3 className="font-raleway font-semibold mb-3">Taille de pot recommandée</h3>
                <div className="flex items-center bg-blue-50/30 p-3 rounded-md border border-blue-100">
                  <span className="material-icons text-blue-500 mr-3">format_size</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">{plant.potSize}</p>
                    <p className="text-xs text-gray-600">Assurez-vous que le pot dispose de trous de drainage adéquats.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Section pour la galerie d'images */}
          <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
            <CardContent className="p-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-raleway font-semibold">Galerie</h3>
                <label htmlFor="gallery-photo-input" className="text-primary text-sm font-medium flex items-center cursor-pointer">
                  <span className="material-icons text-sm mr-1">add_photo_alternate</span>
                  Ajouter
                  <input 
                    id="gallery-photo-input" 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Convertir l'image en base64
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageData = event.target?.result as string;
                        // Mettre à jour la galerie
                        if (imageData) {
                          const updatedGallery = plant.gallery 
                            ? Array.isArray(plant.gallery) 
                              ? [...plant.gallery, imageData]
                              : [imageData]
                            : [imageData];
                          
                          // Utiliser useMutation pour mettre à jour la galerie
                          updatePlantMutation.mutate({
                            id: plant.id,
                            updates: { gallery: updatedGallery }
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                      // Réinitialiser l'input pour permettre le téléchargement du même fichier
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              
              {plant.gallery && Array.isArray(plant.gallery) && plant.gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {plant.gallery.map((image: string, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${plant.name} - image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="material-icons text-gray-400">image_not_supported</span></div>';
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-md">
                  <span className="material-icons text-gray-300 text-4xl mb-2">photo_library</span>
                  <p className="text-sm text-gray-500 mb-2">Aucune photo dans la galerie</p>
                  <p className="text-xs text-gray-400">Ajoutez des photos pour suivre l'évolution de votre plante</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {displayTab === "history" && (
        <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-raleway font-semibold">Historique de santé</h3>
            </div>
            {analysesLoading ? (
              <p className="text-center py-4">Chargement de l'historique...</p>
            ) : analyses && analyses.length > 0 ? (
              <div className="space-y-4">
                {analyses.map((analysis, index) => (
                  <div key={analysis.id} className="flex">
                    <div className="relative mr-4">
                      <div className="w-10 h-10 bg-neutral rounded-full flex items-center justify-center border-2 border-primary">
                        <span className="material-icons text-primary text-sm">
                          {analysis.status === "healthy" ? "check" : "warning"}
                        </span>
                      </div>
                      {index < analyses.length - 1 && (
                        <div className="absolute top-10 bottom-0 left-1/2 w-0.5 bg-gray-200"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium text-sm">Analyse effectuée</h4>
                        <span className="ml-2 text-xs text-gray-500">{formatDate(analysis.date)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{analysis.recommendations || "Pas de recommandations"}</p>
                      {analysis.image && (
                        <div className="flex">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 mr-2">
                            <img
                              src={analysis.image}
                              alt="Image de plante"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<span class="material-icons text-gray-400 flex items-center justify-center h-full">image_not_supported</span>';
                                }
                                console.error("Erreur de chargement d'image:", analysis.image);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucun historique disponible pour cette plante.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {displayTab === "growth-journal" && (
        <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
          <CardContent className="p-0">
            <PlantGrowthJournal plantId={Number(id)} plantName={plant.name} />
          </CardContent>
        </Card>
      )}

      <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
        <CardContent className="p-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-raleway font-semibold">Tâches à faire</h3>
            <button className="text-primary text-sm font-medium">Ajouter</button>
          </div>
          {tasksLoading ? (
            <p className="text-center py-4">Chargement des tâches...</p>
          ) : tasks && tasks.filter(t => !t.completed).length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tasks
                .filter(task => !task.completed)
                .map(task => (
                  <div key={task.id} className="py-3 flex items-center">
                    <div className="w-8 h-8 bg-primary-light/10 rounded-full flex items-center justify-center mr-3">
                      <span className="material-icons text-primary text-sm">
                        {task.type === "water" ? "opacity" : "eco"}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium">{task.description}</p>
                      <p className="text-xs text-gray-500">
                        {task.dueDate ? formatDate(task.dueDate) : "Pas de date"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-primary"
                      onClick={async () => {
                        try {
                          await fetch(`/api/tasks/${task.id}/complete`, {
                            method: "PATCH",
                            credentials: "include",
                          });
                          queryClient.invalidateQueries({ queryKey: [`/api/plants/${id}/tasks`] });
                          toast({
                            title: "Tâche terminée",
                            description: "La tâche a été marquée comme terminée",
                          });
                        } catch (error) {
                          toast({
                            title: "Erreur",
                            description: "Impossible de marquer la tâche comme terminée",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <span className="material-icons">check_circle_outline</span>
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucune tâche en attente pour cette plante.
            </p>
          )}
        </CardContent>
      </Card>
      {/* Edit Plant Dialog */}
      <EditPlantDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        plant={plant}
        onDelete={() => navigate("/plants")}
      />

      {/* SOS Assistance Plante Dialog */}
      <SOSPlantDialog
        open={sosDialogOpen}
        onOpenChange={setSosDialogOpen}
        plant={plant}
      />
    </div>
  );
}
