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

  // Nous ne faisons plus de vérification automatique des badges au chargement de la page
  // Pour éviter les appels en boucle et les problèmes d'authentification

  // Mettre à jour les badges au chargement de la page
  useEffect(() => {
    if (user) {
      // Mettre à jour les badges en fonction de la collection de plantes
      updatePlantCollectionBadges.mutateAsync().catch(err => {
        console.error("Erreur lors de la mise à jour des badges de collection:", err);
      });
      
      // Mettre à jour les badges en fonction des tâches complétées
      updateTaskBadges.mutateAsync().catch(err => {
        console.error("Erreur lors de la mise à jour des badges de tâches:", err);
      });
    }
  }, [user]);

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="organic-bg min-h-screen pb-24">
        <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
          <h1 className="text-2xl font-raleway font-semibold">Mes Réalisations</h1>
          <p className="text-white/80 mt-1">
            Suivez votre progression et déverrouillez des badges en prenant soin de vos plantes
          </p>
        </div>

        <div className="px-4">
          <div className="glass-card backdrop-blur-sm border border-gray-100/80 shadow-lg rounded-xl p-6 mb-8 text-center">
            <div className="p-6 flex flex-col items-center">
              <span className="material-icons text-5xl text-gray-300 mb-4">account_circle</span>
              <h2 className="text-xl font-medium mb-2">Connectez-vous pour voir vos badges</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Vous devez être connecté pour accéder à vos badges et récompenses. 
                Créez un compte ou connectez-vous pour commencer à débloquer des badges !
              </p>
              <Button size="lg" asChild>
                <a href="/auth">Se connecter</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="organic-bg min-h-screen pb-24">
      <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
        <h1 className="text-2xl font-raleway font-semibold">Mes Réalisations</h1>
        <p className="text-white/80 mt-1">
          Suivez votre progression et déverrouillez des badges en prenant soin de vos plantes
        </p>
      </div>

      <div className="px-4">


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