import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StableDialog } from "./StableDialog";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";

interface QRCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRCodeScanner({ open, onOpenChange }: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Références pour la vidéo et le canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Fonction pour traiter la frame vidéo actuelle
  const processVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0) {
      // Vidéo pas encore prête
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }
    
    // Ajuster la taille du canvas à celle de la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner la frame vidéo sur le canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obtenir les données d'image du canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    try {
      // Analyser l'image pour détecter un QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        // Un QR code a été trouvé!
        console.log("QR Code trouvé:", code.data);
        handleQRSuccess(code.data);
        return; // Arrêter l'analyse quand un code est trouvé
      }
    } catch (e) {
      console.error("Erreur lors de l'analyse QR:", e);
    }
    
    // Continuer l'analyse avec la prochaine frame
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  // Récupération de la caméra et analyse du QR code
  useEffect(() => {
    if (!open || !scanning) return;

    const setupScanner = async () => {
      try {
        if (!videoRef.current) {
          setError("Éléments vidéo non trouvés");
          return;
        }

        // Accéder à la caméra (arrière si possible)
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
        
        // Démarrer l'analyse de la vidéo frame par frame
        processVideoFrame();
        
        console.log("Scanner QR opérationnel - en attente d'un QR code");

      } catch (err) {
        console.error('Erreur d\'accès à la caméra:', err);
        setError("Impossible d'accéder à votre caméra. Vérifiez les permissions.");
      }
    };

    const cleanup = () => {
      // Arrêter l'animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Arrêter la caméra
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
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
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              ></video>
              <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              ></canvas>
              <div className="absolute inset-0 border-2 border-primary/70 rounded-lg"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/80 rounded-lg"></div>
              
              {/* Message d'attente */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-pulse inline-block h-3 w-3 rounded-full bg-green-500"></span>
                  <p>Scanner actif - Montrez un QR code</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                Centrez le QR code dans le cadre pour un scan automatique
              </div>
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
                <Button
                  onClick={() => window.location.href = result}
                  className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg px-5 py-2"
                >
                  <span className="material-icons mr-2">visibility</span>
                  Voir la plante
                </Button>
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