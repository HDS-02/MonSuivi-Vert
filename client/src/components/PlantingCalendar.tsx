import React, { useState } from 'react';
import { Plant } from '@shared/schema';

interface PlantingPeriod {
  start: number; // Mois de début (1-12)
  end: number; // Mois de fin (1-12)
}

interface PlantingCalendarData {
  seeding?: PlantingPeriod;
  planting?: PlantingPeriod;
  harvesting?: PlantingPeriod;
}

interface PlantingCalendarProps {
  plant: Plant;
  calendarData?: PlantingCalendarData;
}

const months = [
  { name: 'JAN', id: 1 },
  { name: 'FEV', id: 2 },
  { name: 'MAR', id: 3 },
  { name: 'AVR', id: 4 },
  { name: 'MAI', id: 5 },
  { name: 'JUN', id: 6 },
  { name: 'JUL', id: 7 },
  { name: 'AOU', id: 8 },
  { name: 'SEP', id: 9 },
  { name: 'OCT', id: 10 },
  { name: 'NOV', id: 11 },
  { name: 'DEC', id: 12 },
];

// Base de données des périodes de semis/plantation/récolte
// Ces informations seraient idéalement stockées dans une base de données
const plantingPeriods: Record<string, PlantingCalendarData> = {
  // Légumes
  "Tomate": {
    seeding: { start: 3, end: 4 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 7, end: 9 }
  },
  "Carotte": {
    seeding: { start: 2, end: 5 },
    planting: { start: 3, end: 7 },
    harvesting: { start: 5, end: 10 }
  },
  "Laitue": {
    seeding: { start: 2, end: 9 },
    planting: { start: 3, end: 9 },
    harvesting: { start: 4, end: 10 }
  },
  "Chou-fleur": {
    seeding: { start: 5, end: 6 },
    planting: { start: 7, end: 8 },
    harvesting: { start: 10, end: 12 }
  },
  "Chou": {
    seeding: { start: 5, end: 7 },
    planting: { start: 7, end: 8 },
    harvesting: { start: 9, end: 12 }
  },
  "Poivron": {
    seeding: { start: 2, end: 3 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 7, end: 10 }
  },
  "Aubergine": {
    seeding: { start: 2, end: 3 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 7, end: 10 }
  },
  "Courgette": {
    seeding: { start: 3, end: 4 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 6, end: 10 }
  },
  "Concombre": {
    seeding: { start: 3, end: 4 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 6, end: 9 }
  },
  "Radis": {
    seeding: { start: 2, end: 9 },
    planting: { start: 3, end: 9 },
    harvesting: { start: 4, end: 10 }
  },
  "Épinard": {
    seeding: { start: 2, end: 5 },
    planting: { start: 3, end: 5 },
    harvesting: { start: 5, end: 11 }
  },
  "Salade": {
    seeding: { start: 2, end: 9 },
    planting: { start: 3, end: 9 },
    harvesting: { start: 4, end: 10 }
  },
  "Pomme de terre": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 9 }
  },
  "Haricot": {
    seeding: { start: 4, end: 7 },
    planting: { start: 5, end: 7 },
    harvesting: { start: 7, end: 10 }
  },
  "Pois": {
    seeding: { start: 2, end: 4 },
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 8 }
  },
  "Oignon": {
    seeding: { start: 2, end: 3 },
    planting: { start: 3, end: 4 },
    harvesting: { start: 7, end: 9 }
  },
  "Ail": {
    planting: { start: 10, end: 11 },
    harvesting: { start: 6, end: 8 }
  },
  "Betterave": {
    seeding: { start: 3, end: 7 },
    planting: { start: 4, end: 8 },
    harvesting: { start: 6, end: 11 }
  },
  "Brocoli": {
    seeding: { start: 3, end: 6 },
    planting: { start: 4, end: 7 },
    harvesting: { start: 6, end: 10 }
  },
  "Courge": {
    seeding: { start: 4, end: 5 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 8, end: 10 }
  },
  "Citrouille": {
    seeding: { start: 4, end: 5 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 9, end: 10 }
  },
  "Maïs": {
    seeding: { start: 4, end: 5 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 8, end: 9 }
  },
  "Poireau": {
    seeding: { start: 2, end: 4 },
    planting: { start: 5, end: 7 },
    harvesting: { start: 9, end: 2 }
  },
  "Asperge": {
    planting: { start: 3, end: 4 },
    harvesting: { start: 4, end: 6 }
  },
  "Artichaut": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 9 }
  },
  "Céleri": {
    seeding: { start: 3, end: 4 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 8, end: 10 }
  },
  "Fenouil": {
    seeding: { start: 4, end: 7 },
    planting: { start: 5, end: 8 },
    harvesting: { start: 7, end: 10 }
  },
  "Navet": {
    seeding: { start: 3, end: 8 },
    planting: { start: 4, end: 9 },
    harvesting: { start: 5, end: 11 }
  },
  "Panais": {
    seeding: { start: 2, end: 5 },
    planting: { start: 3, end: 6 },
    harvesting: { start: 9, end: 12 }
  },
  "Rhubarbe": {
    planting: { start: 3, end: 4 },
    harvesting: { start: 5, end: 7 }
  },
  "Endive": {
    seeding: { start: 5, end: 7 },
    planting: { start: 7, end: 9 },
    harvesting: { start: 11, end: 3 }
  },
  
  // Arbres fruitiers
  "Pommier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 8, end: 11 }
  },
  "Poirier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 8, end: 10 }
  },
  "Cerisier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 5, end: 7 }
  },
  "Prunier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 7, end: 9 }
  },
  "Pêcher": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 7, end: 9 }
  },
  "Abricotier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 6, end: 8 }
  },
  "Framboisier": {
    planting: { start: 10, end: 4 },
    harvesting: { start: 6, end: 10 }
  },
  "Fraisier": {
    planting: { start: 3, end: 4 },
    harvesting: { start: 5, end: 9 }
  },
  "Avocatier": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 9, end: 2 }
  },
  "Citronnier": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 11, end: 4 }
  },
  "Oranger": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 11, end: 4 }
  },
  "Olivier": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 9, end: 12 }
  },
  "Figuier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 7, end: 10 }
  },
  "Mûrier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 6, end: 9 }
  },
  "Groseillier": {
    planting: { start: 10, end: 3 },
    harvesting: { start: 6, end: 8 }
  },
  "Nectarinier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 7, end: 9 }
  },
  "Kiwi": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 10, end: 11 }
  },
  "Noyer": {
    planting: { start: 11, end: 2 },
    harvesting: { start: 9, end: 10 }
  },
  "Châtaignier": {
    planting: { start: 11, end: 2 },
    harvesting: { start: 9, end: 11 }
  },
  "Noisetier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 9, end: 10 }
  },
  "Mandarinier": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 11, end: 2 }
  },
  "Amandier": {
    planting: { start: 11, end: 2 },
    harvesting: { start: 8, end: 10 }
  },
  "Grenadier": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 9, end: 11 }
  },
  "Kakier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 10, end: 12 }
  },
  "Cognassier": {
    planting: { start: 11, end: 3 },
    harvesting: { start: 9, end: 10 }
  },
  "Myrtillier": {
    planting: { start: 10, end: 3 },
    harvesting: { start: 7, end: 9 }
  },
  "Cassissier": {
    planting: { start: 10, end: 3 },
    harvesting: { start: 6, end: 8 }
  },
  
  // Plantes aromatiques
  "Basilic": {
    seeding: { start: 3, end: 5 },
    planting: { start: 5, end: 6 },
    harvesting: { start: 6, end: 9 }
  },
  "Persil": {
    seeding: { start: 3, end: 8 },
    planting: { start: 4, end: 9 },
    harvesting: { start: 5, end: 10 }
  },
  "Thym": {
    seeding: { start: 3, end: 5 },
    planting: { start: 4, end: 6 },
    harvesting: { start: 6, end: 10 }
  },
  "Romarin": {
    planting: { start: 3, end: 10 },
    harvesting: { start: 5, end: 10 }
  },
  "Menthe": {
    planting: { start: 4, end: 6 },
    harvesting: { start: 6, end: 10 }
  },
  "Ciboulette": {
    seeding: { start: 3, end: 5 },
    planting: { start: 4, end: 6 },
    harvesting: { start: 5, end: 10 }
  },
  "Coriandre": {
    seeding: { start: 3, end: 8 },
    planting: { start: 4, end: 9 },
    harvesting: { start: 5, end: 10 }
  },
  "Aneth": {
    seeding: { start: 3, end: 7 },
    planting: { start: 4, end: 8 },
    harvesting: { start: 5, end: 10 }
  },
  "Estragon": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 10 }
  },
  "Sarriette": {
    seeding: { start: 3, end: 5 },
    planting: { start: 4, end: 6 },
    harvesting: { start: 6, end: 10 }
  },
  "Sauge": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 10 }
  },
  "Origan": {
    planting: { start: 3, end: 6 },
    harvesting: { start: 6, end: 10 }
  },
  "Lavande": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 9 }
  },
  "Mélisse": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 9 }
  },
  
  // Plantes d'intérieur
  "Ficus": {
    planting: { start: 3, end: 9 }
  },
  "Monstera": {
    planting: { start: 3, end: 9 }
  },
  "Pothos": {
    planting: { start: 3, end: 9 }
  },
  "Sansevière": {
    planting: { start: 3, end: 9 }
  },
  "Aglaonéma": {
    planting: { start: 3, end: 9 }
  },
  "Calathea": {
    planting: { start: 3, end: 9 }
  },
  "Philodendron": {
    planting: { start: 3, end: 9 }
  },
  "Dracaena": {
    planting: { start: 3, end: 9 }
  },
  "Palmier d'intérieur": {
    planting: { start: 3, end: 9 }
  },
  "Yucca": {
    planting: { start: 3, end: 9 }
  },
  "Cactus": {
    planting: { start: 3, end: 9 }
  },
  "Aloe Vera": {
    planting: { start: 3, end: 9 }
  },
  "Orchidée": {
    planting: { start: 3, end: 9 }
  },
  "Bégonia": {
    planting: { start: 3, end: 9 }
  },
  "Anthurium": {
    planting: { start: 3, end: 9 }
  },
  "Spathiphyllum": {
    planting: { start: 3, end: 9 }
  },
  
  // Fleurs de jardin
  "Rose": {
    planting: { start: 10, end: 3 },
    harvesting: { start: 5, end: 9 }
  },
  "Tulipe": {
    planting: { start: 9, end: 11 },
    harvesting: { start: 3, end: 5 }
  },
  "Jonquille": {
    planting: { start: 9, end: 11 },
    harvesting: { start: 3, end: 5 }
  },
  "Dahlia": {
    planting: { start: 4, end: 6 },
    harvesting: { start: 7, end: 10 }
  },
  "Pivoine": {
    planting: { start: 9, end: 11 },
    harvesting: { start: 5, end: 6 }
  },
  "Iris": {
    planting: { start: 7, end: 9 },
    harvesting: { start: 4, end: 6 }
  },
  "Lys": {
    planting: { start: 9, end: 11 },
    harvesting: { start: 6, end: 8 }
  },
  "Hortensia": {
    planting: { start: 10, end: 4 },
    harvesting: { start: 6, end: 9 }
  },
  "Géranium": {
    planting: { start: 4, end: 6 },
    harvesting: { start: 5, end: 10 }
  },
  "Lilas": {
    planting: { start: 10, end: 3 },
    harvesting: { start: 4, end: 5 }
  },
  "Œillet": {
    planting: { start: 3, end: 5 },
    harvesting: { start: 5, end: 9 }
  }
};

