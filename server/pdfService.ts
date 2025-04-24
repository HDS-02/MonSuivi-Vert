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
      margin: 50,
      info: {
        Title: `Fiche de plante - ${plant.name}`,
        Author: 'Mon Suivi Vert',
        Subject: `Fiche détaillée de ${plant.name}`,
      }
    });

    // Pipe le document PDF dans un buffer
    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    
    // Ajouter le titre
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Mon Suivi Vert', { align: 'center' })
       .moveDown(0.5);
    
    // Ajouter le sous-titre
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`Fiche de la plante: ${plant.name}`, { align: 'center' })
       .moveDown(1);

    // Ajouter l'image de la plante si disponible
    if (plant.image) {
      try {
        const imgBuffer = Buffer.from(plant.image.split(',')[1], 'base64');
        doc.image(imgBuffer, {
          fit: [250, 250],
          align: 'center',
        });
        doc.moveDown(1);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'image de la plante:', error);
      }
    }

    // Ajouter les informations de la plante
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Informations détaillées:')
       .moveDown(0.5)
       .fontSize(12)
       .font('Helvetica');

    // Ajouter une ligne de séparation
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke()
       .moveDown(0.5);

    // Fonction d'aide pour ajouter une ligne d'information
    const addInfoLine = (label: string, value: string | null | undefined) => {
      if (value) {
        doc.font('Helvetica-Bold')
           .text(`${label}: `, { continued: true })
           .font('Helvetica')
           .text(value)
           .moveDown(0.5);
      }
    };

    // Ajouter les détails de la plante
    addInfoLine('Nom', plant.name);
    addInfoLine('Espèce', plant.species);
    addInfoLine('Statut', plant.status);
    addInfoLine('Fréquence d\'arrosage', 
      plant.wateringFrequency ? `Tous les ${plant.wateringFrequency} jours` : 'Non spécifiée');
    addInfoLine('Lumière recommandée', plant.light);
    addInfoLine('Température idéale', plant.temperature);
    addInfoLine('Taille de pot', plant.potSize);
    
    // Ajouter les notes de soin si disponibles
    if (plant.careNotes) {
      doc.moveDown(0.5)
         .font('Helvetica-Bold')
         .text('Notes de soin:')
         .font('Helvetica')
         .text(plant.careNotes)
         .moveDown(1);
    }

    // Ajouter les maladies communes si disponibles
    if (plant.commonDiseases) {
      try {
        const diseases = JSON.parse(plant.commonDiseases.toString());
        if (Array.isArray(diseases) && diseases.length > 0) {
          doc.moveDown(0.5)
             .font('Helvetica-Bold')
             .text('Maladies communes:')
             .font('Helvetica');
          
          diseases.forEach((disease: any, index: number) => {
            doc.moveDown(0.3)
               .font('Helvetica-Bold')
               .text(`${index + 1}. ${disease.name}:`, { continued: false })
               .font('Helvetica')
               .text(`Description: ${disease.description}`)
               .text(`Traitement: ${disease.treatment}`)
               .moveDown(0.3);
          });
        }
      } catch (error) {
        console.error('Erreur lors du parsing des maladies communes:', error);
      }
    }

    // Ajouter le QR code
    doc.moveDown(1)
       .font('Helvetica-Bold')
       .text('QR Code pour accès rapide:', { align: 'center' })
       .moveDown(0.5);

    // Positionner le QR code au centre
    const pageWidth = doc.page.width;
    const qrCodeWidth = 150;
    const qrCodeX = (pageWidth - qrCodeWidth) / 2;
    
    try {
      // Ajouter le SVG du QR code
      SVGtoPDF(doc, qrCodeSVG, qrCodeX, doc.y, {
        width: qrCodeWidth,
        height: qrCodeWidth,
      });
      
      // Déplacer le curseur après le QR code
      doc.moveDown(qrCodeWidth / 12 + 1);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du QR code:', error);
      doc.text('Erreur lors de la génération du QR code', { align: 'center' });
    }

    // Ajouter un pied de page
    const footerY = doc.page.height - 50;
    doc.fontSize(8)
       .text('© Mon Suivi Vert - Document généré le ' + new Date().toLocaleDateString('fr-FR'), 
             50, footerY, { align: 'center' });

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