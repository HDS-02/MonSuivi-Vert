import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import fs from 'fs';
import path from 'path';
import { qrCodeService } from './qrCodeService';
import { storage } from './storage';
import { Plant } from '@shared/schema';

// Chemin relatif vers le logo
const LOGO_PATH = path.join(process.cwd(), 'client', 'src', 'assets', 'logo.png');

/**
 * Service de génération de PDF pour les plantes - Implémentation simplifiée
 */
export class PDFService {
  /**
   * Génère un PDF contenant le QR code et les informations détaillées d'une plante
   * @param plantId ID de la plante
   * @returns Buffer du PDF généré
   */
  public async generatePlantPDF(plantId: number): Promise<Buffer> {
    // Récupérer les données de la plante
    const plant = await storage.getPlant(plantId);
    if (!plant) {
      throw new Error('Plante non trouvée');
    }

    // Générer le QR code SVG
    const qrCodeSVG = await qrCodeService.generatePlantQRCodeSVG(plantId);

    // Créer un nouveau document PDF avec une orientation portrait
    const pdfBuffer: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50, // Marge uniforme pour éviter les problèmes de limite de page
      bufferPages: true, // Pour pouvoir numéroter les pages
      info: {
        Title: `Fiche de plante - ${plant.name}`,
        Author: 'Mon Suivi Vert',
        Subject: `Fiche détaillée de ${plant.name}`,
      }
    });

    // Pipe le document PDF dans un buffer
    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    
    // Couleurs de la charte graphique
    const primaryColor = '#3B8564';
    const textColor = '#333333';
    const backgroundColor = '#F5F5F5';
    
    // Variables pour la mise en page
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100; // 50px de marge de chaque côté
    const centerX = pageWidth / 2;
    
    // En-tête avec fond coloré
    doc.rect(0, 0, pageWidth, 80)
       .fill(primaryColor);
    
    // Titre de l'application - version texte simple
    doc.fontSize(24)
       .fill('#FFFFFF')
       .font('Helvetica-Bold')
       .text('MON SUIVI VERT', 50, 30);
       
    // Date de génération
    doc.fontSize(12)
       .fill('#FFFFFF')
       .font('Helvetica')
       .text(`Fiche générée le ${new Date().toLocaleDateString('fr-FR')}`, 50, 55);
    
    // Titre de la fiche
    doc.fontSize(22)
       .fill(primaryColor)
       .font('Helvetica-Bold')
       .text(`Fiche de : ${plant.name}`, 50, 100);
    
    // Espèce (sous-titre)
    if (plant.species) {
      doc.fontSize(16)
         .fill(textColor)
         .font('Helvetica-Oblique')
         .text(plant.species, 50, 130);
    }
    
    // Image de la plante (si disponible)
    let yPosition = 160;
    if (plant.image && plant.image.includes(',')) {
      try {
        const imgBuffer = Buffer.from(plant.image.split(',')[1], 'base64');
        doc.image(imgBuffer, 50, yPosition, { 
          fit: [200, 150]
        });
        yPosition += 170; // Espace après l'image
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'image:', error);
      }
    }
    
    // Section d'informations générales avec fond gris clair
    doc.rect(50, yPosition, contentWidth, 180)
       .fill(backgroundColor);
       
    // Titre de la section
    doc.fontSize(16)
       .fill(primaryColor)
       .font('Helvetica-Bold')
       .text('Informations générales', 70, yPosition + 15);
    
    // Ligne de séparation
    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(70, yPosition + 35)
       .lineTo(contentWidth - 20, yPosition + 35)
       .stroke();
    
    // Fonction pour ajouter des informations avec un espacement constant
    let infoY = yPosition + 50;
    const addInfo = (label: string, value: string | null | undefined) => {
      if (value) {
        doc.fontSize(12)
           .fill(textColor)
           .font('Helvetica-Bold')
           .text(`${label}: `, 70, infoY, { continued: true })
           .font('Helvetica')
           .text(value);
        infoY += 25; // espacement constant entre les lignes
      }
    };
    
    // Ajout des informations
    addInfo('Statut', plant.status);
    addInfo('Fréquence d\'arrosage', plant.wateringFrequency ? `Tous les ${plant.wateringFrequency} jours` : 'Non spécifié');
    addInfo('Lumière', plant.light);
    addInfo('Température', plant.temperature);
    addInfo('Taille de pot', plant.potSize);
    
    // Section pour le QR code
    yPosition += 200;
    
    doc.fontSize(16)
       .fill(primaryColor)
       .font('Helvetica-Bold')
       .text('QR Code d\'accès rapide', 50, yPosition);
       
    try {
      // QR code centré
      SVGtoPDF(doc, qrCodeSVG, 50, yPosition + 30, {
        width: 150,
        height: 150
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du QR code:', error);
      doc.text('QR code non disponible', 50, yPosition + 70);
    }
    
    // Notes de soin - à droite du QR code pour optimiser l'espace
    if (plant.careNotes) {
      doc.rect(230, yPosition, contentWidth - 180, 150)
         .fill(backgroundColor);
         
      doc.fontSize(16)
         .fill(primaryColor)
         .font('Helvetica-Bold')
         .text('Notes de soin', 250, yPosition + 10);
         
      doc.fontSize(12)
         .fill(textColor)
         .font('Helvetica')
         .text(plant.careNotes, 250, yPosition + 40, {
           width: contentWidth - 220,
           height: 100
         });
    }
    
    // Maladies communes
    yPosition += 180;
    if (plant.commonDiseases) {
      try {
        let diseases;
        if (typeof plant.commonDiseases === 'string') {
          diseases = JSON.parse(plant.commonDiseases);
        } else {
          diseases = plant.commonDiseases;
        }
        
        if (Array.isArray(diseases) && diseases.length > 0) {
          doc.rect(50, yPosition, contentWidth, 100)
             .fill(backgroundColor);
             
          doc.fontSize(16)
             .fill(primaryColor)
             .font('Helvetica-Bold')
             .text('Maladies communes', 70, yPosition + 15);
          
          let diseaseY = yPosition + 45;
          const maxDiseases = Math.min(diseases.length, 2); // Limiter à 2 maladies
          
          for (let i = 0; i < maxDiseases; i++) {
            const disease = diseases[i];
            doc.fontSize(12)
               .fill(textColor)
               .font('Helvetica-Bold')
               .text(`${i + 1}. ${disease.name || 'N/A'}`, 70, diseaseY);
               
            diseaseY += 20;
            doc.fontSize(11)
               .font('Helvetica')
               .text(`Traitement: ${disease.treatment || 'N/A'}`, 90, diseaseY, {
                 width: contentWidth - 110
               });
               
            diseaseY += 30; // Espace entre les maladies
          }
        }
      } catch (error) {
        console.error('Erreur lors du parsing des maladies:', error);
      }
    }
    
    // Pied de page
    const footerY = doc.page.height - 50;
    doc.rect(0, footerY, pageWidth, 50)
       .fill(primaryColor);
       
    doc.fontSize(10)
       .fill('#FFFFFF')
       .font('Helvetica')
       .text('© Mon Suivi Vert - L\'application qui vous aide à prendre soin de vos plantes', 
             centerX - 200, footerY + 20, { 
               width: 400, 
               align: 'center' 
             });
    
    // Finaliser le document
    doc.end();

    // Retourner une promesse qui se résout avec le buffer PDF
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(pdfBuffer));
      });
      doc.on('error', reject);
    });
  }
}

export const pdfService = new PDFService();