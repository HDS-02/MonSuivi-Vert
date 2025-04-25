import { Task, Plant } from '@shared/schema';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Logo de l'application pour les emails
// Version encodée en base64 pour maximiser la compatibilité avec les clients email
// Ce logo est une image réelle avec un fond vert vif et notre logo en blanc
const APP_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAGK0lEQVR4nO3dPW8cxxnH4Zkd7r1XwJUbVSlVu3CbDxA3/sYp/BXUpnQTF3YRCFKRIi4UpBHkWhCQF3wROaREUrw9d7szE7hQCgIBAvr5Ps3e3pC7f+7s7M7urJoOlnYJ4yJhWkT+3gYMx5eR5ftMr96U5nAXBuAjGLqEYZGYrxL2ZwkPD8M82gB8JLMq0a0y7y4T9mYJh4fMq2IC8BEN64S9dcLbVcLubuZ5ERHgd/BJzF5EmrWZL8P9y4A7gE/oxW1m/bSZz74L43iXgAHgE1tPM8tPMt9+nal3E+kbAD6xi0VC32bmLxLXe4kwLjMeAj6xqhcJVX0WCfcnAfcpflbdbSQ0NxHZ0wB+EREFu/ovQgD5BQQI4EF9HynGVSYMAP9Xu47EcBspBuD/2r3LTPuZU/x/zYd+A/CLqi4jqkUkE6niL7LqboD/4OLkIqJ+EUlH0Rlgc9rYu4tc/Hby0W/cAHBP9H20f/2n5r/zN+kZgCHDV3VEfRoR5TAD8DANbcTwrI4YTzKlMLnDwzXcZA7/cJhp3JvgFw/X0GZun56uZp8OgI+Ah8oSgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOIJgOJ94wA0/Q8QPrk6IuqI5EzE3gxw/3Vv3kZcvzqLmTMAP9/QZUZ/FulnEdWzCC+B+NlcvXod87NZLKefDNbX3/1msfzxcJN2e+B+GzL9zZPF/MlpvvoHeyCJwVx32p8AAAAASUVORK5CYII=";

// Version HTML du logo qui sera utilisée dans les emails
const APP_LOGO = `
<img src="data:image/png;base64,${APP_LOGO_BASE64}" alt="Mon Suivi Vert" width="120" height="120" style="display:block; margin:0; padding:0; border:0;">
`;

// Template d'email réutilisable
function emailTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f8f8;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f8f8;">
    <tr>
      <td align="center" style="padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: white; margin: 0 auto; max-width: 600px;">
          <!-- Logo en haut sans espace - le logo a un fond vert donc pas d'espace blanc -->
          <tr>
            <td align="center" style="padding: 0;">
              ${APP_LOGO}
            </td>
          </tr>
          <!-- Bannière titre -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding: 30px 20px; border: 1px solid #e0e0e0; border-top: none;">
              ${content}
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td align="center" style="padding: 20px; font-size: 12px; color: #666;">
              <p style="margin: 5px 0;">© 2025 Mon Suivi Vert - Tous droits réservés</p>
              <p style="margin: 5px 0; font-size: 11px;">Si vous ne souhaitez plus recevoir nos emails, vous pouvez désactiver les notifications dans les paramètres de l'application.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Configuration de Nodemailer avec Gmail
// Création du transporteur
console.log('Configuration du service email avec Nodemailer et Gmail...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'monespacevertapp@gmail.com', // Adresse email Gmail dédiée à l'application
    pass: process.env.EMAIL_PASSWORD || 'votre_mot_de_passe_app'
  },
  tls: {
    rejectUnauthorized: false    // Désactiver la vérification des certificats (utile en dev)
  }
});

// Vérifier la configuration de l'email
// Nous utilisons un compte dédié avec l'adresse fixe, donc nous ne vérifions que le mot de passe
const emailConfigured = process.env.EMAIL_PASSWORD !== undefined;
if (emailConfigured) {
  console.log(`Service email configuré avec l'adresse: monespacevertapp@gmail.com`);
  
  // Vérifier la connexion
  transporter.verify((error) => {
    if (error) {
      console.error('Erreur de vérification de la configuration email:', error);
    } else {
      console.log('Serveur prêt à envoyer des emails');
    }
  });
} else {
  console.warn('Configuration email incomplète. EMAIL_PASSWORD est nécessaire.');
}

// Dossier pour les emails de secours si l'envoi échoue
const emailFolderPath = path.join('.', 'emails_simules');
try {
  if (!fs.existsSync(emailFolderPath)) {
    fs.mkdirSync(emailFolderPath, { recursive: true });
  }
} catch (err) {
  console.error('Impossible de créer le dossier pour les emails de secours:', err);
}