// Fonction pour obtenir une couleur selon le type de période
const getColorForPeriodType = (type: 'seeding' | 'planting' | 'harvesting'): string => {
  switch (type) {
    case 'seeding':
      return 'bg-blue-300 border-blue-400';
    case 'planting':
      return 'bg-orange-300 border-orange-400';
    case 'harvesting':
      return 'bg-green-400 border-green-500';
    default:
      return 'bg-gray-200 border-gray-300';
  }
};

// Récupérer les données pour une plante spécifique
const getPlantData = (plant: Plant): PlantingCalendarData => {
  // Rechercher par nom exact
  if (plantingPeriods[plant.name]) {
    return plantingPeriods[plant.name];
  }
  
  // Rechercher par correspondance partielle du nom
  const plantNames = Object.keys(plantingPeriods);
  for (const name of plantNames) {
    if (plant.name.includes(name) || name.includes(plant.name)) {
      return plantingPeriods[name];
    }
  }
  
  // Si aucune correspondance n'est trouvée, retourner un objet vide
  return {};
};

const PlantingCalendar: React.FC<PlantingCalendarProps> = ({ plant, calendarData }) => {
  // Utiliser soit les données fournies, soit rechercher les données pour cette plante
  const data = calendarData || getPlantData(plant);
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg overflow-hidden shadow-md">
      <div className="bg-gradient-to-r from-primary to-primary-light text-white text-center py-4 px-6 rounded-t-lg">
        <h3 className="text-xl font-bold">CALENDRIER DES PLANTATIONS</h3>
        <p className="text-sm opacity-90">
          {plant.name} ({plant.species})
        </p>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-12 gap-0 border-b border-gray-200 mb-2">
          {months.map(month => (
            <div 
              key={month.id} 
              className="text-xs text-center py-1 font-semibold"
            >
              {month.name}
            </div>
          ))}
        </div>
        
        <div className="relative h-20 bg-gray-50 rounded mb-4 grid grid-cols-12 gap-0">
          {/* Ligne pour le semis */}
          {data.seeding && (
            <div 
              className={`absolute h-4 rounded-full ${getColorForPeriodType('seeding')} border`}
              style={{
                left: `${(data.seeding.start - 1) * (100/12)}%`,
                width: `${(data.seeding.end - data.seeding.start + 1) * (100/12)}%`,
                top: '10%'
              }}
            />
          )}
          
          {/* Ligne pour la plantation */}
          {data.planting && (
            <div 
              className={`absolute h-4 rounded-full ${getColorForPeriodType('planting')} border`}
              style={{
                left: `${(data.planting.start - 1) * (100/12)}%`,
                width: `${(data.planting.end - data.planting.start + 1) * (100/12)}%`,
                top: '40%'
              }}
            />
          )}
          
          {/* Ligne pour la récolte */}
          {data.harvesting && (
            <div 
              className={`absolute h-4 rounded-full ${getColorForPeriodType('harvesting')} border`}
              style={{
                left: `${(data.harvesting.start - 1) * (100/12)}%`,
                width: `${(data.harvesting.end - data.harvesting.start + 1) * (100/12)}%`,
                top: '70%'
              }}
            />
          )}
          
          {/* Lignes verticales pour les mois */}
          {months.map((month, index) => (
            <div 
              key={month.id} 
              className={`h-full border-r border-gray-200 ${index === 0 ? 'border-l' : ''}`}
            />
          ))}
        </div>
        
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getColorForPeriodType('seeding')}`}></div>
            <span>SEMIS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getColorForPeriodType('planting')}`}></div>
            <span>PLANTATIONS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getColorForPeriodType('harvesting')}`}></div>
            <span>RÉCOLTE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantingCalendar;