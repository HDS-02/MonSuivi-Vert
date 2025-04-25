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
import { pdfService } from "./pdfService";
import { sendTaskReminder, sendWelcomeEmail } from "./email";

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

export async function registerRoutes(app: Express): Promise<Server> {
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

      // Validation des données d'entrée - on accepte seulement username, firstName et email
      const userUpdateSchema = z.object({
        username: z.string().min(3).optional(),
        firstName: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
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
        } else if (validatedData.wateringFrequency >= 7) {
          validatedData.potSize = "Pot de 15-20 cm de diamètre avec drainage adapté";
        } else {
          validatedData.potSize = "Pot de 20-25 cm de diamètre avec bon drainage";
        }
      }
      
      const plant = await storage.createPlant(validatedData);
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

      // Partial validation of the request body
      const validatedData = insertPlantSchema.partial().parse(req.body);
      
      const updatedPlant = await storage.updatePlant(id, validatedData);
      if (!updatedPlant) {
        return res.status(404).json({ message: "Plante non trouvée" });
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

      const success = await storage.deletePlant(id);
      if (!success) {
        return res.status(404).json({ message: "Plante non trouvée" });
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

      const completedTask = await storage.completeTask(id);
      if (!completedTask) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }

      res.json(completedTask);
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

  // PLANT ANALYSIS ROUTES
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

  // ENDPOINT POUR OBTENIR DES INFORMATIONS SUR UNE PLANTE PAR SON NOM
  app.get("/api/plant-info", async (req: Request, res: Response) => {
    try {
      const plantName = req.query.name as string;
      
      if (!plantName) {
        return res.status(400).json({ message: "Le nom de la plante est requis" });
      }
      
      // Utiliser ChatGPT pour obtenir des informations détaillées sur la plante
      // avec repli automatique sur l'analyseur local en cas d'échec
      const plantInfo = await getPlantInfoByName(plantName);
      
      // Retourner les informations de la plante
      res.json(plantInfo);
    } catch (error: any) {
      console.error("Erreur lors de la recherche d'informations sur la plante:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI IMAGE ANALYSIS ENDPOINT
  app.post("/api/analyze", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Aucune image fournie" });
      }

      // Récupérer la description textuelle si fournie
      const description = req.body.description || '';

      // Save the uploaded file
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const fileName = `${nanoid()}.${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Create directory if it doesn't exist
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      
      // Write the file
      fs.writeFileSync(filePath, file.buffer);
      
      // Convert image to base64 for AI analysis
      const base64Image = file.buffer.toString('base64');
      
      // Analyze image using OpenAI or fallback to local analyzer
      // Passer la description à l'analyseur pour améliorer la précision
      const analysisResult = await analyzePlantImage(base64Image, file.originalname, description);
      
      // Public URL path for the saved image
      const imagePath = `/uploads/${fileName}`;
      
      // Return the analysis results with the image path
      res.json({
        ...analysisResult,
        imagePath
      });
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plants/:id/analyses", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }

      const validatedData = insertPlantAnalysisSchema.parse({
        ...req.body,
        plantId
      });
      
      const analysis = await storage.createPlantAnalysis(validatedData);
      
      // Update plant status based on analysis
      await storage.updatePlant(plantId, { status: analysis.status });
      
      // Vérifier les badges d'analyse si l'utilisateur est authentifié
      let unlockedBadges = [];
      if (req.isAuthenticated() && req.user?.id) {
        const userId = req.user.id;
        const analysisCount = (await storage.getPlantAnalyses(plantId)).length;
        unlockedBadges = badgeService.checkAnalysisBadges(userId, analysisCount);
      }
      
      res.status(201).json({
        analysis,
        unlockedBadges: unlockedBadges.length > 0 ? unlockedBadges : undefined,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // SOS ASSISTANCE PLANTE - Endpoint de diagnostic
  app.post("/api/plants/:id/sos-diagnostic", async (req: Request, res: Response) => {
    console.log("🚨 Endpoint SOS diagnostic appelé pour la plante ID:", req.params.id);
    console.log("📝 Données reçues:", JSON.stringify(req.body, null, 2));
    
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        console.log("❌ ID de plante invalide:", req.params.id);
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Récupérer les informations de la plante
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        console.log("❌ Plante non trouvée avec ID:", plantId);
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      console.log("✅ Plante trouvée:", plant.name);
      
      // Valider les données d'entrée avec Zod
      const diagnosticInputSchema = z.object({
        plantId: z.number(),
        plantName: z.string(),
        plantSpecies: z.string().optional(),
        lastWatering: z.string(),
        environment: z.object({
          directSunlight: z.boolean(),
          brightIndirect: z.boolean(),
          lowLight: z.boolean(),
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
          rootIssues: z.boolean(),
        }),
        additionalNotes: z.string().optional(),
      });
      
      const validatedData = diagnosticInputSchema.parse({
        ...req.body,
        plantId,
        plantName: plant.name,
        plantSpecies: plant.species,
      });
      
      // Générer le diagnostic en utilisant le service de diagnostic
      const diagnosticResult = plantDiagnosticService.generateDiagnosis(validatedData);
      
      // Si le diagnostic indique un problème grave, mettre à jour le statut de la plante
      if (diagnosticResult.status === "danger") {
        await storage.updatePlant(plantId, { status: "danger" });
      } else if (diagnosticResult.status === "warning" && plant.status === "healthy") {
        await storage.updatePlant(plantId, { status: "warning" });
      }
      
      // Créer une analyse à partir du diagnostic
      await storage.createPlantAnalysis({
        plantId,
        status: diagnosticResult.status,
        recommendations: diagnosticResult.diagnosis,
        healthIssues: req.body.additionalNotes || ""
      });
      
      // Vérifier et débloquer des badges si nécessaire
      let unlockedBadges = [];
      if (req.isAuthenticated() && req.user?.id) {
        const userId = req.user.id;
        const analysisCount = (await storage.getPlantAnalyses(plantId)).length;
        unlockedBadges = badgeService.checkAnalysisBadges(userId, analysisCount);
      }
      
      // Retourner le résultat du diagnostic
      res.json({
        diagnosis: diagnosticResult.diagnosis,
        status: diagnosticResult.status,
        actionRequired: diagnosticResult.actionRequired,
        unlockedBadges: unlockedBadges.length > 0 ? unlockedBadges : undefined
      });
    } catch (error: any) {
      console.error("❌ Erreur lors du diagnostic SOS:", error);
      
      if (error instanceof z.ZodError) {
        console.log("❌ Erreur de validation Zod:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Données invalides pour le diagnostic", 
          errors: error.errors 
        });
      }
      
      console.log("❌ Erreur générale:", error.message);
      console.log("❌ Stack trace:", error.stack);
      
      res.status(500).json({ 
        message: "Une erreur est survenue lors du diagnostic",
        error: error.message
      });
    }
  });

  // RÉCUPÉRATION DE LA BASE DE DONNÉES DES PLANTES (pour l'ajout manuel)
  app.get("/api/plant-database", async (req: Request, res: Response) => {
    try {
      // Accepter à la fois 'q' et 'search' comme paramètres de recherche
      const query = (req.query.q || req.query.search) as string;
      
      console.log("API plant-database appelée avec requête:", query);
      
      if (query && query.trim().length > 0) {
        // Recherche de plantes selon le critère de recherche
        const results = searchPlants(query.trim());
        console.log(`Résultats trouvés: ${results.length} suggestions`);
        return res.json(results);
      }
      
      // Sans critère de recherche, retourne une partie de la base de données
      const defaultResults = plantDatabase.slice(0, 10); // Limiter à 10 résultats par défaut
      console.log(`Renvoi des 10 premiers résultats par défaut`);
      res.json(defaultResults);
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupération des catégories de plantes disponibles
  app.get("/api/plant-categories", async (_req: Request, res: Response) => {
    try {
      res.json(plantCategories);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des catégories:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupération des plantes par catégorie
  app.get("/api/plant-database/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category as any;
      
      // Vérifier si la catégorie existe
      const validCategory = plantCategories.find(cat => cat.id === category);
      if (!validCategory) {
        return res.status(400).json({ message: "Catégorie non valide" });
      }
      
      // Récupérer les plantes de cette catégorie
      const plants = getPlantsByCategory(category);
      
      console.log(`${plants.length} plantes trouvées dans la catégorie "${category}"`);
      res.json(plants);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des plantes par catégorie:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Récupération d'une plante spécifique de la base de données par nom
  app.get("/api/plant-database/:name", async (req: Request, res: Response) => {
    try {
      const name = req.params.name;
      const plant = getPlantByName(name);
      
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée dans la base de données" });
      }
      
      res.json(plant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // EMAIL NOTIFICATION ROUTES
  app.post("/api/email/task-reminder", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user || !user.email) {
        return res.status(400).json({
          message: "L'utilisateur n'a pas d'adresse email configurée"
        });
      }

      // Récupérer les tâches à effectuer dans les prochains jours
      const pendingTasks = await storage.getPendingTasks();
      if (pendingTasks.length === 0) {
        return res.status(200).json({
          message: "Aucune tâche en attente à rappeler"
        });
      }

      // Récupérer les noms des plantes pour les tâches
      const plantIds = [...new Set(pendingTasks.map(task => task.plantId))];
      const plantsMap: Record<number, string> = {};
      
      for (const plantId of plantIds) {
        const plant = await storage.getPlant(plantId);
        if (plant) {
          plantsMap[plantId] = plant.name;
        }
      }

      // Envoyer l'email
      const success = await sendTaskReminder(user.email, pendingTasks, plantsMap);
      
      if (success) {
        res.status(200).json({ message: "Rappel de tâches envoyé avec succès" });
      } else {
        res.status(500).json({ message: "Échec de l'envoi du rappel" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/email/welcome", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user || !user.email) {
        return res.status(400).json({
          message: "L'utilisateur n'a pas d'adresse email configurée"
        });
      }

      const success = await sendWelcomeEmail(user.email, user.firstName || '');
      
      if (success) {
        res.status(200).json({ message: "Email de bienvenue envoyé avec succès" });
      } else {
        res.status(500).json({ message: "Échec de l'envoi de l'email de bienvenue" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour tester l'envoi d'emails
  app.post("/api/email/test", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Récupérer l'adresse email depuis la requête ou utiliser celle de l'utilisateur connecté
      const { to, subject } = req.body;
      const email = to || (req.user?.email || '');
      
      if (!email) {
        return res.status(400).json({ message: 'Adresse email de destination requise' });
      }
      
      console.log(`Test d'envoi d'email à ${email}...`);
      
      // Envoyer un email de test
      const success = await sendEmail({
        to: email,
        subject: subject || 'Test d\'envoi d\'email depuis Mon Suivi Vert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">Test d'envoi d'email</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p>Bonjour,</p>
              <p>Ceci est un email de test envoyé depuis l'application <strong>Mon Suivi Vert</strong>.</p>
              <p>Si vous recevez cet email, cela signifie que la configuration de notre système d'envoi d'emails fonctionne correctement.</p>
              <p>Date et heure de l'envoi : ${new Date().toLocaleString('fr-FR')}</p>
              <div style="margin: 30px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
                <p style="margin: 0;"><strong>Informations techniques :</strong></p>
                <p style="margin: 5px 0 0;">Expéditeur : ${process.env.EMAIL_USER || 'notification@monsuivivert.fr'}</p>
                <p style="margin: 5px 0 0;">Service d'envoi : Outlook</p>
              </div>
              <p>Merci d'utiliser Mon Suivi Vert !</p>
            </div>
            <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
              <p>© 2025 Mon Suivi Vert - Tous droits réservés</p>
            </div>
          </div>
        `
      });
      
      if (success) {
        console.log('Email de test envoyé avec succès');
        res.status(200).json({ 
          message: 'Email de test envoyé avec succès. Vérifiez votre boîte de réception ou consultez le dossier emails_simules.'
        });
      } else {
        console.log('Échec de l\'envoi de l\'email de test');
        res.status(500).json({ 
          message: 'Échec de l\'envoi de l\'email de test. Vérifiez les logs du serveur pour plus d\'informations.'
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'email de test: ' + error.message
      });
    }
  });

  // BADGES ROUTES
  app.get("/api/badges", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const badges = badgeService.getBadgesByUserId(req.user.id);
      res.json(badges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mettre à jour les badges liés aux plantes (après ajout/suppression de plante)
  app.post("/api/badges/update-plant-collection", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const userId = req.user.id;
      const plants = await storage.getPlantsByUserId(userId);
      const unlockedBadges = badgeService.checkPlantCollectionBadges(userId, plants.length);
      
      res.json({ unlockedBadges });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mettre à jour les badges liés aux tâches complétées
  app.post("/api/badges/update-tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const userId = req.user.id;
      const tasks = await storage.getTasks();
      const completedTasks = tasks.filter(task => task.completed).length;
      const unlockedBadges = badgeService.checkTaskCompletionBadges(userId, completedTasks);
      
      res.json({ unlockedBadges });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enregistrer une connexion (pour le badge de connexion consécutive)
  app.post("/api/badges/login-streak", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const daysStreak = req.body.daysStreak || 1;
      const userId = req.user.id;
      const updatedBadge = badgeService.updateConsecutiveLoginBadge(userId, daysStreak);
      
      res.json({ updatedBadge });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // QR CODE ROUTES
  // Route pour générer un QR code en PNG pour une plante
  app.get("/api/plants/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier si la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Taille du QR code (optionnelle)
      const size = req.query.size ? parseInt(req.query.size as string) : 300;
      
      // Générer le QR code
      const qrCodeDataUrl = await qrCodeService.generatePlantQRCode(plantId, size);
      
      res.json({ qrCodeDataUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour générer un QR code en SVG pour une plante
  app.get("/api/plants/:id/qrcode/svg", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier si la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Générer le QR code en SVG
      const svgContent = await qrCodeService.generatePlantQRCodeSVG(plantId);
      
      // Définir les headers pour le SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour générer un PDF avec QR code pour une plante
  app.get("/api/plants/:id/pdf", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier si la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Générer le PDF
      const pdfBuffer = await pdfService.generatePlantPDF(plantId);
      
      // Configurer les en-têtes pour le téléchargement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${plant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fiche.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Envoyer le PDF
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Erreur lors de la génération du PDF:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // JOURNAL DE CROISSANCE ROUTES
  // Récupérer les entrées du journal pour une plante spécifique
  app.get("/api/plants/:id/growth-journal", async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Vérifier si la plante existe
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      const entries = await storage.getGrowthJournalEntries(plantId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Récupérer toutes les entrées du journal pour un utilisateur
  app.get("/api/growth-journal", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const entries = await storage.getGrowthJournalEntriesByUserId(req.user.id);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Récupérer une entrée spécifique du journal
  app.get("/api/growth-journal/:id", async (req: Request, res: Response) => {
    try {
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "ID d'entrée invalide" });
      }
      
      const entry = await storage.getGrowthJournalEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Entrée du journal non trouvée" });
      }
      
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Créer une nouvelle entrée dans le journal
  app.post("/api/growth-journal", isAuthenticated, async (req: Request, res: Response) => {
    console.log("POST /api/growth-journal - Requête reçue:", req.body);
    
    try {
      if (!req.user?.id) {
        console.log("POST /api/growth-journal - Erreur: Utilisateur non authentifié");
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      console.log("POST /api/growth-journal - Utilisateur authentifié:", req.user.id);
      
      // Validation des données
      try {
        // Préparation des données avec des conversions explicites
        const dataToValidate = {
          ...req.body,
          userId: req.user.id,
          plantId: Number(req.body.plantId),
          height: req.body.height ? Number(req.body.height) : null,
          leaves: req.body.leaves ? Number(req.body.leaves) : null,
          healthRating: req.body.healthRating ? Number(req.body.healthRating) : null
        };
        
        console.log("POST /api/growth-journal - Données avant validation:", dataToValidate);
        
        const validatedData = insertGrowthJournalSchema.parse(dataToValidate);
        
        console.log("POST /api/growth-journal - Données validées:", validatedData);
        
        // Vérifier si la plante existe
        const plant = await storage.getPlant(validatedData.plantId);
        if (!plant) {
          console.log("POST /api/growth-journal - Erreur: Plante non trouvée, ID:", validatedData.plantId);
          return res.status(404).json({ message: "Plante non trouvée" });
        }
        
        console.log("POST /api/growth-journal - Plante trouvée:", plant.id, plant.name);
        
        // Créer l'entrée avec des conversions explicites des types
        const entryToCreate: any = {
          ...validatedData,
          plantId: Number(validatedData.plantId),
          userId: Number(validatedData.userId)
        };
        
        console.log("POST /api/growth-journal - Données à insérer:", entryToCreate);
        
        const entry = await storage.createGrowthJournalEntry(entryToCreate);
        console.log("POST /api/growth-journal - Entrée créée avec succès:", entry);
        
        res.status(201).json(entry);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.log("POST /api/growth-journal - Erreur de validation:", validationError.errors);
          return res.status(400).json({ 
            message: "Données invalides", 
            errors: validationError.errors 
          });
        }
        throw validationError;
      }
    } catch (error: any) {
      console.error("POST /api/growth-journal - Erreur serveur:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mettre à jour une entrée du journal
  app.patch("/api/growth-journal/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "ID d'entrée invalide" });
      }
      
      // Récupérer l'entrée existante
      const existingEntry = await storage.getGrowthJournalEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entrée du journal non trouvée" });
      }
      
      // Vérifier que l'utilisateur est propriétaire de cette entrée
      if (existingEntry.userId !== req.user.id) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette entrée" });
      }
      
      // Validation partielle des données
      const validatedData = insertGrowthJournalSchema.partial().parse(req.body);
      
      // Mettre à jour l'entrée
      const updatedEntry = await storage.updateGrowthJournalEntry(entryId, validatedData);
      res.json(updatedEntry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Supprimer une entrée du journal
  app.delete("/api/growth-journal/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
      }
      
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "ID d'entrée invalide" });
      }
      
      // Récupérer l'entrée existante
      const existingEntry = await storage.getGrowthJournalEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entrée du journal non trouvée" });
      }
      
      // Vérifier que l'utilisateur est propriétaire de cette entrée
      if (existingEntry.userId !== req.user.id) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette entrée" });
      }
      
      // Supprimer l'entrée
      const success = await storage.deleteGrowthJournalEntry(entryId);
      if (!success) {
        return res.status(500).json({ message: "Erreur lors de la suppression de l'entrée" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
