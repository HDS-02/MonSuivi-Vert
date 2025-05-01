import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { sendWelcomeEmail, sendLoginEmail } from "./email";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mon-suivi-vert-secret-key',
    resave: true,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });
      }

      // Vérifier si l'email est fourni
      if (!req.body.email) {
        return res.status(400).json({ message: "L'adresse email est requise" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Envoyer l'email de bienvenue en arrière-plan
      if (user.email) {
        try {
          await sendWelcomeEmail(user.email, user.firstName || undefined)
            .then(success => {
              if (success) {
                console.log(`Email de bienvenue envoyé avec succès à ${user.email}`);
              } else {
                console.warn(`Échec de l'envoi de l'email de bienvenue à ${user.email}`);
              }
            })
            .catch(emailError => {
              console.error(`Erreur lors de l'envoi de l'email de bienvenue:`, emailError);
            });
        } catch (emailError) {
          // Ne pas bloquer l'inscription si l'envoi d'email échoue
          console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Envoyer l'email de connexion si l'utilisateur a une adresse email
        if (user.email) {
          try {
            // Envoi asynchrone pour ne pas bloquer la réponse
            sendLoginEmail(user.email, user.firstName || undefined)
              .then(success => {
                if (success) {
                  console.log(`Email de connexion envoyé avec succès à ${user.email}`);
                }
              })
              .catch(emailError => {
                console.error(`Erreur lors de l'envoi de l'email de connexion:`, emailError);
              });
          } catch (emailError) {
            // Ne pas bloquer la connexion si l'envoi d'email échoue
            console.error('Erreur lors de l\'envoi de l\'email de connexion:', emailError);
          }
        }
        
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Route pour mettre à jour l'heure des rappels
  app.patch("/api/user/reminder-time", (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Vous devez être connecté pour effectuer cette action" });
      }
      
      const { reminderTime } = req.body;
      
      // Valider le format de l'heure (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(reminderTime)) {
        return res.status(400).json({ 
          message: "Format d'heure invalide. Veuillez utiliser le format HH:MM (ex: 08:00)." 
        });
      }
      
      // Mise à jour de l'heure de rappel de l'utilisateur
      storage.updateUser(req.user.id, { reminderTime })
        .then(updatedUser => {
          if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
          }
          
          console.log(`Heure de rappel mise à jour pour l'utilisateur ${updatedUser.username}: ${reminderTime}`);
          
          res.json({ 
            message: "Heure de rappel mise à jour avec succès",
            reminderTime: updatedUser.reminderTime
          });
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour de l'heure de rappel:", error);
          res.status(500).json({ message: error.message });
        });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'heure de rappel:", error);
      res.status(500).json({ message: error.message });
    }
  });
}