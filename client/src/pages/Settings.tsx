import React, { useState, useEffect } from 'react';
import { User } from '@shared/schema';
import { AdminPanel } from '../components/AdminPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Paramètres Généraux</TabsTrigger>
          {user?.username === 'Anteen' && (
            <TabsTrigger value="admin">Administration</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configurez vos préférences personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                  <Label htmlFor="notifications">Activer les notifications</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notifications par email</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                  <Label htmlFor="email-notifications">Recevoir les notifications par email</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thème</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                  <option value="system">Système</option>
                </select>
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