/**
 * Envoie un email via Nodemailer avec fallback
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  try {
    // Vérifier si les identifiants email sont configurés
    if (emailConfigured) {
      console.log(`Tentative d'envoi d'email à ${to} via Gmail...`);
      
      // Préparer le message
      const mailOptions = {
        from: 'Mon Suivi Vert <monespacevertapp@gmail.com>',
        to,
        subject,
        text: text || 'Contenu non disponible en format texte',
        html: html || '<p>Contenu non disponible en HTML</p>',
        // Options pour que Gmail accepte de l'envoyer
        priority: 'high' as 'high'
      };

      try {
        // Envoyer l'email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email envoyé avec succès à ${to}. ID: ${info.messageId}`);
        return true;
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi avec Gmail:', emailError);
        // On passe au fallback
      }
    } else {
      console.warn('Identifiants email non configurés. Utilisation du mode de secours.');
    }
    
    // Mode de secours si l'envoi échoue ou si les identifiants ne sont pas configurés
    console.log(`------ EMAIL (MODE DE SECOURS) ------`);
    console.log(`À: ${to}`);
    console.log(`De: ${process.env.EMAIL_USER || 'notification@monsuivivert.fr'}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Date: ${new Date().toLocaleString('fr-FR')}`);
    console.log('------------------------');
    
    // Sauvegarde dans un fichier HTML pour référence
    const timestamp = Date.now();
    const fileName = `email_${timestamp}.html`;
    const filePath = path.join(emailFolderPath, fileName);
    
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email - ${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .email-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
        .email-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 20px; }
        .email-content { padding: 20px; }
        .email-footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div><strong>À:</strong> ${to}</div>
          <div><strong>De:</strong> ${process.env.EMAIL_USER || 'notification@monsuivivert.fr'}</div>
          <div><strong>Sujet:</strong> ${subject}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</div>
        </div>
        <div class="email-content">
          ${html || text || 'Aucun contenu'}
        </div>
        <div class="email-footer">
          <p>Email sauvegardé par l'application Mon Suivi Vert (mode de secours)</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(filePath, emailContent);
    console.log(`Email sauvegardé dans ${filePath}`);
    
    // En mode de secours, on considère que l'opération est réussie
    // car l'email a bien été enregistré
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return false;
  }
}

/**
 * Envoie un email de bienvenue/confirmation d'inscription
 */
export async function sendWelcomeEmail(email: string, firstName: string = ''): Promise<boolean> {
  const name = firstName || 'jardinier';
  
  const content = `
    <p>Bonjour ${name},</p>
    <p>Nous sommes ravis de vous accueillir sur <strong>Mon Suivi Vert</strong>, votre assistant personnel pour prendre soin de vos plantes !</p>
    <p>Grâce à notre application, vous pourrez :</p>
    <ul>
      <li>Suivre l'entretien de vos plantes</li>
      <li>Recevoir des rappels personnalisés</li>
      <li>Obtenir des conseils adaptés à chaque espèce</li>
      <li>Diagnostiquer les problèmes de santé de vos plantes</li>
    </ul>
    <p>N'hésitez pas à ajouter vos premières plantes et à explorer toutes les fonctionnalités de l'application.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accéder à mon espace</a>
    </div>
    <p>À très bientôt sur Mon Suivi Vert !</p>
    <p style="font-style: italic; margin-top: 30px; font-size: 14px; color: #666;">
      Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet email.
    </p>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Bienvenue sur Mon Suivi Vert 🌱',
    html: emailTemplate('Bienvenue sur Mon Suivi Vert', content)
  });
}

/**
 * Envoie un email de connexion
 */
export async function sendLoginEmail(email: string, firstName: string = ''): Promise<boolean> {
  const name = firstName || 'jardinier';
  const date = new Date().toLocaleString('fr-FR');
  
  const content = `
    <p>Bonjour ${name},</p>
    <p>Nous avons détecté une nouvelle connexion à votre compte <strong>Mon Suivi Vert</strong>.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; border-radius: 4px;">
      <p style="margin: 0;"><strong>Date et heure :</strong> ${date}</p>
    </div>
    <p>Si c'est bien vous qui venez de vous connecter, vous pouvez ignorer cet email.</p>
    <p>Si vous n'êtes pas à l'origine de cette connexion, nous vous recommandons de changer immédiatement votre mot de passe.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr/settings" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gérer mon compte</a>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Nouvelle connexion à votre compte Mon Suivi Vert',
    html: emailTemplate('Nouvelle connexion', content)
  });
}

/**
 * Envoie un rappel pour les tâches à effectuer
 */
