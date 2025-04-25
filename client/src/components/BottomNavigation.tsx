import { useLocation, Link } from "wouter";
import { useState } from "react";
import QRCodeScanner from "./QRCodeScanner";

export default function BottomNavigation() {
  const [location] = useLocation();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border-t border-gray-200 dark:border-gray-800 z-10">
        <div className="flex justify-around">
          <Link href="/">
            <div className={`py-3 px-3 flex flex-col items-center ${location === "/" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
              <span className="material-icons text-current">home</span>
              <span className="text-xs mt-1">Accueil</span>
            </div>
          </Link>
          <Link href="/plants">
            <div className={`py-3 px-3 flex flex-col items-center ${location === "/plants" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
              <span className="material-icons text-current">format_list_bulleted</span>
              <span className="text-xs mt-1">Mes plantes</span>
            </div>
          </Link>

          {/* Bouton central Scanner QR */}
          <div className="relative flex justify-center -mt-5">
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="w-14 h-14 bg-gradient-to-r from-primary to-primary-light rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="material-icons text-2xl">qr_code_scanner</span>
            </button>
          </div>

          <Link href="/badges">
            <div className={`py-3 px-3 flex flex-col items-center ${location === "/badges" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
              <span className="material-icons text-current">emoji_events</span>
              <span className="text-xs mt-1">Badges</span>
            </div>
          </Link>
          <Link href="/calendar">
            <div className={`py-3 px-3 flex flex-col items-center ${location === "/calendar" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
              <span className="material-icons text-current">calendar_today</span>
              <span className="text-xs mt-1">Calendrier</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Scanner QR Code Dialog */}
      <QRCodeScanner 
        open={isQRScannerOpen} 
        onOpenChange={setIsQRScannerOpen} 
      />
    </>
  );
}
