import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fetch from "node-fetch";
import { initDatabase } from "./init-db";

/**
 * Configure un vérificateur périodique pour les rappels d'arrosage
 * Cette fonction simule un cron job qui vérifie chaque minute si des rappels
 * d'arrosage doivent être envoyés aux utilisateurs selon l'heure programmée
 */
function setupWateringReminderChecker(port: number) {
  const CHECK_INTERVAL = 60 * 1000; // Vérifier toutes les minutes
  
  log("Configuration du vérificateur de rappels d'arrosage...");
  
  // Première vérification immédiate
  setTimeout(async () => {
    try {
      await checkWateringReminders(port);
    } catch (error) {
      console.error("[reminder-checker] Erreur lors de la vérification initiale:", error);
    }
    
    // Puis vérification périodique
    setInterval(async () => {
      try {
        await checkWateringReminders(port);
      } catch (error) {
        console.error("[reminder-checker] Erreur lors de la vérification périodique:", error);
      }
    }, CHECK_INTERVAL);
  }, 5000); // Attendre 5 secondes avant la première vérification
  
  log("Vérificateur de rappels d'arrosage configuré (intervalle: 1 minute)");
}

/**
 * Déclenche la vérification des rappels d'arrosage via l'API
 */
async function checkWateringReminders(port: number) {
  // Obtenir l'heure actuelle pour les logs
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  try {
    // Créer une requête interne pour déclencher les rappels
    const response = await fetch(`http://localhost:${port}/api/system/trigger-watering-reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.CRON_SECRET || 'internal-cron' })
    });
    
    if (response.ok) {
      const result = await response.json() as { 
        emailsSent: number; 
        plantsCount: number;
        usersCount: number;
        time: string;
        message: string;
      };
      
      if (result.emailsSent > 0) {
        log(`[watering-reminder] ${result.emailsSent} emails de rappel d'arrosage envoyés à ${currentTime}`);
      } else {
        // Logs détaillés uniquement en développement
        if (process.env.NODE_ENV === 'development') {
          log(`[watering-reminder] Aucun rappel d'arrosage à envoyer à ${currentTime}`);
        }
      }
    } else {
      const errorText = await response.text();
      console.error(`[watering-reminder] Erreur (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.error('[watering-reminder] Erreur lors de la vérification:', error);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Add health check route
app.get("/api/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialiser la base de données
  await initDatabase();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, () => {
    log(`Serveur démarré sur le port ${port}`);
    
    // Mettre en place un mécanisme pour vérifier les rappels d'arrosage programmés
    setupWateringReminderChecker(port);
  });
})();