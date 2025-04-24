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
 * Service de génération de PDF pour les plantes
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

    // Créer un nouveau document PDF
    const pdfBuffer: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Fiche de plante - ${plant.name}`,
        Author: 'Mon Suivi Vert',
        Subject: `Fiche détaillée de ${plant.name}`,
      }
    });

    // Pipe le document PDF dans un buffer
    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    
    // Définir les couleurs
    const primaryColor = '#3B8564'; // Vert primaire de l'application
    const secondaryColor = '#6CAE75'; // Vert secondaire
    const accentColor = '#F2A365'; // Accent orangé
    
    // Définir constantes pour la mise en page
    const pageWidth = doc.page.width - 80; // Largeur utile (avec les marges)
    const centerX = doc.page.width / 2; // Centre horizontal de la page
    
    // Créer un en-tête avec logo et design moderne
    doc.rect(0, 0, doc.page.width, 100)
      .fill(primaryColor);
    
    // Logo de l'application
    try {
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 40, 20, {
          fit: [60, 60],
          align: 'center',
          valign: 'center'
        });
        
        // Texte à côté du logo
        doc.fontSize(24)
           .fill('#FFFFFF')
           .font('Helvetica-Bold')
           .text('MON SUIVI VERT', 110, 30);
      } else {
        // Fallback si le logo n'est pas trouvé
        doc.fontSize(30)
           .fill('#FFFFFF')
           .font('Helvetica-Bold')
           .text('MON SUIVI VERT', centerX - 110, 35, { align: 'center' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
      // Fallback en cas d'erreur
      doc.fontSize(30)
         .fill('#FFFFFF')
         .font('Helvetica-Bold')
         .text('MON SUIVI VERT', centerX - 110, 35, { align: 'center' });
    }
    
    // Information de la fiche
    doc.fontSize(14)
       .fill('#FFFFFF')
       .font('Helvetica')
       .text(`Fiche plante - ${new Date().toLocaleDateString('fr-FR')}`, 40, 65);
    
    // Zone principale - calculée correctement par rapport à la taille de la page
    doc.rect(40, 110, pageWidth, doc.page.height - 160)
       .fill('#F9F9F9');
       
    // Titre de la plante dans une boîte de taille correcte
    doc.roundedRect(60, 120, pageWidth - 40, 50, 5)
       .fill('#FFFFFF');
       
    doc.fill(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(plant.name, 80, 135, { width: pageWidth - 80 });
       
    // Sous-titre (espèce)
    if (plant.species) {
      doc.fill('#666666')
         .fontSize(14)
         .font('Helvetica')
         .text(plant.species, 80, 160, { width: pageWidth - 80 });
    }
    
    // Mise en page en deux colonnes avec dimensions précises pour éviter les débordements
    const colWidth = (pageWidth - 60) / 2; // Deux colonnes avec espace entre
    const colGap = 20; // Espace entre les colonnes
    const leftColX = 60; // X de départ pour la colonne de gauche
    const rightColX = leftColX + colWidth + 40; // X de départ pour la colonne de droite
    let yPos = 190;
    
    // Colonne de gauche - Informations principales et image
    
    // Image de la plante si disponible
    if (plant.image && plant.image.includes(',')) {
      try {
        const imgBuffer = Buffer.from(plant.image.split(',')[1], 'base64');
        doc.image(imgBuffer, 80, yPos, {
          fit: [colWidth - 20, 150],
          align: 'center',
        });
        yPos += 160;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'image de la plante:', error);
        // En cas d'erreur, on continue sans image
      }
    } else {
      // Ajout d'un texte explicatif si pas d'image
      doc.fontSize(10)
         .fill('#666666')
         .text('Aucune image disponible pour cette plante', 80, yPos + 50, { 
           width: colWidth - 20,
           align: 'center'
         });
      yPos += 90; // On ajoute quand même de l'espace
    }
    
    // Informations détaillées dans une carte
    doc.roundedRect(60, yPos, colWidth + 20, 220, 5)
       .fill('#FFFFFF');
    
    doc.fill(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Informations générales', 80, yPos + 15, { width: colWidth - 20 });
    
    // Ligne de séparation
    doc.strokeColor(primaryColor)
       .lineWidth(1)
       .moveTo(80, yPos + 35)
       .lineTo(colWidth + 40, yPos + 35)
       .stroke();
    
    // Fonction d'aide pour ajouter une ligne d'information
    const addInfoLine = (label: string, value: string | null | undefined, y: number) => {
      if (value) {
        doc.fill('#333333')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(`${label}: `, 80, y, { continued: true, width: colWidth - 40 })
           .font('Helvetica')
           .text(value);
        return y + 22; // Retourne la nouvelle position Y
      }
      return y;
    };
    
    // Ajouter les détails de la plante
    let infoY = yPos + 45;
    infoY = addInfoLine('Statut', plant.status, infoY);
    infoY = addInfoLine('Arrosage', 
      plant.wateringFrequency ? `Tous les ${plant.wateringFrequency} jours` : 'Non spécifié', infoY);
    infoY = addInfoLine('Lumière', plant.light, infoY);
    infoY = addInfoLine('Température', plant.temperature, infoY);
    infoY = addInfoLine('Taille de pot', plant.potSize, infoY);
    
    // Colonne de droite - QR code et conseils
    
    // QR Code card
    doc.roundedRect(rightColX, 190, colWidth + 20, 160, 5)
       .fill('#FFFFFF');
    
    doc.fill(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Accès rapide - QR Code', rightColX + 20, 205, { 
         align: 'center', 
         width: colWidth - 20 
       });
    
    try {
      // Centrer le QR code
      const qrCodeWidth = 120;
      const qrCodeX = rightColX + (colWidth + 20 - qrCodeWidth) / 2;
      
      // Ajouter le SVG du QR code
      SVGtoPDF(doc, qrCodeSVG, qrCodeX, 230, {
        width: qrCodeWidth,
        height: qrCodeWidth,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du QR code:', error);
      doc.text('Erreur lors de la génération du QR code', rightColX + 20, 230, { 
        align: 'center',
        width: colWidth - 20 
      });
    }
    
    // Notes de soin
    if (plant.careNotes) {
      doc.roundedRect(rightColX, 360, colWidth + 20, 160, 5)
         .fill('#FFFFFF');
      
      doc.fill(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Notes de soin', rightColX + 20, 375, { 
           width: colWidth - 20,
           align: 'center'
         });
      
      // Ligne de séparation
      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(rightColX + 20, 395)
         .lineTo(rightColX + colWidth, 395)
         .stroke();
      
      doc.fill('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(plant.careNotes, rightColX + 20, 405, { 
           width: colWidth - 40,
           height: 110,
           ellipsis: true
         });
    }
    
    // Maladies communes
    if (plant.commonDiseases) {
      try {
        let diseases;
        if (typeof plant.commonDiseases === 'string') {
          diseases = JSON.parse(plant.commonDiseases);
        } else {
          diseases = plant.commonDiseases;
        }
        
        if (Array.isArray(diseases) && diseases.length > 0) {
          doc.roundedRect(60, yPos + 230, colWidth + 20, 90, 5)
             .fill('#FFFFFF');
          
          doc.fill(primaryColor)
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('Maladies communes', 80, yPos + 245, { width: colWidth - 20 });
          
          // Ligne de séparation
          doc.strokeColor(primaryColor)
             .lineWidth(1)
             .moveTo(80, yPos + 265)
             .lineTo(colWidth + 40, yPos + 265)
             .stroke();
          
          // Ajouter jusqu'à 2 maladies (pour tenir sur une page)
          const maxDiseases = Math.min(diseases.length, 2);
          for (let i = 0; i < maxDiseases; i++) {
            const disease = diseases[i];
            // On augmente l'espacement vertical pour éviter les chevauchements
            const diseaseY = yPos + 275 + (i * 35); // Plus d'espace entre les maladies
            
            doc.fill('#333333')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(`${i + 1}. ${disease.name || 'N/A'}`, 80, diseaseY, { 
                 width: colWidth - 40 
               });
            
            // Traitement sur une ligne séparée avec plus d'espacement
            doc.fontSize(9)
               .font('Helvetica')
               .text(`Traitement: ${disease.treatment || 'N/A'}`, 100, diseaseY + 15, { 
                 width: colWidth - 60
               });
          }
        }
      } catch (error) {
        console.error('Erreur lors du parsing des maladies communes:', error);
      }
    }
    
    // Pied de page avec barre colorée
    doc.rect(0, doc.page.height - 50, doc.page.width, 50)
       .fill(primaryColor);
    
    // Centrage correct du texte en pied de page en utilisant centerX
    doc.fill('#FFFFFF')
       .fontSize(10)
       .text('© Mon Suivi Vert - L\'application qui vous aide à prendre soin de vos plantes', 
             0, doc.page.height - 30, { 
               width: doc.page.width, 
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