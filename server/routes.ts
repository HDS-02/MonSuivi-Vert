import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPlantSchema, insertTaskSchema, insertPlantAnalysisSchema, insertUserSchema, insertGrowthJournalSchema } from "@shared/schema";
import { analyzePlantImage, getPlantInfoByName } from "./openai";
import multer from "multer";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { setupAuth } from "./auth";
import { badgeService } from "./badgeService";
import { plantDatabase, searchPlants, getPlantByName, getPlantsByCategory, plantCategories } from "./plantDatabase";
import { plantDiagnosticService } from "./plantDiagnosticService";
import { qrCodeService } from "./qrCodeService";
import { sendEmail, sendTaskReminder, sendWelcomeEmail, sendPlantAddedEmail, sendPlantRemovedEmail, sendWateringReminderEmail, sendScheduledWateringNotification, sendTodayWateringReminderEmail, sendAutoWateringStatusEmail } from "./email";
import { pdfService } from "./pdfService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for in-memory file storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Setup authentication routes
  setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));
  
  // USER ROUTES
  // Middleware pour vérifier si l'utilisateur est authentifié
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Non authentifié" });
  };

  // Route pour mettre à jour un utilisateur
  app.patch("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Vérifier que l'utilisateur ne modifie que son propre compte
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID d'utilisateur invalide" });
      }

      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce compte" });
      }

      // Validation des données d'entrée - on accepte seulement username, firstName, email et reminderTime
      const userUpdateSchema = z.object({
        username: z.string().min(3).optional(),
        firstName: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
        reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      });

      const validatedData = userUpdateSchema.parse(req.body);
      
      // Mise à jour de l'utilisateur en base de données
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Retourne l'utilisateur mis à jour
      res.json(updatedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // PLANTS ROUTES
  app.get("/api/plants", async (_req: Request, res: Response) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const plant = await storage.getPlant(id);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }

      res.json(plant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plants", async (req: Request, res: Response) => {
    try {
      let validatedData = insertPlantSchema.parse(req.body);
      
      // Ajouter des informations par défaut pour les maladies fréquentes et la taille de pot
      // si elles ne sont pas déjà définies
      if (!validatedData.commonDiseases || 
          (Array.isArray(validatedData.commonDiseases) && validatedData.commonDiseases.length === 0)) {
        // Maladies communes génériques basées sur le type de plante
        let commonDiseases;
        
        // Vérifier si c'est une plante d'intérieur ou d'extérieur basé sur les termes dans le nom ou l'espèce
        const isIndoorPlant = validatedData.name.toLowerCase().includes("monstera") ||
                             validatedData.name.toLowerCase().includes("ficus") ||
                             validatedData.name.toLowerCase().includes("sansevieria") ||
                             validatedData.name.toLowerCase().includes("aglaonema") ||
                             validatedData.name.toLowerCase().includes("yucca") ||
                             validatedData.name.toLowerCase().includes("palmier") ||
                             validatedData.light?.toLowerCase().includes("indirecte");
        
        const isVegetable = validatedData.name.toLowerCase().includes("tomate") ||
                           validatedData.name.toLowerCase().includes("carotte") ||
                           validatedData.name.toLowerCase().includes("chou") ||
                           validatedData.name.toLowerCase().includes("poivron") ||
                           validatedData.name.toLowerCase().includes("haricot") ||
                           validatedData.name.toLowerCase().includes("laitue") ||
                           validatedData.name.toLowerCase().includes("salade");
        
        if (isVegetable) {
          commonDiseases = [
            {name: "Mildiou", description: "Maladie fongique qui apparaît par temps humide, formant des taches jaunes à brunes sur les feuilles", treatment: "Favoriser la circulation d'air, éviter d'arroser le feuillage et utiliser un fongicide bio si nécessaire"},
            {name: "Pucerons", description: "Petits insectes qui se nourrissent de la sève et peuvent transmettre des virus", treatment: "Pulvériser de l'eau savonneuse ou introduire des prédateurs naturels comme les coccinelles"},
            {name: "Oïdium", description: "Champignon qui forme un duvet blanc sur les feuilles", treatment: "Appliquer une solution de bicarbonate de soude ou un fongicide adapté"}
          ];
        } else if (isIndoorPlant) {
          commonDiseases = [
            {name: "Cochenilles", description: "Insectes qui forment des amas blancs cotonneux sur les feuilles", treatment: "Nettoyer avec un chiffon imbibé d'alcool à 70° ou utiliser une huile horticole"},
            {name: "Araignées rouges", description: "Minuscules acariens qui apparaissent en conditions sèches, causant des taches claires sur les feuilles", treatment: "Augmenter l'humidité ambiante et vaporiser régulièrement le feuillage"},
            {name: "Pourriture des racines", description: "Causée par un arrosage excessif, se manifeste par un jaunissement des feuilles et un pourrissement à la base", treatment: "Réduire l'arrosage et rempoter dans un substrat frais avec un bon drainage"}
          ];
        } else {
          commonDiseases = [
            {name: "Taches foliaires", description: "Diverses maladies fongiques qui causent des taches sur les feuilles", treatment: "Éliminer les feuilles affectées et éviter de mouiller le feuillage lors de l'arrosage"},
            {name: "Rouille", description: "Maladie fongique qui forme des pustules orangées sur les feuilles", treatment: "Utiliser un fongicide à base de cuivre et améliorer la circulation d'air"},
            {name: "Ravageurs divers", description: "Insectes et acariens qui peuvent endommager le feuillage", treatment: "Identifier le ravageur spécifique et traiter avec des méthodes appropriées, de préférence biologiques"}
          ];
        }
        
        validatedData.commonDiseases = commonDiseases;
      }
      
      // Ajouter une taille de pot recommandée si non définie
      if (!validatedData.potSize) {
        // Taille de pot générique basée sur le type de plante
        if (validatedData.name.toLowerCase().includes("cactus") || 
            validatedData.name.toLowerCase().includes("succulente")) {
          validatedData.potSize = "Pot de 10-15 cm de diamètre avec très bon drainage";
        } else if (validatedData.name.toLowerCase().includes("monstera") ||
                  validatedData.name.toLowerCase().includes("ficus") ||
                  validatedData.name.toLowerCase().includes("palmier")) {
          validatedData.potSize = "Pot de 25-30 cm de diamètre avec bon drainage";
        } else if (validatedData.wateringFrequency && validatedData.wateringFrequency >= 7) {
          validatedData.potSize = "Pot de 15-20 cm de diamètre avec drainage adapté";
        } else {
          validatedData.potSize = "Pot de 20-25 cm de diamètre avec bon drainage";
        }
      }
      
      const plant = await storage.createPlant(validatedData);
      
      // Envoyer un email de notification si l'utilisateur est authentifié et a configuré son email
      if (req.isAuthenticated() && req.user?.email) {
        try {
          // Envoi asynchrone pour ne pas bloquer la réponse
          sendPlantAddedEmail(req.user.email, plant)
            .then(success => {
              if (success) {
                console.log(`Email de notification d'ajout de plante envoyé avec succès à ${req.user?.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de notification d'ajout de plante:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer l'ajout de plante si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de notification d\'ajout de plante:', emailError);
        }
      }
      
      res.status(201).json(plant);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      // Récupérer la plante avant la mise à jour pour détecter les changements
      const existingPlant = await storage.getPlant(id);
      if (!existingPlant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }

      // Partial validation of the request body
      const validatedData = insertPlantSchema.partial().parse(req.body);
      
      // Vérifier si l'état d'arrosage automatique change
      const autoWateringChanged = 
        'autoWatering' in validatedData && 
        existingPlant.autoWatering !== validatedData.autoWatering;
      
      const updatedPlant = await storage.updatePlant(id, validatedData);
      if (!updatedPlant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }

      // Envoyer une notification par email si l'arrosage automatique a été modifié
      if (autoWateringChanged && req.isAuthenticated() && req.user?.email) {
        try {
          // Envoi asynchrone pour ne pas bloquer la réponse
          const isEnabled = Boolean(validatedData.autoWatering);
          
          const { sendAutoWateringStatusEmail } = await import('./email');
          sendAutoWateringStatusEmail(req.user.email, updatedPlant, isEnabled)
            .then(success => {
              if (success) {
                console.log(`Email de notification de changement d'arrosage automatique envoyé avec succès à ${req.user?.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de notification de changement d'arrosage automatique:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer la mise à jour si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de notification de changement d\'arrosage automatique:', emailError);
        }
      }

      res.json(updatedPlant);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }
      
      // Récupérer les informations de la plante avant de la supprimer
      const plantToDelete = await storage.getPlant(id);
      if (!plantToDelete) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      const plantName = plantToDelete.name;
      
      const success = await storage.deletePlant(id);
      if (!success) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Envoyer un email de notification si l'utilisateur est authentifié et a configuré son email
      if (req.isAuthenticated() && req.user?.email) {
        try {
          // Envoi asynchrone pour ne pas bloquer la réponse
          sendPlantRemovedEmail(req.user.email, plantName)
            .then(success => {
              if (success) {
                console.log(`Email de notification de suppression de plante envoyé avec succès à ${req.user?.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de notification de suppression de plante:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer la suppression de plante si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de notification de suppression de plante:', emailError);
        }
      }

      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // TASKS ROUTES
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/pending", async (_req: Request, res: Response) => {
    try {
      const pendingTasks = await storage.getPendingTasks();
      res.json(pendingTasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plants/:id/tasks", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }

      const tasks = await storage.getTasksByPlantId(plantId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      
      res.status(201).json(task);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/tasks/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const task = await storage.completeTask(id);
      if (!task) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }

      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }

      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PLANT ANALYSES ROUTES
  app.get("/api/plants/:id/analyses", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      const analyses = await storage.getPlantAnalyses(plantId);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plants/:id/analysis/latest", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      const analysis = await storage.getLatestPlantAnalysis(plantId);
      if (!analysis) {
        return res.status(404).json({ message: "Aucune analyse trouvée pour cette plante" });
      }
      
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // toggle auto watering route
  app.post("/api/plants/:id/toggle-auto-watering", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Récupérer la plante existante
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Inverser l'état de l'arrosage automatique
      const newAutoWateringState = !plant.autoWatering;
      
      // Mettre à jour la plante en base de données
      const updatedPlant = await storage.updatePlant(plantId, {
        autoWatering: newAutoWateringState
      });
      
      console.log(`Demande de modification de l'arrosage automatique pour la plante ${plantId}: ${newAutoWateringState ? 'Activation' : 'Désactivation'}`);
      
      // Si l'arrosage automatique est activé, nous générons les tâches à venir
      if (newAutoWateringState && plant.wateringFrequency) {
        try {
          console.log(`Génération de tâches d'arrosage automatique pour la plante ${plant.name} (ID: ${plantId})`);
          
          // Obtenir la date du jour
          const today = new Date();
          
          // Calculer la prochaine date d'arrosage (aujourd'hui + fréquence d'arrosage)
          const nextWateringDate = new Date(today);
          nextWateringDate.setDate(today.getDate() + plant.wateringFrequency);
          
          // Créer une tâche d'arrosage pour cette date
          const task = await storage.createTask({
            plantId,
            type: 'water',
            description: `Arrosage programmé pour ${plant.name}`,
            dueDate: nextWateringDate,
          });
          
          console.log(`Création de 1 nouvelles tâches d'arrosage automatique`);
          console.log(`✅ Arrosage programmé pour ${plant.name} le ${nextWateringDate.toLocaleDateString('fr-FR')}`);
          
          // Envoyer un email de notification des arrosages programmés
          if (req.isAuthenticated() && req.user?.email) {
            try {
              const { sendScheduledWateringNotification } = await import('./email');
              sendScheduledWateringNotification(req.user.email, plant, [nextWateringDate])
                .then(success => {
                  if (success) {
                    console.log(`Email de notification d'arrosages programmés envoyé à ${req.user?.email}`);
                  }
                })
                .catch(emailError => {
                  console.error(`Erreur lors de l'envoi de l'email de notification d'arrosages programmés:`, emailError);
                });
            } catch (emailError) {
              console.error('Erreur lors de l\'envoi de l\'email de notification d\'arrosages programmés:', emailError);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la génération des tâches d\'arrosage automatique:', error);
          // On continue le processus même si la génération des tâches échoue
        }
      }
      
      // Envoyer une notification par email si l'utilisateur est authentifié et a configuré son email
      if (req.isAuthenticated() && req.user?.email) {
        try {
          // Envoi asynchrone pour ne pas bloquer la réponse
          const isEnabled = newAutoWateringState;
          
          const { sendAutoWateringStatusEmail } = await import('./email');
          sendAutoWateringStatusEmail(req.user.email, plant, isEnabled)
            .then(success => {
              if (success) {
                console.log(`Email de notification de changement d'arrosage automatique envoyé avec succès à ${req.user?.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de notification de changement d'arrosage automatique:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer la mise à jour si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de notification de changement d\'arrosage automatique:', emailError);
        }
      }
      
      res.json({ 
        message: `Arrosage automatique ${newAutoWateringState ? 'activé' : 'désactivé'} avec succès`,
        autoWatering: newAutoWateringState 
      });
    } catch (error: any) {
      console.error('Erreur lors de la modification de l\'arrosage automatique:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Route pour mettre à jour l'heure de rappel d'arrosage d'une plante
  app.patch("/api/plants/:id/reminder-time", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Récupérer la plante existante
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire de la plante
      if (req.user?.id !== plant.userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette plante" });
      }
      
      const { reminderTime } = req.body;
      
      // Validation simple du format heure (HH:MM)
      if (!reminderTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
        return res.status(400).json({ message: "Format d'heure invalide. Utilisez HH:MM" });
      }
      
      // Mettre à jour l'heure de rappel
      const updatedPlant = await storage.updatePlant(plantId, { 
        reminderTime 
      });
      
      if (!updatedPlant) {
        return res.status(404).json({ message: "Échec de la mise à jour" });
      }
      
      console.log(`Heure de rappel mise à jour pour la plante ${plantId} (${plant.name}): ${reminderTime}`);
      
      res.json({ 
        message: "Heure de rappel mise à jour avec succès",
        reminderTime: updatedPlant.reminderTime
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'heure de rappel:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Autres routes PLANT INFO, DIAGNOSTICS, DATABASE, etc.
  
  // UTIL ROUTES

  // Autres routes EMAIL, QR Code, PDF, etc.

  // Route pour mettre à jour l'heure de rappel globale d'un utilisateur
  app.patch("/api/users/:id/reminder-time", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID d'utilisateur invalide" });
      }
      
      // Vérifier que l'utilisateur ne modifie que son propre compte
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce compte" });
      }
      
      const { reminderTime } = req.body;
      
      // Validation simple du format heure (HH:MM)
      if (!reminderTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
        return res.status(400).json({ message: "Format d'heure invalide. Utilisez HH:MM" });
      }
      
      // Mettre à jour l'utilisateur
      const updatedUser = await storage.updateUser(userId, { reminderTime });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json({ 
        message: "Heure de rappel mise à jour avec succès",
        reminderTime: updatedUser.reminderTime
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}