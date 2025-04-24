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
    content: `# Guide pour bien démarrer avec vos plantes d'intérieur

Pour bien débuter avec vos plantes d'intérieur, suivez ces conseils essentiels:

## 1. Choisir les bonnes plantes pour débuter

Si vous êtes débutant, commencez par des plantes robustes comme:
- Le pothos (Epipremnum aureum)
- La plante araignée (Chlorophytum comosum)
- Le sansevière ou langue de belle-mère (Sansevieria trifasciata)
- Le ZZ plant (Zamioculcas zamiifolia)

Ces plantes sont plus tolérantes aux erreurs d'arrosage et aux conditions variables.

## 2. Matériel de base nécessaire

- Pots avec trous de drainage
- Terreau adapté aux plantes d'intérieur
- Arrosoir à bec fin
- Vaporisateur pour l'humidité
- Engrais liquide pour plantes d'intérieur
- Plateaux pour récupérer l'eau

## 3. Comprendre les besoins fondamentaux

Chaque plante a des besoins spécifiques, mais voici les principes de base:
- **Lumière**: Évaluez la luminosité de votre intérieur et choisissez vos plantes en conséquence
- **Arrosage**: Préférez sous-arroser que trop arroser, la plupart des plantes meurent par excès d'eau
- **Humidité**: Certaines plantes tropicales apprécient une humidité plus élevée
- **Température**: Évitez les courants d'air et les variations brutales de température

## 4. Bonnes habitudes à prendre

- Observez régulièrement vos plantes
- Prenez des notes sur leur évolution
- Adaptez vos soins en fonction des saisons
- Inspectez sous les feuilles pour détecter d'éventuels parasites

Avec ces conseils, vous êtes prêt à débuter votre aventure verte avec succès!`,
    icon: "school",
    category: "beginner"
  },
  {
    id: 2,
    title: "Guide d'arrosage selon le type de plante",
    excerpt: "Apprenez à adapter la fréquence et la quantité d'eau selon les besoins de chaque plante.",
    content: `# Guide d'arrosage selon le type de plante

L'arrosage est l'un des aspects les plus importants et souvent mal maîtrisés de l'entretien des plantes. Voici un guide pour vous aider:

## Principes généraux

1. **Testez l'humidité du terreau**: Enfoncez votre doigt sur 2-3 cm dans le terreau. S'il est sec, arrosez. S'il est encore humide, attendez.
2. **Observez votre plante**: Feuilles qui se ramollissent ou qui tombent peuvent indiquer un manque d'eau. Feuilles jaunissantes peuvent indiquer un excès.
3. **Adaptez selon les saisons**: Réduisez l'arrosage en hiver lorsque les plantes sont en dormance.

## Par type de plante

### Plantes succulentes et cactus
- Fréquence: Très espacée (tous les 2-3 semaines en été, 1 fois par mois en hiver)
- Méthode: Arrosage abondant puis attendre que le sol sèche complètement
- Signes de manque: Feuilles qui se rident
- Signes d'excès: Pourriture à la base, tiges molles

### Plantes tropicales (monsteras, philodendrons, pothos)
- Fréquence: Modérée (1 fois par semaine en été, tous les 10-14 jours en hiver)
- Méthode: Arroser lorsque les premiers centimètres du sol sont secs
- Signes de manque: Feuilles qui tombent, bords bruns
- Signes d'excès: Jaunissement des feuilles, moisissure en surface

### Fougères et plantes d'ombre
- Fréquence: Régulière (tous les 3-5 jours selon l'humidité ambiante)
- Méthode: Maintenir le sol légèrement humide, jamais détrempé
- Signes de manque: Feuilles crispées, brunissement
- Signes d'excès: Jaunissement généralisé, pourriture

### Plantes à fleurs (orchidées, violettes africaines)
- Fréquence: Variable selon l'espèce
- Méthode: Pour les orchidées, trempage du pot pendant 15-20 minutes puis drainage complet
- Signes de manque: Fleurs fanées prématurément, bourgeons qui avortent
- Signes d'excès: Pourriture des racines

## Astuces pour un bon arrosage

- Utilisez de l'eau à température ambiante
- Arrosez le matin de préférence
- Évitez de mouiller le feuillage des plantes sensibles aux maladies fongiques
- Utilisez un arrosoir à bec fin pour un meilleur contrôle

En suivant ces conseils, vous éviterez les erreurs d'arrosage les plus courantes.`,
    icon: "opacity",
    category: "care"
  },
  {
    id: 3,
    title: "Résoudre les problèmes courants des feuilles jaunies",
    excerpt: "Causes et solutions pour les feuilles qui jaunissent prématurément.",
    content: `# Résoudre les problèmes de feuilles jaunies

Les feuilles jaunissantes sont un signal d'alerte courant chez les plantes d'intérieur. Voici comment identifier et résoudre ces problèmes:

## Causes principales et solutions

### 1. Arrosage excessif
**Symptômes**: Jaunissement généralisé, sol constamment humide, feuilles molles
**Solutions**:
- Réduisez immédiatement la fréquence d'arrosage
- Vérifiez le drainage du pot (présence de trous)
- Si la pourriture est avancée, rempotez dans un terreau frais et bien drainant
- Assurez-vous que l'eau ne stagne pas dans la soucoupe

### 2. Manque d'eau
**Symptômes**: Jaunissement commençant par les feuilles basses, feuilles crispées, sol très sec
**Solutions**:
- Établissez un calendrier d'arrosage plus régulier
- Plongez le pot dans l'eau pendant 10-15 minutes pour réhydrater complètement
- Pour les plantes très déshydratées, arrosez progressivement pour éviter le choc

### 3. Carence en nutriments
**Symptômes**: Jaunissement entre les nervures, croissance ralentie
**Solutions**:
- Appliquez un engrais équilibré pour plantes d'intérieur en suivant les doses recommandées
- Rempotez dans un terreau frais si la plante est dans le même pot depuis plus d'un an
- Vérifiez le pH du sol qui peut bloquer l'absorption des nutriments

### 4. Problèmes de lumière
**Symptômes**: Jaunissement sur un côté, étiolement, feuilles pâles
**Solutions**:
- Ajustez l'exposition: éloignez des fenêtres exposées au sud si brûlure, rapprochez d'une source de lumière si manque
- Tournez régulièrement la plante pour une exposition homogène
- Utilisez un voilage pour filtrer la lumière directe trop intense

### 5. Parasites
**Symptômes**: Taches jaunes, déformations, présence visible d'insectes sous les feuilles
**Solutions**:
- Inspectez minutieusement sous les feuilles (cochenilles, araignées rouges, pucerons)
- Nettoyez les feuilles à l'eau savonneuse ou avec un produit adapté
- Isolez la plante infectée des autres
- Traitez avec des remèdes naturels ou des produits spécifiques

## Prévention

- Observez régulièrement vos plantes
- Adaptez l'arrosage à chaque espèce
- Maintenez un niveau d'humidité approprié
- Fertilisez modérément pendant la période de croissance
- Nettoyez régulièrement les feuilles pour éviter l'accumulation de poussière

En identifiant correctement la cause du jaunissement, vous pourrez agir rapidement et sauver votre plante.`,
    icon: "help_outline",
    category: "troubleshooting"
  },
  {
    id: 4,
    title: "Préparation de vos plantes pour l'hiver",
    excerpt: "Conseils pour aider vos plantes à traverser la saison froide en bonne santé.",
    content: `# Préparation de vos plantes pour l'hiver

L'hiver présente des défis particuliers pour les plantes d'intérieur. Voici comment les préparer pour la saison froide:

## Ajuster les soins saisonniers

### 1. Réduire l'arrosage
- Diminuez la fréquence d'arrosage d'environ 30-50%
- Laissez le sol sécher davantage entre les arrosages
- Utilisez de l'eau à température ambiante pour éviter le choc thermique
- Arrosez le matin pour permettre à l'excès d'humidité de s'évaporer

### 2. Adapter l'exposition lumineuse
- Déplacez les plantes vers les fenêtres les plus lumineuses (sud ou ouest idéalement)
- Nettoyez les vitres pour maximiser la lumière entrante
- Tournez régulièrement les plantes pour une exposition uniforme
- Envisagez un éclairage artificiel supplémentaire pour les journées courtes (lampes horticoles)

### 3. Gérer la température et l'humidité
- Éloignez les plantes des sources de chaleur directe (radiateurs, cheminées)
- Protégez-les des courants d'air froid et des fenêtres mal isolées
- Maintenez une température entre 16-21°C pour la plupart des plantes d'intérieur
- Augmentez l'humidité ambiante (brumisateur, humidificateur, plateaux de graviers humides)

## Actions préventives

### 1. Arrêter la fertilisation
- Cessez complètement les apports d'engrais de novembre à février
- Reprenez progressivement au début du printemps

### 2. Éviter les rempotages
- Reportez tout rempotage au printemps
- Attendez la reprise de croissance active

### 3. Traiter préventivement contre les parasites
- Inspectez minutieusement les plantes avant l'hiver
- Traitez au besoin contre les cochenilles, araignées rouges et autres parasites
- Le chauffage intérieur favorise leur prolifération

### 4. Nettoyer et entretenir
- Éliminez les feuilles mortes ou jaunissantes
- Dépoussiérez régulièrement le feuillage pour maximiser la photosynthèse
- Taillez légèrement si nécessaire pour maintenir une forme compacte

## Cas particuliers

### Plantes tropicales
- Augmentez l'humidité (brumisations régulières)
- Groupez les plantes pour créer un microclimat

### Cactus et succulentes
- Réduisez drastiquement l'arrosage (une fois par mois ou moins)
- Placez-les dans l'endroit le plus ensoleillé et frais

### Plantes à bulbes
- Laissez-les entrer en dormance dans un endroit frais et sec
- Réduisez l'arrosage jusqu'à l'apparition de nouvelles pousses

En suivant ces conseils, vos plantes traverseront l'hiver en bonne santé et seront prêtes à redémarrer vigoureusement au printemps.`,
    icon: "ac_unit",
    category: "seasonal"
  },
  {
    id: 5,
    title: "Comment et quand rempoter vos plantes",
    excerpt: "Guides et astuces pour un rempotage réussi et sans stress pour vos plantes.",
    content: `# Guide complet pour rempoter correctement vos plantes

Le rempotage est une étape essentielle dans l'entretien de vos plantes. Voici comment procéder pour assurer leur santé et stimuler leur croissance.

## Quand rempoter ?

### Signes qu'un rempotage est nécessaire
- Racines sortant par les trous de drainage ou formant une spirale visible
- Croissance ralentie malgré des soins appropriés
- Eau s'écoulant trop rapidement lors de l'arrosage
- Sol se compactant et se rétractant des bords du pot
- Plante devenant instable dans son pot
- Généralement tous les 1 à 2 ans pour les plantes à croissance moyenne

### Meilleure période
- Idéalement au début du printemps (mars-avril)
- Évitez pendant la floraison et en plein hiver
- Pour les plantes tropicales, la période chaude et humide est favorable

## Préparation et matériel

### Ce dont vous aurez besoin
- Nouveau pot (1-2 cm plus large que l'ancien pour les petites plantes, 3-5 cm pour les grandes)
- Terreau adapté à votre type de plante
- Couche drainante (billes d'argile, graviers, morceaux de pots cassés)
- Gants de jardinage
- Arrosoir
- Spatule ou petit outil pour détacher la motte
- Sécateur propre si taille des racines nécessaire
- Toile ou journaux pour protéger votre espace

## Étapes du rempotage

### 1. Préparation
- Arrosez légèrement la plante 24h avant pour faciliter l'extraction
- Préparez le nouveau pot avec une couche drainante couvrant les trous
- Ajoutez une première couche de terreau frais

### 2. Extraction de la plante
- Renversez délicatement le pot en soutenant la base de la plante entre vos doigts
- Tapotez le fond et les côtés du pot pour décoller la motte
- Si nécessaire, passez la spatule le long des parois
- Évitez de tirer sur la tige

### 3. Inspection et préparation des racines
- Examinez l'état du système racinaire
- Secouez doucement pour éliminer l'ancien terreau (1/3 environ)
- Démêlez délicatement les racines si elles forment une masse compacte
- Coupez proprement les racines abîmées, mortes ou trop longues

### 4. Installation dans le nouveau pot
- Placez la plante au centre du nouveau pot
- Vérifiez que le collet (jonction tige/racines) est au bon niveau
- Remplissez progressivement de terreau en tassant légèrement
- Laissez 1-2 cm de marge en haut du pot pour l'arrosage

### 5. Soins post-rempotage
- Arrosez modérément pour tasser le terreau et hydrater les racines
- Placez la plante à l'ombre quelques jours pour l'acclimater
- Évitez la fertilisation pendant 3-4 semaines
- Surveillez attentivement les signes de stress durant les premières semaines

## Cas particuliers

### Plantes sensibles
- Orchidées: utilisez un substrat spécifique et des pots transparents
- Cactus et succulentes: manipulez avec des gants épais ou du papier journal
- Fougères: manipulez délicatement pour ne pas briser les frondes

### Divisions
- Profitez du rempotage pour diviser les plantes formant des touffes
- Séparez délicatement en veillant à ce que chaque division ait suffisamment de racines

En suivant ces étapes, le rempotage deviendra une opération simple qui favorisera la santé et la beauté de vos plantes d'intérieur.`,
    icon: "yard",
    category: "care"
  },
  {
    id: 6,
    title: "Lutter contre les parasites naturellement",
    excerpt: "Méthodes biologiques pour protéger vos plantes des nuisibles courants.",
    content: `# Lutter naturellement contre les parasites de plantes d'intérieur

Les parasites sont malheureusement fréquents sur les plantes d'intérieur. Voici comment les combattre efficacement avec des méthodes naturelles et respectueuses de l'environnement.

## Identification des parasites courants

### Pucerons
**Apparence**: Petits insectes verts, noirs, jaunes ou rouges groupés sur les jeunes pousses
**Dégâts**: Feuilles déformées, miellat collant, transmission de maladies

### Cochenilles
**Apparence**: Petites masses blanches cotonneuses ou insectes à carapace brune
**Dégâts**: Affaiblissement, jaunissement, chute des feuilles

### Araignées rouges
**Apparence**: Minuscules acariens rougeâtres ou orangés, toiles fines
**Dégâts**: Marbrures jaunes ou bronzées sur les feuilles

### Aleurodes (mouches blanches)
**Apparence**: Minuscules insectes blancs volant lorsqu'on touche la plante
**Dégâts**: Jaunissement, croissance ralentie, miellat

### Thrips
**Apparence**: Minuscules insectes allongés, jaunes à bruns
**Dégâts**: Taches argentées, déformations des feuilles et fleurs

## Solutions naturelles

### 1. Mesures préventives
- Examinez régulièrement vos plantes (surtout sous les feuilles)
- Isolez les nouvelles acquisitions pendant 2 semaines
- Maintenez un bon niveau d'humidité (la plupart des ravageurs préfèrent l'air sec)
- Gardez vos plantes en bonne santé (plantes stressées plus vulnérables)
- Nettoyez régulièrement les feuilles à l'eau claire

### 2. Méthodes physiques
- **Douche d'eau**: Passez les plantes infestées sous une douche tiède
- **Nettoyage manuel**: Retirez les parasites visibles avec un coton-tige imbibé d'alcool
- **Pièges collants jaunes**: Efficaces contre les mouches blanches et thrips volants
- **Taille sélective**: Éliminez les parties très infestées

### 3. Remèdes maison efficaces

#### Savon noir liquide
**Recette**: 1 cuillère à soupe de savon noir dans 1 litre d'eau tiède
**Application**: Vaporisez sur toute la plante, insistez sous les feuilles
**Efficacité**: Contre pucerons, cochenilles, acariens

#### Infusion d'ail
**Recette**: 5 gousses d'ail écrasées macérées 24h dans 1 litre d'eau
**Application**: Filtrez et vaporisez sur les plantes
**Efficacité**: Répulsif général, efficace contre pucerons et acariens

#### Huile de neem
**Recette**: 5ml d'huile de neem + 1ml de savon liquide neutre dans 1 litre d'eau
**Application**: Vaporisez toutes les parties de la plante
**Efficacité**: Large spectre, affecte la reproduction des insectes

#### Décoction de prêle
**Recette**: 100g de prêle séchée dans 1L d'eau, bouillir 30min, filtrer et diluer 1:5
**Application**: Vaporiser une fois par semaine en préventif
**Efficacité**: Renforce les plantes, repousse divers parasites

### 4. Auxiliaires naturels

- **Chrysopes**: Larves dévorant pucerons et autres petits insectes
- **Coccinelles**: Efficaces contre pucerons (pour grandes collections ou vérandas)
- **Acariens prédateurs**: Contre araignées rouges et thrips

## Application et fréquence

- Testez d'abord vos solutions sur une petite partie de la plante
- Appliquez tôt le matin ou en soirée (jamais en plein soleil)
- Répétez le traitement tous les 5-7 jours pendant 3 semaines minimum
- Traitez toutes les plantes proches même si elles semblent saines
- Alternez les remèdes pour éviter les résistances

En privilégiant ces méthodes naturelles, vous protégerez efficacement vos plantes tout en préservant votre environnement intérieur de produits chimiques nocifs.`,
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
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  
  const openTipDialog = (tip: Tip) => {
    setSelectedTip(tip);
    setTipDialogOpen(true);
  };
  
  // Fonction pour convertir le format Markdown en HTML simple
  const renderMarkdown = (markdown: string) => {
    // Conversion basique des titres, listes et formatage
    const html = markdown
      // Titres
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium my-2">$1</h3>')
      // Listes
      .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
      // Paragraphes
      .split('\n\n').join('</p><p class="my-2">')
      // Formatage gras
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
    return `<p class="my-2">${html}</p>`;
  };
  
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
                <button 
                  onClick={() => openTipDialog(tip)}
                  className="text-primary text-sm font-medium flex items-center"
                >
                  Lire l'article
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Modal pour afficher le contenu complet de l'article */}
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              {selectedTip && (
                <>
                  <span className="material-icons text-primary mr-2">{selectedTip.icon}</span>
                  {selectedTip.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTip?.excerpt}
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4">
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          {selectedTip?.content && (
            <div className="mt-4 article-content prose prose-sm lg:prose-base" 
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedTip.content) }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
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