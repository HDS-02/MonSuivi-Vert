import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download, QrCode } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface PlantQRCodeProps {
  plantId: number;
  plantName: string;
}

export function PlantQRCode({ plantId, plantName }: PlantQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !qrCodeData && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      fetch(`/api/plants/${plantId}/qrcode`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération du QR code');
          }
          return response.json();
        })
        .then(data => {
          setQrCodeData(data.qrcode);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [plantId, qrCodeData, isLoading, isOpen]);

  const downloadQrCode = () => {
    if (!qrCodeData) return;
    
    // Créer un lien temporaire
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `qrcode-plante-${plantName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSvgQrCode = () => {
    setIsLoading(true);
    
    // Aller chercher le SVG directement
    fetch(`/api/plants/${plantId}/qrcode/svg`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du QR code SVG');
        }
        return response.text();
      })
      .then(svgContent => {
        // Créer un blob avec le contenu SVG
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien temporaire
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-plante-${plantName.replace(/\s+/g, '-').toLowerCase()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Libérer l'URL
        URL.revokeObjectURL(url);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  };
  
  const downloadPdf = () => {
    setIsLoading(true);
    setError(null);
    
    // Ouvrir un nouvel onglet avec le PDF
    const pdfUrl = `/api/plants/${plantId}/pdf`;
    window.open(pdfUrl, '_blank');
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Réinitialiser les états si la boîte de dialogue est fermée
      setQrCodeData(null);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          <span>Étiquette QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <button 
            className="absolute right-0 top-0 rounded-full w-6 h-6 inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Fermer</span>
            <span className="material-icons text-sm">close</span>
          </button>
          <DialogTitle>Étiquette QR Code</DialogTitle>
          <DialogDescription>
            Générez une étiquette QR code pour votre plante {plantName}.
            Vous pourrez scanner ce code plus tard pour accéder rapidement à sa fiche.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <span>Génération du QR code...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-6 text-center">
              <p>{error}</p>
              <Button onClick={() => {setQrCodeData(null); setError(null);}} className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : qrCodeData ? (
            <div className="flex flex-col items-center gap-4">
              <img 
                src={qrCodeData} 
                alt={`QR Code pour ${plantName}`} 
                className="border p-2 rounded-md max-w-[250px]"
              />
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  <Button onClick={downloadQrCode} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PNG
                  </Button>
                  <Button onClick={downloadSvgQrCode} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger SVG
                  </Button>
                </div>
                <Button 
                  onClick={downloadPdf} 
                  variant="default" 
                  className="w-full mt-2 bg-green-700 hover:bg-green-800"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Télécharger fiche PDF complète
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Imprimez cette étiquette, la fiche PDF complète ou placez-la près de votre plante pour un accès rapide.
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}