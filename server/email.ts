import sgMail from '@sendgrid/mail';
import { Task } from '@shared/schema';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configurer SendGrid avec la clé API
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('Service email configuré avec SendGrid');
} else {
  console.warn('SENDGRID_API_KEY non définie, les emails ne seront pas envoyés');
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Envoie un email via SendGrid
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Tentative d\'envoi d\'email sans API KEY configurée');
    return false;
  }

  try {
    const msg = {
      to,
      from: 'notifications@monsuivivert.fr', // Doit être vérifié auprès de SendGrid
      subject,
      text: text || 'Contenu non disponible en format texte',
      html: html || '<p>Contenu non disponible en HTML</p>'
    };

    await sgMail.send(msg);
    console.log(`Email envoyé à ${to}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
}

/**
 * Envoie un email de bienvenue/confirmation d'inscription
 */
export async function sendWelcomeEmail(email: string, firstName: string = ''): Promise<boolean> {
  const name = firstName || 'jardinier';
  
  return sendEmail({
    to: email,
    subject: 'Bienvenue sur Mon Suivi Vert 🌱',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Bienvenue sur Mon Suivi Vert</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
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
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          <p>© 2025 Mon Suivi Vert - Tous droits réservés</p>
        </div>
      </div>
    `
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
  
  return sendEmail({
    to: email,
    subject: `🌱 Rappel d'entretien pour vos plantes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Rappel d'entretien</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Bonjour,</p>
          <p>Voici un rappel pour les tâches d'entretien à effectuer prochainement :</p>
          
          <div style="margin: 25px 0;">
            ${tasksHtml}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://monsuivivert.fr/calendar" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir mon calendrier</a>
          </div>
          
          <p>Pour ne plus recevoir ces rappels, vous pouvez désactiver les notifications par email dans les paramètres de l'application.</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #666;">
          <p>© 2025 Mon Suivi Vert - Tous droits réservés</p>
        </div>
      </div>
    `
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