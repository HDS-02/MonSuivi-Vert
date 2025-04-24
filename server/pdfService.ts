import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import fs from 'fs';
import path from 'path';
import { qrCodeService } from './qrCodeService';
import { storage } from './storage';
import { Plant } from '@shared/schema';

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

    // Créer un en-tête avec logo et design moderne
    doc.rect(0, 0, doc.page.width, 100)
      .fill(primaryColor);
    
    // Logo (texte stylisé puisque nous n'avons pas d'image de logo)
    doc.fontSize(30)
       .fill('#FFFFFF')
       .font('Helvetica-Bold')
       .text('MON SUIVI VERT', 40, 35, { align: 'left' });
    
    // Information de la fiche
    doc.fontSize(14)
       .fill('#FFFFFF')
       .font('Helvetica')
       .text(`Fiche plante - ${new Date().toLocaleDateString('fr-FR')}`, 40, 65, { align: 'left' });
    
    // Zone principale
    doc.rect(40, 110, pageWidth + 80, doc.page.height - 160)
       .fill('#F9F9F9');
       
    // Titre de la plante
    doc.roundedRect(60, 120, pageWidth + 40, 50, 5)
       .fill('#FFFFFF');
       
    doc.fill(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(plant.name, 80, 135, { width: pageWidth });
       
    // Sous-titre (espèce)
    if (plant.species) {
      doc.fill('#666666')
         .fontSize(14)
         .font('Helvetica')
         .text(plant.species, 80, 160, { width: pageWidth });
    }
    
    // Mise en page en deux colonnes
    const colWidth = pageWidth / 2;
    const colGap = 20;
    let yPos = 190;
    
    // Colonne de gauche - Informations principales et image
    
    // Image de la plante si disponible
    if (plant.image) {
      try {
        const imgBuffer = Buffer.from(plant.image.split(',')[1], 'base64');
        doc.image(imgBuffer, 80, yPos, {
          fit: [colWidth - 20, 150],
          align: 'center',
        });
        yPos += 160;
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'image de la plante:', error);
      }
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
    doc.roundedRect(colWidth + 80 + colGap, 190, colWidth + 20, 160, 5)
       .fill('#FFFFFF');
    
    doc.fill(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Accès rapide - QR Code', colWidth + 100 + colGap, 205, { align: 'center', width: colWidth - 20 });
    
    try {
      // Centrer le QR code
      const qrCodeWidth = 120;
      const qrCodeX = colWidth + 80 + colGap + (colWidth + 20 - qrCodeWidth) / 2;
      
      // Ajouter le SVG du QR code
      SVGtoPDF(doc, qrCodeSVG, qrCodeX, 230, {
        width: qrCodeWidth,
        height: qrCodeWidth,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du QR code:', error);
      doc.text('Erreur lors de la génération du QR code', { align: 'center' });
    }
    
    // Notes de soin
    if (plant.careNotes) {
      doc.roundedRect(colWidth + 80 + colGap, 360, colWidth + 20, 160, 5)
         .fill('#FFFFFF');
      
      doc.fill(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Notes de soin', colWidth + 100 + colGap, 375, { width: colWidth - 40 });
      
      // Ligne de séparation
      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(colWidth + 100 + colGap, 395)
         .lineTo(colWidth + 100 + colGap + colWidth - 60, 395)
         .stroke();
      
      doc.fill('#333333')
         .fontSize(11)
         .font('Helvetica')
         .text(plant.careNotes, colWidth + 100 + colGap, 405, { 
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
            doc.fill('#333333')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(`${i + 1}. ${disease.name || 'N/A'}`, 80, yPos + 275 + (i * 20), { continued: false, width: colWidth - 40 })
               .font('Helvetica')
               .fontSize(9)
               .text(`Traitement: ${disease.treatment || 'N/A'}`, 100, yPos + 290 + (i * 20), { width: colWidth - 60 });
          }
        }
      } catch (error) {
        console.error('Erreur lors du parsing des maladies communes:', error);
      }
    }
    
    // Pied de page avec barre colorée
    doc.rect(0, doc.page.height - 50, doc.page.width, 50)
       .fill(primaryColor);
    
    doc.fill('#FFFFFF')
       .fontSize(10)
       .text('© Mon Suivi Vert - L\'application qui vous aide à prendre soin de vos plantes', 
             40, doc.page.height - 30, { align: 'center' });

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