import { Badge } from "@shared/schema";

// Liste des badges disponibles dans l'application
const availableBadges: Omit<Badge, "unlocked" | "unlockedAt">[] = [
  // Badges de collection de plantes
  {
    id: "plant-collector-1",
    name: "Premier pas vert",
    description: "Ajoutez votre première plante à l'application",
    icon: "local_florist",
    category: "collection",
    progress: 0,
    maxProgress: 1
  },
  {
    id: "plant-collector-5",
    name: "Jardinier amateur",
    description: "Constituez une collection de 5 plantes",
    icon: "eco",
    category: "collection",
    progress: 0,
    maxProgress: 5
  },
  {
    id: "plant-collector-10",
    name: "Jardinier passionné",
    description: "Constituez une collection de 10 plantes",
    icon: "yard",
    category: "collection",
    progress: 0,
    maxProgress: 10
  },
  
  // Badges de tâches d'entretien
  {
    id: "task-complete-1",
    name: "Premier soin",
    description: "Complétez votre première tâche d'entretien",
    icon: "task_alt",
    category: "entretien",
    progress: 0,
    maxProgress: 1
  },
  {
    id: "task-complete-10",
    name: "Soigneur attentif",
    description: "Complétez 10 tâches d'entretien",
    icon: "checklist",
    category: "entretien",
    progress: 0,
    maxProgress: 10
  },
  {
    id: "task-streak-7",
    name: "Constance verte",
    description: "Complétez au moins une tâche par jour pendant 7 jours consécutifs",
    icon: "sprint",
    category: "entretien",
    progress: 0,
    maxProgress: 7
  },
  
  // Badges de diagnostic SOS (remplaçant les badges d'analyse)
  {
    id: "sos-diagnostic-1",
    name: "Premier secours",
    description: "Utilisez SOS Assistance Plante pour la première fois",
    icon: "health_and_safety",
    category: "entretien",
    progress: 0,
    maxProgress: 1
  },
  {
    id: "sos-diagnostic-5",
    name: "Médecin des plantes",
    description: "Diagnostiquez 5 problèmes différents avec SOS Assistance",
    icon: "healing",
    category: "entretien",
    progress: 0,
    maxProgress: 5
  },
  
  // Badges de progression
  {
    id: "login-streak-7",
    name: "Fidélité hebdomadaire",
    description: "Connectez-vous à l'application 7 jours consécutifs",
    icon: "calendar_month",
    category: "progression",
    progress: 0,
    maxProgress: 7
  },
  {
    id: "healthy-plants-5",
    name: "Main verte",
    description: "Maintenez 5 plantes en parfaite santé simultanément",
    icon: "favorite",
    category: "progression",
    progress: 0,
    maxProgress: 5
  }
];

// Map pour stocker les badges des utilisateurs (dans une application réelle, cela serait en base de données)
// On utilise un objet global pour persister les badges entre les redémarrages de l'application
// Dans une application réelle, on utiliserait une base de données
const userBadges: Map<number, Badge[]> = new Map();

// Initialisation des badges pour l'utilisateur par défaut (pour la démonstration)
// ID utilisateur = 1 pour l'utilisateur de démonstration
const initDemoBadges = () => {
  // Badge de bienvenue
  const demoBadges = availableBadges.map(badge => {
    // Débloquons un badge d'exemple pour l'utilisateur de démo
    if (badge.id === "plant-collector-1") {
      return {
        ...badge,
        unlocked: true,
        unlockedAt: new Date(),
        progress: badge.maxProgress
      };
    }
    // Badge en progression
    if (badge.id === "task-completion-5") {
      return {
        ...badge,
        unlocked: false,
        progress: 2
      };
    }
    return {
      ...badge,
      unlocked: false
    };
  });
  userBadges.set(1, demoBadges);
};

// Initialisation des badges de démo
initDemoBadges();

export class BadgeService {
  /**
   * Vérifie et met à jour les badges liés aux analyses de plantes
   */
  public checkAnalysisBadges(userId: number, analysisCount: number): Badge[] {
    // Rediriger vers la méthode SOS diagnostic car nous avons remplacé les analyses par les diagnostics
    return this.checkSOSDiagnosticBadges(userId, analysisCount);
  }
  /**
   * Récupère les badges d'un utilisateur
   */
  public getBadgesByUserId(userId: number): Badge[] {
    if (!userBadges.has(userId)) {
      // Initialiser les badges pour l'utilisateur s'ils n'existent pas encore
      const badges = availableBadges.map(badge => ({
        ...badge,
        unlocked: false
      }));
      userBadges.set(userId, badges);
    }
    
    return userBadges.get(userId) || [];
  }

  /**
   * Débloque un badge spécifique pour un utilisateur
   */
  public unlockBadge(userId: number, badgeId: string): Badge | null {
    const badges = this.getBadgesByUserId(userId);
    const badgeIndex = badges.findIndex(badge => badge.id === badgeId);
    
    if (badgeIndex === -1) return null;
    
    const badge = badges[badgeIndex];
    if (badge.unlocked) return badge; // Déjà débloqué
    
    const updatedBadge: Badge = {
      ...badge,
      unlocked: true,
      unlockedAt: new Date(),
      progress: badge.maxProgress,
    };
    
    badges[badgeIndex] = updatedBadge;
    userBadges.set(userId, badges);
    
    return updatedBadge;
  }

