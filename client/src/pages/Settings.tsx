import React, { useState, useEffect } from 'react';
import { User } from '@shared/schema';
import AdminPanel from '../components/AdminPanel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  // États pour les paramètres
  const [darkMode, setDarkMode] = useState(() => {
    const storedValue = localStorage.getItem('darkMode');
    return storedValue ? JSON.parse(storedValue) : false;
  });
  
  const [notifications, setNotifications] = useState(() => {
    const storedValue = localStorage.getItem('notifications');
    return storedValue ? JSON.parse(storedValue) : true;
  });
  
  const [emailNotifications, setEmailNotifications] = useState(() => {
    const storedValue = localStorage.getItem('emailNotifications');
    return storedValue ? JSON.parse(storedValue) : false;
  });
  
  const [emailAddress, setEmailAddress] = useState(() => {
    const storedValue = localStorage.getItem('userEmail');
    return storedValue || '';
  });

  // Effet pour appliquer le mode sombre
  useEffect(() => {
    const rootElement = document.documentElement;
    if (darkMode) {
      rootElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Sauvegarder les paramètres
  const saveSettings = () => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
    localStorage.setItem('userEmail', emailAddress);
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos préférences ont été mises à jour",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      {user?.isAdmin && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Administration</h2>
          <AdminPanel />
        </div>
      )}

      <div className="space-y-6">
        {/* Section Apparence */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Apparence</h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="material-icons text-gray-700 dark:text-gray-300">dark_mode</span>
              </div>
              <div>
                <span className="block text-sm font-medium">Mode sombre</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Réduire la luminosité de l'écran</span>
              </div>
            </Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <Separator />

        {/* Section Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="app-notif" className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="material-icons text-gray-700 dark:text-gray-300">notifications_active</span>
                </div>
                <div>
                  <span className="block text-sm font-medium">Notifications de l'application</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Rappels d'entretien dans l'application</span>
                </div>
              </Label>
              <Switch
                id="app-notif"
                checked={notifications}
                onCheckedChange={setNotifications}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif" className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="material-icons text-gray-700 dark:text-gray-300">email</span>
                </div>
                <div>
                  <span className="block text-sm font-medium">Notifications par email</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Recevez les rappels par email</span>
                </div>
              </Label>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {emailNotifications && (
              <div className="mt-4">
                <Label htmlFor="email-address" className="text-sm font-medium mb-2 block">
                  Adresse email pour les rappels
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="votre@email.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Section À propos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">À propos</h2>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Mon Suivi Vert</h4>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              v1.0.0
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Une application d'analyse et de suivi de santé des plantes.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © 2025 Mon Suivi Vert. Tous droits réservés.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="bg-primary text-white"
          onClick={saveSettings}
        >
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
} 