import React, { useEffect, useState } from 'react';
import { CommunityTip } from '@shared/schema';

export default function AdminPanel() {
  const [pendingTips, setPendingTips] = useState<CommunityTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTips();
  }, []);

  const fetchPendingTips = async () => {
    try {
      const response = await fetch('/api/community/tips/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingTips(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des posts en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (tipId: number) => {
    try {
      const response = await fetch(`/api/community/tips/${tipId}/validate`, {
        method: 'POST',
      });
      if (response.ok) {
        setPendingTips(pendingTips.filter(tip => tip.id !== tipId));
      }
    } catch (error) {
      console.error('Erreur lors de la validation du post:', error);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Validation des posts du forum</h2>
      {pendingTips.length === 0 ? (
        <p>Aucun post en attente de validation</p>
      ) : (
        <div className="space-y-4">
          {pendingTips.map(tip => (
            <div key={tip.id} className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold">{tip.title}</h3>
              <p className="text-gray-600 mb-2">Catégorie: {tip.category}</p>
              <p className="mb-4">{tip.content}</p>
              <button
                onClick={() => handleValidate(tip.id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Valider
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 