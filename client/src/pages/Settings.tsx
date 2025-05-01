import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AdminPanel } from '../components/AdminPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    emailNotifications: true,
    theme: localStorage.getItem('theme') || 'light'
  });

  // Appliquer le thème au chargement
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else if (settings.theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const handleSettingChange = async (key: string, value: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des paramètres');
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      if (key === 'theme') {
        localStorage.setItem('theme', value);
      }
      toast({
        title: "Paramètres mis à jour",
        description: "Vos préférences ont été enregistrées avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Paramètres</h1>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sauvegarde en cours...
          </div>
        )}
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Paramètres Généraux</TabsTrigger>
          {user?.username === 'Anteen' && (
            <TabsTrigger value="admin">Administration</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Paramètres Généraux</CardTitle>
              <CardDescription>
                Personnalisez votre expérience sur Mon Suivi Vert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des notifications pour vos plantes et activités
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des rappels par email pour l'arrosage de vos plantes
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Thème</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choisissez l'apparence de l'application
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      onClick={() => handleSettingChange('theme', 'light')}
                      disabled={isSaving}
                    >
                      Clair
                    </Button>
                    <Button
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => handleSettingChange('theme', 'dark')}
                      disabled={isSaving}
                    >
                      Sombre
                    </Button>
                    <Button
                      variant={settings.theme === 'system' ? 'default' : 'outline'}
                      onClick={() => handleSettingChange('theme', 'system')}
                      disabled={isSaving}
                    >
                      Système
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.username === 'Anteen' && (
          <TabsContent value="admin" className="space-y-4">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 