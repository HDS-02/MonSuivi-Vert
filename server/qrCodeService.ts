import QRCode from 'qrcode';

/**
 * Service de génération de QR codes pour les plantes
 */
export class QRCodeService {
  /**
   * Génère un QR code pour une plante donnée
   * @param plantId ID de la plante
   * @param size Taille du QR code en pixels
   * @returns Image du QR code en base64
   */
  public async generatePlantQRCode(plantId: number, size: number = 300): Promise<string> {
    try {
      // L'URL pointe vers la page détaillée de la plante
      const plantUrl = `${process.env.BASE_URL || 'https://mon-suivi-vert.replit.app'}/plants/${plantId}`;
      
      // Options pour le QR code
      const options = {
        errorCorrectionLevel: 'M' as const,
        margin: 2,
        color: {
          dark: '#3B8564', // Vert primaire de l'application
          light: '#FFFFFF' // Fond blanc
        },
        width: size
      };
      
      // Génération du QR code en base64
      return new Promise<string>((resolve, reject) => {
        QRCode.toDataURL(plantUrl, options, (err, url) => {
          if (err) {
            reject(err);
          } else {
            resolve(url);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      throw new Error('Impossible de générer le QR code pour cette plante');
    }
  }
  
  /**
   * Génère un QR code sous forme de chaîne SVG
   * @param plantId ID de la plante
   * @returns Chaîne SVG du QR code
   */
  public async generatePlantQRCodeSVG(plantId: number): Promise<string> {
    try {
      const plantUrl = `${process.env.BASE_URL || 'https://mon-suivi-vert.replit.app'}/plants/${plantId}`;
      
      // Options pour le QR code SVG
      const options = {
        errorCorrectionLevel: 'M' as const,
        type: 'svg' as const,
        margin: 2,
        color: {
          dark: '#3B8564', // Vert primaire de l'application
          light: '#FFFFFF' // Fond blanc
        }
      };
      
      // Génération du QR code en SVG
      return new Promise<string>((resolve, reject) => {
        QRCode.toString(plantUrl, options, (err, string) => {
          if (err) {
            reject(err);
          } else {
            resolve(string);
          }
        });
      });
    } catch (error) {
      console.error('Erreur lors de la génération du QR code SVG:', error);
      throw new Error('Impossible de générer le QR code SVG pour cette plante');
    }
  }
}

export const qrCodeService = new QRCodeService();