  /**
   * Met à jour la progression d'un badge
   */
  public updateBadgeProgress(userId: number, badgeId: string, progress: number): Badge | null {
    const badges = this.getBadgesByUserId(userId);
    const badgeIndex = badges.findIndex(badge => badge.id === badgeId);
    
    if (badgeIndex === -1) return null;
    
    const badge = badges[badgeIndex];
    if (badge.unlocked) return badge; // Déjà débloqué
    
    const updatedProgress = Math.min(progress, badge.maxProgress || 0);
    const shouldUnlock = updatedProgress >= (badge.maxProgress || 0);
    
    const updatedBadge: Badge = {
      ...badge,
      unlocked: shouldUnlock,
      progress: updatedProgress,
      unlockedAt: shouldUnlock ? new Date() : undefined
    };
    
    badges[badgeIndex] = updatedBadge;
    userBadges.set(userId, badges);
    
    return updatedBadge;
  }

  /**
   * Vérifie et met à jour les badges liés à la collection de plantes
   */
  public checkPlantCollectionBadges(userId: number, plantCount: number): Badge[] {
    const unlockedBadges: Badge[] = [];
    
    // Badges à vérifier
    const badgesToCheck = [
      { id: "plant-collector-1", threshold: 1 },
      { id: "plant-collector-5", threshold: 5 },
      { id: "plant-collector-10", threshold: 10 }
    ];
    
    for (const badgeInfo of badgesToCheck) {
      const updatedBadge = this.updateBadgeProgress(userId, badgeInfo.id, plantCount);
      
      if (updatedBadge && updatedBadge.unlocked && updatedBadge.unlockedAt) {
        // Vérifier si le badge vient juste d'être débloqué
        const justUnlocked = new Date().getTime() - updatedBadge.unlockedAt.getTime() < 5000;
        if (justUnlocked) {
          unlockedBadges.push(updatedBadge);
        }
      }
    }
    
    return unlockedBadges;
  }

  /**
   * Vérifie et met à jour les badges liés aux diagnostics SOS
   */
  public checkSOSDiagnosticBadges(userId: number, diagnosticCount: number): Badge[] {
    const unlockedBadges: Badge[] = [];
    
    // Badges à vérifier
    const badgesToCheck = [
      { id: "sos-diagnostic-1", threshold: 1 },
      { id: "sos-diagnostic-5", threshold: 5 }
    ];
    
    for (const badgeInfo of badgesToCheck) {
      const updatedBadge = this.updateBadgeProgress(userId, badgeInfo.id, diagnosticCount);
      
      if (updatedBadge && updatedBadge.unlocked && updatedBadge.unlockedAt) {
        // Vérifier si le badge vient juste d'être débloqué
        const justUnlocked = new Date().getTime() - updatedBadge.unlockedAt.getTime() < 5000;
        if (justUnlocked) {
          unlockedBadges.push(updatedBadge);
        }
      }
    }
    
    return unlockedBadges;
  }

  /**
   * Vérifie et met à jour les badges liés à la complétion de tâches
   */
  public checkTaskCompletionBadges(userId: number, taskCount: number): Badge[] {
    const unlockedBadges: Badge[] = [];
    
    // Badges à vérifier
    const badgesToCheck = [
      { id: "task-complete-1", threshold: 1 },
      { id: "task-complete-10", threshold: 10 }
    ];
    
    for (const badgeInfo of badgesToCheck) {
      const updatedBadge = this.updateBadgeProgress(userId, badgeInfo.id, taskCount);
      
      if (updatedBadge && updatedBadge.unlocked && updatedBadge.unlockedAt) {
        // Vérifier si le badge vient juste d'être débloqué
        const justUnlocked = new Date().getTime() - updatedBadge.unlockedAt.getTime() < 5000;
        if (justUnlocked) {
          unlockedBadges.push(updatedBadge);
        }
      }
    }
    
    return unlockedBadges;
  }

  /**
   * Vérifie et met à jour le badge des plantes en bonne santé
   */
  public checkHealthyPlantsBadge(userId: number, healthyPlantsCount: number): Badge | null {
    const updatedBadge = this.updateBadgeProgress(userId, "healthy-plants-5", healthyPlantsCount);
    
    if (updatedBadge && updatedBadge.unlocked && updatedBadge.unlockedAt) {
      // Vérifier si le badge vient juste d'être débloqué
      const justUnlocked = new Date().getTime() - updatedBadge.unlockedAt.getTime() < 5000;
      if (justUnlocked) {
        return updatedBadge;
      }
    }
    
    return updatedBadge;
  }

  /**
   * Met à jour le badge de connexion consécutive
   */
  public updateConsecutiveLoginBadge(userId: number, days: number): Badge | null {
    const updatedBadge = this.updateBadgeProgress(userId, "login-streak-7", days);
    
    if (updatedBadge && updatedBadge.unlocked && updatedBadge.unlockedAt) {
      // Vérifier si le badge vient juste d'être débloqué
      const justUnlocked = new Date().getTime() - updatedBadge.unlockedAt.getTime() < 5000;
      if (justUnlocked) {
        return updatedBadge;
      }
    }
    
    return updatedBadge;
  }
}

// Singleton pour être utilisé dans toute l'application
export const badgeService = new BadgeService();