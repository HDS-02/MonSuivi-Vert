import { Separator } from "@/components/ui/separator";
import BadgeCollection from "@/components/BadgeCollection";
import { useAuth } from "@/hooks/use-auth";
import useBadges from "@/hooks/useBadges";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Badges() {
  const { user } = useAuth();
  const { updatePlantCollectionBadges, updateTaskBadges } = useBadges();
  const { toast } = useToast();

  // Simuler une vérification de badges au chargement de la page
  useEffect(() => {
    if (user) {
      // Ceci est simplement pour la démonstration, en production nous aurions
      // des vérifications de badges à des moments spécifiques (ajout de plante, tâche complétée, etc.)
      const checkBadges = async () => {
        try {
          await updatePlantCollectionBadges.mutateAsync();
          await updateTaskBadges.mutateAsync();
        } catch (error) {
          // Ignorer les erreurs silencieusement
        }
      };
      
      checkBadges();
    }
  }, [user, updatePlantCollectionBadges, updateTaskBadges]);

  // Fonction de démonstration pour simuler l'obtention d'un badge
  const simulateUnlockBadge = () => {
    toast({
      title: "🏆 Nouveau badge débloqué !",
      description: "Premier pas vert - Ajoutez votre première plante à l'application"
    });
  };

  return (
    <div className="organic-bg min-h-screen pb-24">
      <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
        <h1 className="text-2xl font-raleway font-semibold">Mes Réalisations</h1>
        <p className="text-white/80 mt-1">
          Suivez votre progression et déverrouillez des badges en prenant soin de vos plantes
        </p>
      </div>

      <div className="px-4">
        {/* Bouton de simulation - ne serait pas présent en production */}
        <Button
          variant="outline"
          onClick={simulateUnlockBadge}
          className="hidden" // Caché pour l'instant
        >
          <span className="material-icons mr-2">emoji_events</span>
          Simuler badge
        </Button>

        <div className="glass-card backdrop-blur-sm border border-gray-100/80 shadow-lg rounded-xl p-6 mb-8">
          <BadgeCollection />
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-raleway font-medium text-primary-dark mb-4">Comment obtenir des badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100/80 transition-all hover:shadow-lg hover:bg-primary/5">
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full p-2 shadow-sm mr-3">
                  <span className="material-icons">spa</span>
                </div>
                <h3 className="font-medium text-primary-dark">Collection de plantes</h3>
              </div>
              <p className="text-sm text-gray-600">
                Ajoutez des plantes à votre collection pour débloquer des badges.
                Plus votre jardin virtuel s'agrandit, plus vous progressez !
              </p>
            </div>
            
            <div className="glass-card backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100/80 transition-all hover:shadow-lg hover:bg-primary/5">
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full p-2 shadow-sm mr-3">
                  <span className="material-icons">task_alt</span>
                </div>
                <h3 className="font-medium text-primary-dark">Entretien régulier</h3>
              </div>
              <p className="text-sm text-gray-600">
                Complétez les tâches d'entretien pour débloquer des badges.
                Un bon jardinier prend soin de ses plantes !
              </p>
            </div>
            
            <div className="glass-card backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100/80 transition-all hover:shadow-lg hover:bg-primary/5">
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full p-2 shadow-sm mr-3">
                  <span className="material-icons">auto_awesome</span>
                </div>
                <h3 className="font-medium text-primary-dark">Identification de plantes</h3>
              </div>
              <p className="text-sm text-gray-600">
                Identifiez et ajoutez différentes variétés de plantes.
                Chaque nouvelle espèce vous rapproche d'un nouveau badge !
              </p>
            </div>
            
            <div className="glass-card backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100/80 transition-all hover:shadow-lg hover:bg-primary/5">
              <div className="flex items-center mb-3">
                <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full p-2 shadow-sm mr-3">
                  <span className="material-icons">calendar_month</span>
                </div>
                <h3 className="font-medium text-primary-dark">Fidélité</h3>
              </div>
              <p className="text-sm text-gray-600">
                Connectez-vous régulièrement à l'application pour suivre vos plantes.
                La constance est récompensée !
              </p>
            </div>
          </div>
        </section>

        {/* Badges à venir */}
        <section>
          <h2 className="text-xl font-raleway font-medium text-primary-dark mb-4">Badges à venir</h2>
          <div className="glass-card backdrop-blur-sm p-5 rounded-xl shadow-md border border-gray-100/80">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary-light/20 text-primary rounded-full p-2 shadow-sm">
                <span className="material-icons">update</span>
              </div>
              <h3 className="font-medium text-primary-dark">Nouvelles catégories en développement</h3>
            </div>
            <p className="text-sm text-gray-600">
              Restez à l'affût ! De nouvelles catégories de badges seront bientôt disponibles pour 
              récompenser votre expertise en jardinage et votre engagement écologique.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}