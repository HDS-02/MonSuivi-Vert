import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPlantSchema, 
  insertTaskSchema, 
  insertPlantAnalysisSchema, 
  insertUserSchema, 
  insertGrowthJournalSchema,
  insertCommunityTipSchema,
  insertCommunityCommentSchema
} from "@shared/schema";
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
import { sendEmail, sendTaskReminder, sendWelcomeEmail, sendPlantAddedEmail, sendPlantRemovedEmail, sendWateringReminderEmail, sendScheduledWateringNotification, sendTodayWateringReminderEmail, sendAutoWateringStatusEmail, sendResetPasswordEmail } from "./email";
import { pdfService } from "./pdfService";
import crypto from "crypto";

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
  
  // Route pour l'analyse d'image de plante et upload
  app.post("/api/analyze", upload.single("image"), async (req: Request, res: Response) => {
    try {
      console.log("Requête d'analyse d'image reçue");
      
      if (!req.file) {
        return res.status(400).json({ message: "Aucune image n'a été fournie" });
      }
      
      // Générer un nom de fichier unique
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${nanoid()}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Enregistrer le fichier
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Chemin relatif pour l'accès via URL
      const relativePath = path.join('/uploads', fileName);
      
      // Description fournie par l'utilisateur (optionnelle)
      const description = req.body.description || '';
      
      // Analyser l'image (version simplifiée sans API externe)
      const analysisResult = {
        name: description || "Plante",
        species: "",
        healthStatus: "healthy",
        recommendations: [
          "Assurez-vous d'arroser régulièrement votre plante",
          "Placez votre plante dans un endroit avec la luminosité appropriée",
          "Vérifiez régulièrement l'absence de parasites sur les feuilles"
        ],
        imagePath: relativePath
      };
      
      console.log(`Image enregistrée: ${relativePath}`);
      res.status(200).json({
        message: "Image analysée avec succès",
        imagePath: relativePath,
        analysis: analysisResult
      });
      
    } catch (error: any) {
      console.error("Erreur lors de l'analyse de l'image:", error);
      res.status(500).json({ message: error.message });
    }
  });

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
  // Route pour récupérer les catégories de plantes
  app.get("/api/plant-categories", async (_req: Request, res: Response) => {
    try {
      // Importer les catégories depuis le module de base de données
      const { plantCategories } = await import('./plantDatabase');
      console.log("Envoi des catégories de plantes:", plantCategories.length);
      res.json(plantCategories);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des catégories de plantes:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour récupérer les plantes par catégorie
  app.get("/api/plant-database/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      // Valider que la catégorie est bien une catégorie valide
      if (!['interieur', 'exterieur', 'fruitier', 'fleurs', 'legumes'].includes(category)) {
        return res.status(400).json({ message: "Catégorie invalide" });
      }
      
      // Importer la fonction depuis le module de base de données
      const { getPlantsByCategory } = await import('./plantDatabase');
      
      // Récupérer les plantes de la catégorie
      const plants = getPlantsByCategory(category as any);
      console.log(`Envoi de ${plants.length} plantes de la catégorie ${category}`);
      
      res.json(plants);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des plantes par catégorie:", error);
      res.status(500).json({ message: error.message });
    }
  });

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
      console.log("Requête d'ajout de plante reçue:", JSON.stringify(req.body));
      
      // Initialiser les valeurs par défaut pour les champs essentiels
      const plantData = {
        ...req.body,
        autoWatering: req.body.autoWatering !== undefined ? req.body.autoWatering : false,
        reminderTime: req.body.reminderTime || "08:00"
      };
      
      console.log("Données normalisées pour l'ajout:", JSON.stringify(plantData));
      
      let validatedData = insertPlantSchema.parse(plantData);
      
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
          const { sendPlantAddedEmail } = await import('./email');
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
      
      // Ne modifions pas l'état d'arrosage automatique si pas explicitement demandé
      // Cette modification pourrait interférer avec l'API dédiée à la bascule d'arrosage
      // Nous autorisons uniquement la modification explicite (quand la clé autoWatering est fournie)
      if (!('autoWatering' in validatedData)) {
        console.log(`Mise à jour sans modification explicite de l'arrosage automatique. Préservation de l'état: ${existingPlant.autoWatering}`);
        // On ne modifie pas validatedData.autoWatering pour laisser le comportement par défaut s'appliquer
      }
      
      // Vérifier si l'état d'arrosage automatique change
      const autoWateringChanged = 
        'autoWatering' in validatedData && 
        existingPlant.autoWatering !== validatedData.autoWatering;
      
      console.log("Données de mise à jour:", JSON.stringify(validatedData));
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
          const { sendPlantRemovedEmail } = await import('./email');
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
      
      console.log(`État actuel de l'arrosage automatique pour la plante ${plantId}: ${plant.autoWatering}`);
      console.log(`Nouvel état demandé: ${newAutoWateringState}`);
      
      // Mettre à jour la plante en base de données avec une valeur explicite pour éviter les ambiguïtés
      const updatedPlant = await storage.updatePlant(plantId, {
        autoWatering: Boolean(newAutoWateringState)
      });
      
      console.log(`État après mise à jour: ${updatedPlant.autoWatering}`);
      
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

  // Route pour envoyer un email de rappel d'arrosage à l'heure spécifiée
  app.post("/api/plants/send-watering-reminder", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { plantId, reminderTime } = req.body;
      
      if (!plantId) {
        return res.status(400).json({ message: "ID de plante manquant" });
      }
      
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire de la plante
      if (req.user?.id !== plant.userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette action" });
      }
      
      // Récupérer l'email de l'utilisateur
      const user = await storage.getUser(req.user.id);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Adresse email de l'utilisateur manquante" });
      }
      
      // Envoyer un email de test pour confirmer les rappels d'arrosage
      await sendWateringReminderEmail(user.email, [plant]);
      
      // Ajouter un message dans les logs
      console.log(`Email de rappel d'arrosage pour ${plant.name} envoyé à ${user.email}, programmé à ${reminderTime || plant.reminderTime || "08:00"}`);
      
      return res.status(200).json({ 
        message: "Email de rappel envoyé avec succès", 
        reminderTime: reminderTime || plant.reminderTime || "08:00"
      });
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du rappel d'arrosage:", error);
      return res.status(500).json({ message: error.message || "Erreur serveur" });
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
      
      const oldReminderTime = plant.reminderTime || "08:00";
      
      // Mettre à jour l'heure de rappel en conservant l'état d'arrosage automatique
      // Vérifier si une valeur d'arrosage automatique a été fournie explicitement
      const autoWatering = req.body.autoWatering !== undefined ? req.body.autoWatering : plant.autoWatering;
      
      console.log(`Mise à jour de la plante ${plantId}: reminderTime=${reminderTime}, autoWatering=${autoWatering} (valeur précédente: ${plant.autoWatering})`);
      
      const updatedPlant = await storage.updatePlant(plantId, { 
        reminderTime,
        autoWatering // Utiliser la valeur fournie ou conserver l'état existant
      });
      
      if (!updatedPlant) {
        return res.status(404).json({ message: "Échec de la mise à jour" });
      }
      
      console.log(`Heure de rappel mise à jour pour la plante ${plantId} (${plant.name}): ${reminderTime}`);
      
      // Envoyer un email de notification si l'utilisateur est authentifié et a configuré son email
      if (req.isAuthenticated() && req.user?.email) {
        try {
          // Créer un modèle d'email personnalisé pour la notification de changement d'heure
          const emailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background-color: #2196F3; border-radius: 50%; width: 70px; height: 70px; line-height: 70px; text-align: center; margin-bottom: 10px;">
                  <span style="color: white; font-size: 36px;">🕒</span>
                </div>
                <h2 style="color: #2196F3; margin: 10px 0 0;">Heure de rappel modifiée</h2>
              </div>
              
              <p style="font-size: 16px; color: #333; line-height: 1.5;">Bonjour,</p>
              <p style="font-size: 16px; color: #333; line-height: 1.5;">
                L'heure de rappel d'arrosage pour votre plante <strong style="color: #2196F3;">${plant.name}</strong> a été modifiée avec succès.
              </p>
              
              <div style="margin: 25px 0; padding: 20px; border-radius: 8px; background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%); border-left: 4px solid #2196F3;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                      <strong style="font-size: 15px; color: #455A64;">Ancienne heure :</strong>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); text-align: right;">
                      <span style="font-size: 15px; color: #78909C; font-family: monospace; background-color: rgba(255,255,255,0.5); padding: 4px 8px; border-radius: 4px;">
                        ${oldReminderTime}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px;">
                      <strong style="font-size: 15px; color: #455A64;">Nouvelle heure :</strong>
                    </td>
                    <td style="padding: 10px; text-align: right;">
                      <span style="font-size: 15px; font-weight: bold; color: #2196F3; font-family: monospace; background-color: rgba(255,255,255,0.7); padding: 4px 8px; border-radius: 4px; border: 1px solid #BBDEFB;">
                        ${reminderTime}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <p style="margin: 0; font-size: 15px; color: #2E7D32;">
                  <strong>✅ Modification effectuée :</strong> Vous recevrez désormais les rappels d'arrosage à <strong>${reminderTime}</strong> les jours prévus.
                </p>
                ${plant.autoWatering ? 
                  `<p style="margin: 8px 0 0; font-size: 14px; color: #388E3C;">
                    <span style="display: inline-block; background-color: #4CAF50; color: white; border-radius: 4px; padding: 2px 6px; font-size: 12px; margin-right: 5px;">AUTO</span>
                    L'arrosage automatique est activé pour cette plante.
                  </p>` : 
                  `<p style="margin: 8px 0 0; font-size: 14px; color: #F44336;">
                    <span style="display: inline-block; background-color: #F44336; color: white; border-radius: 4px; padding: 2px 6px; font-size: 12px; margin-right: 5px;">INFO</span>
                    Cette modification prendra effet lorsque vous activerez l'arrosage automatique.
                  </p>`
                }
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://monsuivivert.fr/plants/${plant.id}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Voir ma plante
                </a>
              </div>
              
              <p style="font-style: italic; color: #757575; margin-top: 30px; font-size: 0.9em; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                Cet email est envoyé automatiquement par Mon Suivi Vert.
              </p>
            </div>
          `;
          
          const emailOptions = {
            to: req.user.email,
            subject: `Modification de l'heure de rappel pour ${plant.name}`,
            html: emailContent
          };
          
          const { sendEmail } = await import('./email');
          sendEmail(emailOptions)
            .then(success => {
              if (success) {
                console.log(`Email de notification de changement d'heure de rappel envoyé avec succès à ${req.user?.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de notification de changement d'heure de rappel:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer la mise à jour si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de notification de changement d\'heure de rappel:', emailError);
        }
      }
      
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
  
  // Route pour générer un QR code pour une plante
  app.get("/api/plants/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier que la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Taille du QR code (optionnel)
      const size = req.query.size ? parseInt(req.query.size as string) : 300;
      
      // Générer le QR code
      const qrCodeData = await qrCodeService.generatePlantQRCode(plantId, size);
      
      // Vérifier le format demandé (image ou JSON)
      const format = req.query.format || 'json';
      
      if (format === 'image') {
        // Renvoyer l'image directement
        const base64Data = qrCodeData.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
      } else {
        // Renvoyer les données en JSON
        res.json({ 
          qrcode: qrCodeData,
          plantId,
          plantName: plant.name
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la génération du QR code:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour générer un QR code SVG pour une plante
  app.get("/api/plants/:id/qrcode/svg", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier que la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Générer le QR code SVG
      const svgContent = await qrCodeService.generatePlantQRCodeSVG(plantId);
      
      // Renvoyer le SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } catch (error: any) {
      console.error("Erreur lors de la génération du QR code SVG:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Route pour générer un PDF pour une plante
  app.get("/api/plants/:id/pdf", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier que la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Générer le PDF
      const pdfBuffer = await pdfService.generatePlantPDF(plantId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="plante-${plantId}-${plant.name}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Erreur lors de la génération du PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

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

  // Route pour le diagnostic SOS d'une plante
  app.post("/api/plants/:id/sos-diagnostic", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier que la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Valider les données du formulaire avec Zod
      const diagnosticInputSchema = z.object({
        plantId: z.number(),
        plantName: z.string(),
        plantSpecies: z.string().optional(),
        lastWatering: z.string(),
        environment: z.object({
          directSunlight: z.boolean(),
          brightIndirect: z.boolean(),
          lowLight: z.boolean()
        }),
        temperature: z.string(),
        symptoms: z.object({
          yellowLeaves: z.boolean(),
          brownSpots: z.boolean(),
          droppingLeaves: z.boolean(),
          dryLeaves: z.boolean(),
          moldOrFungus: z.boolean(),
          insects: z.boolean(),
          slowGrowth: z.boolean(),
          rootIssues: z.boolean()
        }),
        additionalNotes: z.string().optional()
      });
      
      // Valider les données
      const input = diagnosticInputSchema.parse(req.body);
      
      // Générer le diagnostic
      const diagnostic = plantDiagnosticService.generateDiagnosis(input);
      
      // Mettre à jour les badges liés aux diagnostics SOS
      const userId = req.user?.id;
      if (userId) {
        // Incrémenter le compteur de diagnostics pour ce badge
        const userBadges = badgeService.getBadgesByUserId(userId);
        const sosDiagnosticBadge = userBadges.find(b => b.id === "sos-diagnostic-1" || b.id === "sos-diagnostic-5");
        
        if (sosDiagnosticBadge) {
          const progress = (sosDiagnosticBadge.progress || 0) + 1;
          const unlockedBadges = badgeService.checkSOSDiagnosticBadges(userId, progress);
          
          if (unlockedBadges.length > 0) {
            console.log("Badges débloqués:", unlockedBadges);
          }
        }
      }
      
      res.json(diagnostic);
    } catch (error: any) {
      console.error("Erreur lors du diagnostic SOS:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données invalides pour le diagnostic", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // BADGES ROUTES
  // Route pour récupérer tous les badges d'un utilisateur
  app.get("/api/badges", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const badges = badgeService.getBadgesByUserId(userId);
      res.json(badges);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des badges:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Route pour mettre à jour les badges liés à la collection de plantes
  app.post("/api/badges/update-plant-collection", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      // Récupérer le nombre de plantes de l'utilisateur
      const userPlants = await storage.getPlantsByUserId(userId);
      const plantCount = userPlants.length;
      
      // Mettre à jour les badges en fonction du nombre de plantes
      const unlockedBadges = badgeService.checkPlantCollectionBadges(userId, plantCount);
      
      res.json({ unlockedBadges });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour des badges de collection:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Route pour mettre à jour les badges liés aux tâches
  app.post("/api/badges/update-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      // Récupérer toutes les tâches pour calculer le nombre total et complétées
      const userPlants = await storage.getPlantsByUserId(userId);
      const plantIds = userPlants.map(p => p.id);
      let completedTaskCount = 0;
      
      for (const plantId of plantIds) {
        const tasks = await storage.getTasksByPlantId(plantId);
        completedTaskCount += tasks.filter(t => t.completed).length;
      }
      
      // Mettre à jour les badges en fonction du nombre de tâches complétées
      const unlockedBadges = badgeService.checkTaskCompletionBadges(userId, completedTaskCount);
      
      res.json({ unlockedBadges });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour des badges de tâches:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Route pour mettre à jour le badge de connexion consécutive
  app.post("/api/badges/login-streak", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      // Valider le nombre de jours de connexion consécutifs
      const daysSchema = z.object({
        days: z.number().int().positive()
      });
      
      const { days } = daysSchema.parse(req.body);
      
      // Mettre à jour le badge de connexion consécutive
      const updatedBadge = badgeService.updateConsecutiveLoginBadge(userId, days);
      
      res.json({ 
        updatedBadge,
        unlockedBadges: updatedBadge && updatedBadge.unlocked ? [updatedBadge] : []
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur lors de la mise à jour du badge de connexion:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Route pour déclencher les rappels d'arrosage (peut être utilisée pour un cron job)
  app.post("/api/system/trigger-watering-reminders", async (req: Request, res: Response) => {
    try {
      // Vérifier si on a un code secret dans la requête (pour sécuriser l'appel)
      // Pour les appels internes depuis le serveur, on accepte 'internal-cron' comme valeur par défaut
      const { secret } = req.body;
      const internalSecret = process.env.CRON_SECRET || 'internal-cron';
      if (secret !== internalSecret && !req.isAuthenticated()) {
        return res.status(403).json({ message: "Non autorisé" });
      }
      
      console.log("Déclenchement des rappels d'arrosage à l'heure programmée");
      
      // Obtenir l'heure actuelle au format HH:MM
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`Heure actuelle: ${currentTime}`);
      
      // Récupérer toutes les plantes qui ont une heure de rappel correspondant à l'heure actuelle
      // et qui ont l'arrosage automatique activé
      const allPlants = await storage.getPlants();
      const plantsToNotify = allPlants.filter(plant => 
        plant.reminderTime === currentTime && 
        plant.autoWatering === true
      );
      
      console.log(`Nombre de plantes à notifier: ${plantsToNotify.length}`);
      
      if (plantsToNotify.length === 0) {
        return res.json({ 
          message: "Aucune plante à notifier à cette heure",
          time: currentTime
        });
      }
      
      // Regrouper les plantes par utilisateur
      const plantsByUser = new Map<number, any[]>();
      for (const plant of plantsToNotify) {
        if (!plantsByUser.has(plant.userId)) {
          plantsByUser.set(plant.userId, []);
        }
        plantsByUser.get(plant.userId)?.push(plant);
      }
      
      // Pour chaque utilisateur, envoyer un email avec ses plantes à arroser
      const emailPromises = [];
      let emailsSent = 0;
      
      for (const [userId, plants] of plantsByUser.entries()) {
        // Récupérer l'utilisateur
        const user = await storage.getUser(userId);
        if (user && user.email) {
          // Envoyer l'email à l'utilisateur
          console.log(`Envoi d'un email de rappel d'arrosage à ${user.email} pour ${plants.length} plantes`);
          emailPromises.push(
            sendWateringReminderEmail(user.email, plants)
              .then(success => {
                if (success) {
                  emailsSent++;
                  console.log(`Email de rappel envoyé avec succès à ${user.email}`);
                }
                return success;
              })
              .catch(error => {
                console.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, error);
                return false;
              })
          );
        }
      }
      
      // Attendre que tous les emails soient envoyés
      await Promise.all(emailPromises);
      
      return res.json({
        message: "Rappels d'arrosage envoyés",
        plantsCount: plantsToNotify.length,
        usersCount: plantsByUser.size,
        emailsSent,
        time: currentTime
      });
    } catch (error: any) {
      console.error("Erreur lors du déclenchement des rappels d'arrosage:", error);
      return res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // ROUTES POUR LES FONCTIONNALITÉS COMMUNAUTAIRES
  
  // Récupérer tous les conseils approuvés
  app.get("/api/community/tips", async (req: Request, res: Response) => {
    try {
      // Vérifier s'il y a un paramètre de catégorie
      const category = req.query.category as string;
      if (category) {
        const tips = await storage.getCommunityTipsByCategory(category);
        return res.json(tips);
      }
      
      // S'il y a un paramètre de recherche
      const query = req.query.search as string;
      if (query) {
        const tips = await storage.searchCommunityTips(query);
        return res.json(tips);
      }
      
      // Récupérer tous les conseils
      const tips = await storage.getCommunityTips();
      res.json(tips);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conseils:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupérer les conseils populaires
  app.get("/api/community/tips/popular", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const tips = await storage.getPopularCommunityTips(limit);
      res.json(tips);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conseils populaires:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupérer les conseils d'un utilisateur
  app.get("/api/community/tips/user/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Vérifier que l'utilisateur récupère ses propres conseils ou est un administrateur
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Non autorisé à accéder aux conseils de cet utilisateur" });
      }
      
      const tips = await storage.getCommunityTipsByUserId(userId);
      res.json(tips);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des conseils de l'utilisateur:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupérer un conseil spécifique
  app.get("/api/community/tips/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      const tip = await storage.getCommunityTipById(id);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier si le conseil est approuvé ou si l'utilisateur est l'auteur
      if (!tip.approved && (!req.isAuthenticated() || req.user?.id !== tip.userId)) {
        return res.status(403).json({ message: "Ce conseil n'est pas encore approuvé" });
      }
      
      res.json(tip);
    } catch (error: any) {
      console.error("Erreur lors de la récupération du conseil:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Créer un nouveau conseil
  app.post("/api/community/tips", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validation des données
      const validatedData = insertCommunityTipSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      
      // Créer le conseil
      const newTip = await storage.createCommunityTip(validatedData);
      res.status(201).json(newTip);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur lors de la création du conseil:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Mettre à jour un conseil
  app.patch("/api/community/tips/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      // Récupérer le conseil existant
      const tip = await storage.getCommunityTipById(id);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier que l'utilisateur est l'auteur du conseil ou un administrateur
      if (tip.userId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Non autorisé à modifier ce conseil" });
      }
      
      // Validation des données
      const updateSchema = z.object({
        title: z.string().min(5).max(100).optional(),
        content: z.string().min(20).max(5000).optional(),
        imageUrl: z.string().url().nullable().optional(),
        plantSpecies: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        category: z.string().nullable().optional(),
        approved: z.boolean().optional(), // Seuls les admins peuvent modifier ceci
      });
      
      // Si l'utilisateur n'est pas admin, retirer le champ approved
      if (!req.user?.isAdmin && 'approved' in req.body) {
        delete req.body.approved;
      }
      
      const validatedData = updateSchema.parse(req.body);
      
      // Mettre à jour le conseil
      const updatedTip = await storage.updateCommunityTip(id, validatedData);
      res.json(updatedTip);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur lors de la mise à jour du conseil:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Supprimer un conseil
  app.delete("/api/community/tips/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      // Récupérer le conseil existant
      const tip = await storage.getCommunityTipById(id);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier que l'utilisateur est l'auteur du conseil ou un administrateur
      if (tip.userId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Non autorisé à supprimer ce conseil" });
      }
      
      // Supprimer le conseil
      await storage.deleteCommunityTip(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du conseil:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Voter pour un conseil
  app.post("/api/community/tips/:id/vote", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      // Validation des données
      const voteSchema = z.object({
        value: z.union([z.literal(1), z.literal(-1)])
      });
      
      const { value } = voteSchema.parse(req.body);
      
      // Récupérer le conseil existant
      const tip = await storage.getCommunityTipById(id);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier que le conseil est approuvé
      if (!tip.approved) {
        return res.status(403).json({ message: "Ce conseil n'est pas encore approuvé" });
      }
      
      // Voter pour le conseil
      const updatedTip = await storage.voteCommunityTip(id, value);
      res.json(updatedTip);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur lors du vote pour le conseil:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupérer les commentaires d'un conseil
  app.get("/api/community/tips/:id/comments", async (req: Request, res: Response) => {
    try {
      const tipId = parseInt(req.params.id);
      if (isNaN(tipId)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      // Récupérer le conseil existant
      const tip = await storage.getCommunityTipById(tipId);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier si le conseil est approuvé ou si l'utilisateur est l'auteur
      if (!tip.approved && (!req.isAuthenticated() || req.user?.id !== tip.userId)) {
        return res.status(403).json({ message: "Ce conseil n'est pas encore approuvé" });
      }
      
      // Récupérer les commentaires
      const comments = await storage.getCommunityCommentsByTipId(tipId);
      res.json(comments);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Ajouter un commentaire à un conseil
  app.post("/api/community/tips/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tipId = parseInt(req.params.id);
      if (isNaN(tipId)) {
        return res.status(400).json({ message: "ID de conseil invalide" });
      }
      
      // Récupérer le conseil existant
      const tip = await storage.getCommunityTipById(tipId);
      if (!tip) {
        return res.status(404).json({ message: "Conseil non trouvé" });
      }
      
      // Vérifier que le conseil est approuvé
      if (!tip.approved) {
        return res.status(403).json({ message: "Ce conseil n'est pas encore approuvé" });
      }
      
      // Validation des données
      const validatedData = insertCommunityCommentSchema.parse({
        ...req.body,
        userId: req.user?.id,
        tipId
      });
      
      // Créer le commentaire
      const newComment = await storage.createCommunityComment(validatedData);
      res.status(201).json(newComment);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error("Erreur lors de la création du commentaire:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Supprimer un commentaire
  app.delete("/api/community/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de commentaire invalide" });
      }
      
      // Récupérer le commentaire existant (pas implémenté dans l'interface storage)
      // Pour le moment, on suppose que l'utilisateur a le droit de supprimer le commentaire
      
      // Supprimer le commentaire
      await storage.deleteCommunityComment(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Liker un commentaire
  app.post("/api/community/comments/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de commentaire invalide" });
      }
      
      // Liker le commentaire
      const updatedComment = await storage.likeCommunityComment(id);
      if (!updatedComment) {
        return res.status(404).json({ message: "Commentaire non trouvé" });
      }
      
      res.json(updatedComment);
    } catch (error: any) {
      console.error("Erreur lors du like du commentaire:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Route pour la réinitialisation du mot de passe
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Vérifier si l'utilisateur existe
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Aucun utilisateur trouvé avec cette adresse email" });
      }

      // Générer un token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

      // Sauvegarder le token dans la base de données
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry
      });

      // Envoyer l'email de réinitialisation
      await sendResetPasswordEmail(user.email, user.firstName || '', resetToken);

      res.status(200).json({ message: "Email de réinitialisation envoyé" });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      res.status(500).json({ error: "Une erreur est survenue lors de la réinitialisation du mot de passe" });
    }
  });

  // Route pour vérifier le token de réinitialisation
  app.post("/api/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const user = await storage.getUserByResetToken(token);

      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ error: "Token invalide ou expiré" });
      }

      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Erreur lors de la vérification du token:", error);
      res.status(500).json({ error: "Une erreur est survenue lors de la vérification du token" });
    }
  });

  // Route pour mettre à jour le mot de passe
  app.post("/api/update-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const user = await storage.getUserByResetToken(token);

      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ error: "Token invalide ou expiré" });
      }

      // Mettre à jour le mot de passe
      await storage.updateUser(user.id, {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      res.status(500).json({ error: "Une erreur est survenue lors de la mise à jour du mot de passe" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}