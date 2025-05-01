import React, { useState, useEffect } from 'react';
import { User } from '@shared/schema';
import AdminPanel from '../components/AdminPanel';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);

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
      
      {user?.isAdmin && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Administration</h2>
          <AdminPanel />
        </div>
      )}

      {/* ... existing settings content ... */}
    </div>
  );
} 