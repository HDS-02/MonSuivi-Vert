import React, { useState } from 'react';
import { User } from '@shared/schema';
import AdminPanel from '../components/AdminPanel';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      {user?.username === 'Anteen' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Administration</h2>
          <AdminPanel />
        </div>
      )}

      {/* ... existing settings content ... */}
    </div>
  );
} 