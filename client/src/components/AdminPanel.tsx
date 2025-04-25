import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Panneau d'administration pour les opérations de maintenance
 */
export function AdminPanel() {
  const { toast } = useToast();
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<Date | null>(null);

  /**
   * Demande au serveur de générer les tâches d'arrosage automatiques 
   * pour toutes les plantes avec arrosage automatique activé
   */
  const handleGenerateAutoWatering = async () => {
    if (isGeneratingTasks) return;
    
    setIsGeneratingTasks(true);
    
    try {
      const response = await fetch("/api/tasks/generate-auto-watering", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status} lors de la génération des tâches d'arrosage`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Tâches d'arrosage générées",
        description: `${data.tasksCreated} tâches d'arrosage automatiques ont été créées avec succès.`,
      });
      
      setLastGeneration(new Date());
    } catch (error: any) {
      console.error("Erreur lors de la génération des tâches d'arrosage:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération des tâches d'arrosage",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-yellow-500/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-700 flex items-center gap-2">
            <span className="material-icons text-yellow-600">admin_panel_settings</span>
            <span>Administration</span>
          </CardTitle>
          <CardDescription>
            Outils de maintenance réservés aux administrateurs
          </CardDescription>
        </CardHeader>
        <Separator className="mb-3" />
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-600">water_drop</span>
                <h3 className="font-medium text-blue-800">Arrosage automatique</h3>
              </div>
              {lastGeneration && (
                <span className="text-xs text-blue-600">
                  Dernière exécution: {lastGeneration.toLocaleString('fr-FR')}
                </span>
              )}
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Génère automatiquement les prochaines tâches d'arrosage pour toutes les plantes avec l'arrosage automatique activé.
            </p>
            <Button 
              variant="outline" 
              className="bg-blue-100 border-blue-200 hover:bg-blue-200 text-blue-800"
              onClick={handleGenerateAutoWatering}
              disabled={isGeneratingTasks}
            >
              {isGeneratingTasks ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Générer les tâches d'arrosage
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-gray-500">
          Ces fonctions de maintenance sont généralement exécutées automatiquement par des tâches planifiées.
        </CardFooter>
      </Card>
    </div>
  );
}