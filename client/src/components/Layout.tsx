import { ReactNode } from "react";
import { useLocation } from "wouter";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import OnboardingTutorial from "./OnboardingTutorial";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Ne pas afficher le menu sur les pages d'authentification et de réinitialisation de mot de passe
  const showNavigation = !['/auth', '/reset-password'].some(path => location.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Header />}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
      <OnboardingTutorial />
    </div>
  );
}
