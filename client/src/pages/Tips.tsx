import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Types d'articles
interface Tip {
  id: number;
  title: string;
  excerpt: string;
  content?: string; // Contenu complet de l'article
  icon: string;
  category: "beginner" | "care" | "troubleshooting" | "seasonal";
}

// Données d'exemple pour les conseils
const tips: Tip[] = [
  {
    id: 1,
    title: "Comment bien démarrer avec vos plantes d'intérieur",
    excerpt: "Guide pour les débutants: choix des plantes, équipement de base et conseils pour un bon départ.",
    icon: "school",
    category: "beginner"
  },
  {
    id: 2,
    title: "Guide d'arrosage selon le type de plante",
    excerpt: "Apprenez à adapter la fréquence et la quantité d'eau selon les besoins de chaque plante.",
    icon: "opacity",
    category: "care"
  },
  {
    id: 3,
    title: "Résoudre les problèmes courants des feuilles jaunies",
    excerpt: "Causes et solutions pour les feuilles qui jaunissent prématurément.",
    icon: "help_outline",
    category: "troubleshooting"
  },
  {
    id: 4,
    title: "Préparation de vos plantes pour l'hiver",
    excerpt: "Conseils pour aider vos plantes à traverser la saison froide en bonne santé.",
    icon: "ac_unit",
    category: "seasonal"
  },
  {
    id: 5,
    title: "Comment et quand rempoter vos plantes",
    excerpt: "Guides et astuces pour un rempotage réussi et sans stress pour vos plantes.",
    icon: "yard",
    category: "care"
  },
  {
    id: 6,
    title: "Lutter contre les parasites naturellement",
    excerpt: "Méthodes biologiques pour protéger vos plantes des nuisibles courants.",
    icon: "pest_control",
    category: "troubleshooting"
  },
];

// Couleurs pour les catégories
const getCategoryColor = (category: string) => {
  switch (category) {
    case "beginner":
      return "bg-green-100 text-green-800";
    case "care":
      return "bg-blue-100 text-blue-800";
    case "troubleshooting":
      return "bg-amber-100 text-amber-800";
    case "seasonal":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Texte pour les catégories
const getCategoryText = (category: string) => {
  switch (category) {
    case "beginner":
      return "Débutant";
    case "care":
      return "Soins";
    case "troubleshooting":
      return "Dépannage";
    case "seasonal":
      return "Saisonnier";
    default:
      return category;
  }
};

export default function Tips() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/">
          <a className="flex items-center text-primary mb-4">
            <span className="material-icons mr-1">arrow_back</span>
            Retour
          </a>
        </Link>
        <h2 className="text-xl font-raleway font-semibold">Conseils de jardinage</h2>
        <p className="text-gray-600">Découvrez nos guides pour prendre soin de vos plantes</p>
      </div>
      
      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-3 py-1 bg-primary text-white rounded-full text-sm">
          Tous
        </button>
        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-sm">
          Débutant
        </button>
        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-sm">
          Soins
        </button>
        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-sm">
          Dépannage
        </button>
        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-full text-sm">
          Saisonnier
        </button>
      </div>
      
      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tips.map((tip) => (
          <Card key={tip.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-primary-light/10 rounded-full flex items-center justify-center">
                    <span className="material-icons text-primary">{tip.icon}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(tip.category)}`}>
                    {getCategoryText(tip.category)}
                  </span>
                </div>
                <h3 className="font-medium mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tip.excerpt}
                </p>
                <button className="text-primary text-sm font-medium flex items-center">
                  Lire l'article
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Section Newsletter */}
      <Card className="bg-primary/5 border-primary/20 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0 md:mr-8">
              <h3 className="text-lg font-semibold mb-2">Abonnez-vous à notre newsletter</h3>
              <p className="text-gray-600">Recevez des conseils personnalisés pour vos plantes chaque semaine</p>
            </div>
            <div className="flex">
              <input
                type="email"
                placeholder="Votre email"
                className="bg-white border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button className="bg-primary text-white rounded-r-lg px-4 py-2 font-medium">
                S'abonner
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}