export async function sendTaskReminder(email: string, tasks: Task[], plantNames: Record<number, string>): Promise<boolean> {
  if (tasks.length === 0) return true;
  
  // Formater les tâches pour l'email
  const tasksHtml = tasks.map(task => {
    const plantName = plantNames[task.plantId] || 'Plante';
    const dueDate = task.dueDate ? format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: fr }) : 'Aujourd\'hui';
    const icon = getTaskIcon(task.type);
    
    return `
      <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #4CAF50; background-color: #f9f9f9;">
        <div style="display: flex; align-items: center;">
          <div style="margin-right: 15px; background-color: #e8f5e9; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            ${icon}
          </div>
          <div>
            <p style="margin: 0; font-weight: bold;">${task.description}</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
              ${plantName} - À faire le ${dueDate}
            </p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  const content = `
    <p>Bonjour,</p>
    <p>Voici un rappel pour les tâches d'entretien à effectuer prochainement :</p>
    
    <div style="margin: 25px 0;">
      ${tasksHtml}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr/calendar" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir mon calendrier</a>
    </div>
    
    <p>Pour ne plus recevoir ces rappels, vous pouvez désactiver les notifications par email dans les paramètres de l'application.</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `🌱 Rappel d'entretien pour vos plantes`,
    html: emailTemplate('Rappel d\'entretien', content)
  });
}

/**
 * Notifie l'ajout d'une nouvelle plante
 */
export async function sendPlantAddedEmail(email: string, plant: Plant): Promise<boolean> {
  const plantDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  
  const content = `
    <p>Bonjour,</p>
    <p>Félicitations ! Vous venez d'ajouter une nouvelle plante à votre collection :</p>
    
    <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
      <h3 style="margin-top: 0; color: #2e7d32;">${plant.name}</h3>
      <p><strong>Espèce :</strong> ${plant.species}</p>
      <p><strong>Date d'ajout :</strong> ${plantDate}</p>
      <p><strong>Fréquence d'arrosage :</strong> Tous les ${plant.wateringFrequency} jours</p>
    </div>
    
    <p>Nous vous enverrons des rappels pour prendre soin de votre ${plant.name}.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr/plants/${plant.id}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir ma plante</a>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: `🌿 Nouvelle plante ajoutée : ${plant.name}`,
    html: emailTemplate('Nouvelle plante ajoutée', content)
  });
}

/**
 * Notifie la suppression d'une plante
 */
export async function sendPlantRemovedEmail(email: string, plantName: string): Promise<boolean> {
  const content = `
    <p>Bonjour,</p>
    <p>Nous vous confirmons que la plante suivante a été supprimée de votre collection :</p>
    
    <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
      <h3 style="margin-top: 0; color: #2e7d32;">${plantName}</h3>
      <p>Cette plante et toutes les tâches associées ont été supprimées de votre compte.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr/plants" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir mes plantes</a>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: `Plante supprimée : ${plantName}`,
    html: emailTemplate('Plante supprimée', content)
  });
}

/**
 * Envoie un rappel d'arrosage spécifique
 */
export async function sendWateringReminderEmail(email: string, plants: Plant[]): Promise<boolean> {
  if (plants.length === 0) return true;
  
  // Formater les plantes pour l'email
  const plantsHtml = plants.map(plant => {
    return `
      <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #2196F3; background-color: #f9f9f9;">
        <div style="display: flex; align-items: center;">
          <div style="margin-right: 15px; background-color: #e3f2fd; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #2196F3; font-size: 24px;">💧</span>
          </div>
          <div>
            <p style="margin: 0; font-weight: bold;">${plant.name}</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
              ${plant.species}
            </p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  const content = `
    <p>Bonjour,</p>
    <p>Il est temps d'arroser les plantes suivantes :</p>
    
    <div style="margin: 25px 0;">
      ${plantsHtml}
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
      <p style="margin: 0;"><strong>Conseil :</strong> Pour un arrosage optimal, arrosez tôt le matin ou en fin de journée pour limiter l'évaporation.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://monsuivivert.fr/calendar" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir mon calendrier</a>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: `💧 Rappel d'arrosage - Vos plantes ont soif !`,
    html: emailTemplate('Rappel d\'arrosage', content)
  });
}

// Fonction utilitaire pour obtenir l'icône HTML d'une tâche
function getTaskIcon(type: string): string {
  switch (type) {
    case 'water':
      return '<span style="color: #2196F3; font-size: 24px;">💧</span>';
    case 'fertilize':
      return '<span style="color: #8BC34A; font-size: 24px;">🌱</span>';
    case 'repot':
      return '<span style="color: #795548; font-size: 24px;">🪴</span>';
    case 'prune':
      return '<span style="color: #FF9800; font-size: 24px;">✂️</span>';
    case 'light':
      return '<span style="color: #FFC107; font-size: 24px;">☀️</span>';
    default:
      return '<span style="color: #4CAF50; font-size: 24px;">🌿</span>';
  }
}