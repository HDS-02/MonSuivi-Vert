import React, { useState } from 'react';
import { PlantEntry } from '@shared/schema';

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
  plant: PlantEntry;
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
  "Pomme de terre": {
    seeding: null,
    planting: { start: 3, end: 5 },
    harvesting: { start: 6, end: 9 }
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
const getPlantData = (plant: PlantEntry): PlantingCalendarData => {
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