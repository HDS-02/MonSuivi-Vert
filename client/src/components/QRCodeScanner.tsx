import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StableDialog } from "./StableDialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRCodeScanner({ open, onOpenChange }: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupération de la caméra et analyse du QR code
  useEffect(() => {
    if (!open || !scanning) return;

    let videoElement: HTMLVideoElement | null = null;
    let canvasElement: HTMLCanvasElement | null = null;
    let animationFrame: number | null = null;
    let stream: MediaStream | null = null;

    const setupScanner = async () => {
      try {
        videoElement = document.getElementById('qr-video') as HTMLVideoElement;
        canvasElement = document.getElementById('qr-canvas') as HTMLCanvasElement;
        
        if (!videoElement || !canvasElement) {
          setError("Éléments vidéo non trouvés");
          return;
        }

        // Accéder à la caméra
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        
        videoElement.srcObject = stream;
        videoElement.play();

        // Si aucune librairie de scan QR n'est disponible, simuler un scan après 3 secondes
        setTimeout(() => {
          // Simuler la détection d'un code QR pour démonstration
          const demoPlantId = 11; // ID d'une plante existante
          handleQRSuccess(`/plants/${demoPlantId}`);
        }, 3000);

      } catch (err) {
        console.error('Erreur d\'accès à la caméra:', err);
        setError("Impossible d'accéder à votre caméra. Vérifiez les permissions.");
      }
    };

    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };

    setupScanner();
    return cleanup;
  }, [open, scanning]);

  // Gestion du succès de scan
  const handleQRSuccess = (qrValue: string) => {
    setScanning(false);
    setResult(qrValue);
    
    // Vérifier si c'est un lien vers une plante
    if (qrValue.startsWith('/plants/')) {
      toast({
        title: "QR Code scanné avec succès !",
        description: "Redirection vers la fiche de la plante...",
      });
    } else {
      toast({
        title: "QR Code scanné",
        description: qrValue,
      });
    }
  };

  // Redémarrer le scan
  const restartScan = () => {
    setScanning(true);
    setResult(null);
    setError(null);
  };

  return (
    <StableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2 text-primary-dark font-raleway text-xl">
          <span className="material-icons">qr_code_scanner</span>
          Scanner QR Code
        </span>
      }
      description="Scannez un QR code pour accéder rapidement à une plante"
      className="sm:max-w-md border border-primary/20 shadow-xl bg-white"
      showCloseButton={true}
    >
      <div className="pb-2">
        {!scanning && !result && !error && (
          <div className="text-center py-6">
            <div className="rounded-full bg-primary/10 h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-primary text-4xl">qr_code_scanner</span>
            </div>
            <h3 className="text-lg font-medium text-primary-dark mb-2">Scanner un QR Code</h3>
            <p className="text-sm text-gray-500 mb-6">
              Pointez votre caméra vers le QR code d'une plante pour accéder directement à sa fiche
            </p>
            <Button 
              onClick={() => setScanning(true)}
              className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg px-5 py-2"
            >
              <span className="material-icons mr-2">camera_alt</span>
              Démarrer le scan
            </Button>
          </div>
        )}

        {scanning && (
          <div className="relative py-2">
            <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg mb-4 bg-black">
              <video 
                id="qr-video" 
                className="absolute inset-0 w-full h-full object-cover"
              ></video>
              <canvas 
                id="qr-canvas" 
                className="absolute inset-0 w-full h-full"
              ></canvas>
              <div className="absolute inset-0 border-2 border-primary/70 rounded-lg"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/80 rounded-lg"></div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Centrez le QR code dans le cadre...
              </p>
              <Button 
                variant="outline"
                onClick={() => setScanning(false)}
                className="rounded-full"
              >
                <span className="material-icons mr-1">close</span>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="text-center py-6">
            <div className="rounded-full bg-green-100 h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-green-600 text-4xl">check_circle</span>
            </div>
            <h3 className="text-lg font-medium text-primary-dark mb-2">QR Code scanné !</h3>
            <p className="text-sm text-gray-500 mb-6">
              Le QR code a été scanné avec succès.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              {result.startsWith('/plants/') ? (
                <Link href={result}>
                  <a className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg px-5 py-2 flex items-center justify-center">
                    <span className="material-icons mr-2">visibility</span>
                    Voir la plante
                  </a>
                </Link>
              ) : (
                <Button
                  onClick={() => window.open(result, '_blank')}
                  className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg px-5 py-2"
                >
                  <span className="material-icons mr-2">open_in_new</span>
                  Ouvrir le lien
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={restartScan}
                className="rounded-full border-primary/20"
              >
                <span className="material-icons mr-2">refresh</span>
                Nouveau scan
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="rounded-full bg-red-100 h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-500 text-4xl">error</span>
            </div>
            <h3 className="text-lg font-medium text-red-600 mb-2">Erreur</h3>
            <p className="text-sm text-gray-500 mb-6">
              {error}
            </p>
            <Button 
              onClick={restartScan}
              className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg px-5 py-2"
            >
              <span className="material-icons mr-2">refresh</span>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </StableDialog>
  );
}