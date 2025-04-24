import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import useBadges from "@/hooks/useBadges";
import { Badge as BadgeType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function BadgeCollection() {
  const { user } = useAuth();
  const {
    badges,
    isBadgesLoading,
    getBadgesByCategory,
    getUnlockedBadges,
    getInProgressBadges,
  } = useBadges();
  const [activeTab, setActiveTab] = useState("tous");

  // Mettre à jour les données des badges au chargement du composant
  useEffect(() => {
    if (user) {
      // En production, nous aurions des fonctions pour vérifier les badges
      // à chaque action de l'utilisateur (ajout de plante, tâche complétée, etc.)
    }
  }, [user]);

  // Filtrer les badges selon l'onglet actif
  const getFilteredBadges = () => {
    switch (activeTab) {
      case "debloqués":
        return getUnlockedBadges();
      case "en-cours":
        return getInProgressBadges();
      case "entretien":
        return getBadgesByCategory("entretien");
      case "analyse":
        return getBadgesByCategory("analyse");
      case "collection":
        return getBadgesByCategory("collection");
      case "progression":
        return getBadgesByCategory("progression");
      default:
        return badges || [];
    }
  };

  // Composant pour afficher un badge individuel avec des effets visuels et animations améliorés
  const BadgeItem = ({ badge, index = 0 }: { badge: BadgeType; index?: number }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Calculer le pourcentage de progression
    const progressPercent = badge.progress !== undefined && badge.maxProgress !== undefined
      ? Math.round((badge.progress / badge.maxProgress) * 100)
      : 0;
    
    // Déterminer les classes et styles en fonction de l'état du badge
    const getBadgeStyle = () => {
      if (badge.unlocked) {
        return {
          container: `relative p-5 rounded-xl shadow-md flex flex-col items-center text-center 
                      transition-all duration-300 cursor-pointer
                      ${isHovered ? "shadow-lg" : ""}
                      bg-gradient-to-br from-primary-light/20 to-primary/30 
                      border border-primary/30`,
          icon: "mb-3 w-16 h-16 flex items-center justify-center rounded-full bg-white shadow-md",
          iconColor: `text-3xl ${getBadgeIconColor()}`,
          title: "font-raleway text-base font-semibold mb-1 text-gray-800",
          description: "text-xs text-gray-600 mb-3"
        };
      } else {
        return {
          container: `relative p-5 rounded-xl shadow-sm flex flex-col items-center text-center 
                      transition-all duration-300
                      bg-gray-100/80 backdrop-blur-sm border border-gray-200`,
          icon: "mb-3 w-16 h-16 flex items-center justify-center rounded-full bg-white/80 shadow-sm",
          iconColor: "text-3xl text-gray-400",
          title: "font-raleway text-base font-medium mb-1 text-gray-600",
          description: "text-xs text-gray-500 mb-3"
        };
      }
    };
    
    // Déterminer la couleur de l'icône en fonction de la catégorie
    function getBadgeIconColor() {
      switch (badge.category) {
        case "collection": return "text-emerald-500";
        case "entretien": return "text-blue-500";
        case "analyse": return "text-purple-500";
        case "progression": return "text-amber-500";
        default: return "text-primary";
      }
    }
    
    const styles = getBadgeStyle();
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.4, 
          delay: index * 0.1,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ scale: badge.unlocked ? 1.05 : 1.02 }}
        className={styles.container}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badge bloqué/débloqué indicator */}
        {badge.unlocked && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md z-10"
          >
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
              className="material-icons text-white text-sm"
            >
              check
            </motion.span>
          </motion.div>
        )}
        
        {/* Icon container */}
        <motion.div 
          className={styles.icon}
          whileHover={{ rotate: badge.unlocked ? [0, -10, 10, -5, 5, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span 
            className={`material-icons ${styles.iconColor}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          >
            {badge.icon}
          </motion.span>
        </motion.div>
        
        {/* Badge title and description */}
        <motion.h3 
          className={styles.title}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
        >
          {badge.name}
        </motion.h3>
        
        <motion.p 
          className={styles.description}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
        >
          {badge.description}
        </motion.p>
        
        {/* Progress bar for badges in progress */}
        {badge.progress !== undefined && badge.maxProgress !== undefined && (
          <motion.div 
            className="w-full mt-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
          >
            <div className="text-xs font-medium mb-1 flex justify-between">
              <span className={badge.unlocked ? "text-primary" : "text-gray-500"}>
                {badge.progress}/{badge.maxProgress}
              </span>
              <span className={badge.unlocked ? "text-primary" : "text-gray-500"}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.05, ease: "easeOut" }}
                className={`h-full ${badge.unlocked ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-primary/40'}`}
              />
            </div>
          </motion.div>
        )}
        
        {/* Date d'obtention pour les badges débloqués */}
        {badge.unlocked && badge.unlockedAt && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
            className="mt-3 py-1 px-2 rounded-full bg-white/60 text-xs text-gray-500"
          >
            Débloqué le {new Date(badge.unlockedAt).toLocaleDateString("fr-FR")}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Placeholder amélioré pour les badges en cours de chargement
  const BadgeSkeleton = () => (
    <div className="p-5 rounded-xl shadow-md bg-gray-50/80 backdrop-blur-sm border border-gray-100 flex flex-col items-center">
      <Skeleton className="mb-3 w-16 h-16 rounded-full" />
      <Skeleton className="w-3/4 h-5 mb-1" />
      <Skeleton className="w-full h-3 mb-3" />
      <Skeleton className="w-full h-2 mb-1" />
      <Skeleton className="w-1/2 h-6 rounded-full mt-3" />
    </div>
  );

  // Si l'utilisateur n'est pas connecté, afficher un message
  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Connectez-vous pour voir vos badges.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé des badges */}
      <div className="bg-gradient-to-br from-primary-light/20 to-primary/30 rounded-xl p-4 shadow-md backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-raleway font-semibold text-gray-800 mb-1">Mes Badges</h2>
            <p className="text-gray-600 text-sm">
              {!isBadgesLoading && badges ? (
                <>Suivez votre progression et déverrouillez des récompenses</>
              ) : (
                <>Chargement des badges...</>
              )}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm flex items-center">
            <span className="material-icons text-primary mr-2">emoji_events</span>
            <span className="font-medium">
              {!isBadgesLoading && badges ? (
                <>{getUnlockedBadges().length} / {badges.length} débloqués</>
              ) : (
                <>Chargement...</>
              )}
            </span>
          </div>
        </div>
        
        {/* Statistiques des badges par catégorie */}
        {!isBadgesLoading && badges && badges.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {['collection', 'entretien', 'analyse', 'progression'].map((category) => {
              const categoryBadges = getBadgesByCategory(category as any);
              const unlockedCount = categoryBadges.filter(b => b.unlocked).length;
              const totalCount = categoryBadges.length;
              
              return (
                <div key={category} className="bg-white/40 backdrop-blur-sm rounded-lg p-2 text-center">
                  <span className="material-icons text-sm mb-1" style={{
                    color: category === 'collection' ? '#10b981' :
                           category === 'entretien' ? '#3b82f6' :
                           category === 'analyse' ? '#8b5cf6' :
                           '#f59e0b'
                  }}>
                    {category === 'collection' ? 'eco' :
                     category === 'entretien' ? 'water_drop' :
                     category === 'analyse' ? 'search' :
                     'trending_up'}
                  </span>
                  <div className="text-xs font-medium">{unlockedCount}/{totalCount}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Tabs defaultValue="tous" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="debloqués">Débloqués</TabsTrigger>
          <TabsTrigger value="en-cours">En cours</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {isBadgesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <BadgeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {getFilteredBadges().length > 0 ? (
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <AnimatePresence>
                    {getFilteredBadges().map((badge, index) => (
                      <BadgeItem key={badge.id} badge={badge} index={index} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <span className="material-icons text-4xl text-gray-300 mb-2">
                    emoji_events
                  </span>
                  <p className="text-gray-500">
                    {activeTab === "debloqués"
                      ? "Vous n'avez pas encore débloqué de badges"
                      : activeTab === "en-cours"
                      ? "Aucun badge en cours de progression"
                      : "Aucun badge dans cette catégorie"}
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}