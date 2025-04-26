/**
 * Base de données de plantes disponibles pour l'ajout manuel
 */

import { fruitTrees } from './fruitTreeDatabase';
import { flowers } from './flowerDatabase';

export type PlantCategory = 'interieur' | 'exterieur' | 'fruitier' | 'fleurs' | 'legumes';

export interface PlantEntry {
  name: string;
  species: string;
  category: PlantCategory;
  wateringFrequency: number;
  light: string;
  temperature: string;
  careNotes: string;
  potSize?: string;
  commonDiseases?: Array<{name: string, description: string, treatment: string}>;
}

export interface PlantCategoryInfo {
  id: PlantCategory;
  name: string;
  description: string;
  icon: string;
}

export const plantCategories: PlantCategoryInfo[] = [
  {
    id: "interieur",
    name: "Plantes d'intérieur",
    description: "Plantes cultivées en pot à l'intérieur des habitations",
    icon: "home"
  },
  {
    id: "exterieur",
    name: "Plantes d'extérieur",
    description: "Plantes cultivées dans le jardin ou sur la terrasse",
    icon: "grass"
  },
  {
    id: "fruitier",
    name: "Arbres fruitiers",
    description: "Arbres et arbustes produisant des fruits comestibles",
    icon: "agriculture"
  },
  {
    id: "fleurs",
    name: "Fleurs",
    description: "Plantes ornementales à fleurs",
    icon: "local_florist"
  },
  {
    id: "legumes",
    name: "Légumes",
    description: "Plantes potagères comestibles",
    icon: "eco"
  }
];

// Fonction pour assigner automatiquement des catégories
function assignCategories(plants: Omit<PlantEntry, 'category'>[]): PlantEntry[] {
  // Liste des légumes courants
  const legumesNames = [
    'ail', 'artichaut', 'asperge', 'aubergine', 'betterave', 'brocoli', 'carotte', 
    'chou', 'concombre', 'courgette', 'épinard', 'haricot', 'laitue', 'oignon', 
    'petits pois', 'poireau', 'poivron', 'pomme de terre', 'radis', 'salade', 
    'ciboulette', 'courge', 'échalote', 'endive', 'fenouil', 'fève', 'navet', 
    'persil', 'potiron', 'rhubarbe', 'amarante', 'arachide', 'basilic', 'bette', 
    'châtaigne', 'chou-rave', 'coriandre', 'cornichon', 'cresson', 'estragon', 
    'gingembre', 'manioc', 'menthe', 'okra', 'origan', 'oseille', 'patate', 
    'pissenlit', 'romarin', 'roquette', 'rutabaga', 'thym', 'tomate'
  ];
  
  // Liste des arbres fruitiers courants
  const fruitierNames = [
    'avocatier', 'abricotier', 'amandier', 'asiminier', 'bananier', 'brugnonier',
    'cedratier', 'cerisier', 'châtaignier', 'citronnier', 'citrus', 'clémentinier', 'cognassier',
    'figuier', 'goyavier', 'grenadier', 'kumquat', 'mirabellier', 'mûrier',
    'nashi', 'nectarinier', 'néflier', 'noisetier', 'noyer', 'olivier',
    'oranger', 'pacanier', 'pamplemoussier', 'pêcher', 'plaqueminier', 'poirier',
    'pommier', 'prunier', 'pawpaw', 'kaki', 'mandarinier', 'lime', 'satsuma'
  ];
  
  // Liste des fleurs courantes
  const fleurNames = [
    'absinthe', 'abutilon', 'achillée', 'adonis', 'agapanthe', 'alysson', 'amaryllis', 'ancolie', 'anémone',
    'aster', 'azalée', 'bégonia', 'bleuet', 'camélia', 'capucine', 'chrysanthème', 'clématite', 'cyclamen',
    'dahlia', 'digitale', 'edelweiss', 'freesia', 'fuchsia', 'giroflée', 'glaïeul', 'glycine', 'hortensia',
    'iris', 'jacinthe', 'jonquille', 'lilas', 'lys', 'marguerite', 'mimosa', 'myosotis', 'narcisse',
    'nénuphar', 'œillet', 'orchidée', 'pâquerette', 'pavot', 'pensée', 'perce-neige', 'pervenche',
    'pétunia', 'phlox', 'pivoine', 'pourpier', 'renoncule', 'rhododendron', 'rose', 'souci',
    'tournesol', 'tulipe', 'violette', 'zinnia'
  ];
  
  return plants.map(plant => {
    let category: PlantCategory = 'interieur';
    
    // Vérifier si le nom de la plante contient un des légumes connus
    const isLegume = legumesNames.some(legume => 
      plant.name.toLowerCase().includes(legume.toLowerCase())
    );
    
    // Vérifier si le nom de la plante contient un des arbres fruitiers connus
    const isFruitier = fruitierNames.some(fruit => 
      plant.name.toLowerCase().includes(fruit.toLowerCase())
    );
    
    // Vérifier si le nom de la plante contient une des fleurs connues
    const isFleur = fleurNames.some(fleur => 
      plant.name.toLowerCase().includes(fleur.toLowerCase())
    );
    
    if (isLegume) {
      category = 'legumes';
    }
    else if (isFruitier) {
      category = 'fruitier';
    }
    else if (isFleur || 
            plant.name.toLowerCase().includes('fleur') || 
            plant.name.toLowerCase().includes('orchid') || 
            plant.name.toLowerCase().includes('rose') || 
            plant.name.toLowerCase().includes('bégonia')) {
      category = 'fleurs';
    }
    // Les plantes qui préfèrent la lumière directe sont souvent d'extérieur
    else if (plant.light.toLowerCase().includes('directe') && 
            !plant.name.toLowerCase().includes('éléphant') && 
            !plant.name.toLowerCase().includes('jade')) {
      category = 'exterieur';
    }
    
    return {
      ...plant,
      category
    };
  });
}

// Base de données originale (sans catégories)
const plantsWithoutCategories = [
  // Légumes variés
  {
    name: "Ail",
    species: "Allium sativum",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Plantez les gousses d'ail à l'automne pour une récolte l'été suivant. Préfère un sol bien drainé et une exposition ensoleillée.",
  },
  {
    name: "Artichaut",
    species: "Cynara scolymus",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement, surtout en période de formation des capitules. Plante vivace qui peut produire pendant plusieurs années.",
  },
  {
    name: "Asperge",
    species: "Asparagus officinalis",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Culture de longue durée, les premières récoltes se font 3 ans après la plantation. Besoin de beaucoup d'espace et d'un sol riche.",
  },
  {
    name: "Aubergine",
    species: "Solanum melongena",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Besoin de chaleur et d'un arrosage régulier. Tuteurez les plants qui peuvent devenir lourds avec les fruits.",
  },
  {
    name: "Betterave",
    species: "Beta vulgaris",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement pour favoriser le développement de la racine. Préfère les sols légers et bien drainés.",
  },
  {
    name: "Brocoli",
    species: "Brassica oleracea var. italica",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement sans mouiller les têtes. Récoltez avant que les fleurs ne s'ouvrent pour une meilleure saveur.",
  },
  {
    name: "Carotte",
    species: "Daucus carota",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Préfère les sols légers, profonds et sans cailloux pour un bon développement des racines. Arrosage régulier mais modéré.",
  },
  {
    name: "Chou-fleur",
    species: "Brassica oleracea var. botrytis",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-22°C",
    careNotes: "Arrosez régulièrement et généreusement. Protégez les têtes du soleil en repliant les feuilles par-dessus.",
  },
  {
    name: "Concombre",
    species: "Cucumis sativus",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Besoin d'arrosages fréquents et d'un sol riche. Plant grimpant qui nécessite un support. Récolte régulière pour stimuler la production.",
  },
  {
    name: "Courgette",
    species: "Cucurbita pepo",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez abondamment à la base. Plante gourmande en eau et en nutriments. Récoltez jeunes pour une meilleure saveur.",
  },
  {
    name: "Épinard",
    species: "Spinacia oleracea",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Préfère les températures fraîches et un sol riche. Arrosez régulièrement pour éviter la montée en graines prématurée.",
  },
  {
    name: "Haricot vert",
    species: "Phaseolus vulgaris",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-28°C",
    careNotes: "Arrosez régulièrement, surtout pendant la floraison et la formation des gousses. Récoltez fréquemment pour stimuler la production.",
  },
  {
    name: "Laitue",
    species: "Lactuca sativa",
    wateringFrequency: 2,
    light: "Semi-directe",
    temperature: "15-22°C",
    careNotes: "Arrosez fréquemment mais légèrement pour maintenir le sol frais. Préfère un emplacement semi-ombragé en été.",
  },
  {
    name: "Oignon",
    species: "Allium cepa",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément et arrêtez l'arrosage quand les feuilles commencent à jaunir. Préfère un sol bien drainé.",
  },
  {
    name: "Petits pois",
    species: "Pisum sativum",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-20°C",
    careNotes: "Préfère les climats frais. Installez un support pour les variétés grimpantes. Arrosez régulièrement pendant la floraison et la formation des gousses.",
  },
  {
    name: "Poireau",
    species: "Allium porrum",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement, surtout en été. Buttez progressivement pour obtenir un fût blanc plus long.",
  },
  {
    name: "Poivron",
    species: "Capsicum annuum",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Besoin de chaleur et d'un arrosage régulier. Peut nécessiter un tuteurage quand les fruits se développent.",
  },
  {
    name: "Pomme de terre",
    species: "Solanum tuberosum",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Buttez régulièrement les plants pour favoriser la formation des tubercules. Arrosez modérément, surtout pendant la floraison.",
  },
  {
    name: "Radis",
    species: "Raphanus sativus",
    wateringFrequency: 2,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Croissance rapide, récoltez jeune pour éviter qu'ils ne deviennent creux et piquants. Arrosage régulier important.",
  },
  {
    name: "Salade",
    species: "Lactuca sativa",
    wateringFrequency: 2,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Besoin d'une humidité constante mais sans excès. Préfère un emplacement semi-ombragé en plein été.",
  },
  {
    name: "Chou",
    species: "Brassica oleracea",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-20°C",
    careNotes: "Arrosez régulièrement. Plante gourmande en nutriments qui nécessite un sol riche. Protégez contre les ravageurs comme la piéride du chou.",
  },
  {
    name: "Ciboulette",
    species: "Allium schoenoprasum",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément. Préfère un sol bien drainé. Récoltez régulièrement pour encourager de nouvelles pousses.",
  },
  {
    name: "Courge Butternut",
    species: "Cucurbita moschata",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez généreusement à la base. Nécessite beaucoup d'espace pour se développer. Récoltez quand la peau devient dure et la couleur uniforme.",
  },
  {
    name: "Échalote",
    species: "Allium cepa var. aggregatum",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément et arrêtez l'arrosage quand les feuilles commencent à jaunir. Préfère un sol bien drainé.",
  },
  {
    name: "Endive",
    species: "Cichorium intybus var. foliosum",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Arrosez régulièrement pour un développement uniforme. Étiolez les plants en les couvrant pour obtenir des chicons blancs et tendres.",
  },
  {
    name: "Fenouil",
    species: "Foeniculum vulgare",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement pour favoriser le développement du bulbe. Évitez la plantation près des tomates ou haricots.",
  },
  {
    name: "Fève",
    species: "Vicia faba",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "12-20°C",
    careNotes: "Arrosez modérément. Préfère les températures fraîches et peut être semée à l'automne ou en début d'hiver dans les régions douces.",
  },
  {
    name: "Navet",
    species: "Brassica rapa",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-20°C",
    careNotes: "Arrosez régulièrement pour éviter que les racines ne deviennent ligneuses. Récoltez jeune pour une meilleure saveur.",
  },
  {
    name: "Persil",
    species: "Petroselinum crispum",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement pour maintenir le sol humide. Plante bisannuelle qui peut être récoltée continuellement.",
  },
  {
    name: "Potiron",
    species: "Cucurbita maxima",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez généreusement. Plant volumineux qui nécessite beaucoup d'espace. Récoltez quand les fruits sont bien colorés et que la tige commence à se dessécher.",
  },
  {
    name: "Rhubarbe",
    species: "Rheum rhabarbarum",
    wateringFrequency: 5,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Arrosez généreusement en période de croissance. Plante vivace dont seuls les pétioles sont comestibles. Attention, les feuilles sont toxiques.",
  },
  {
    name: "Ail d'orient",
    species: "Allium tuberosum",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Aussi appelé ciboulette chinoise. Arrosez modérément et récoltez les feuilles régulièrement. Produit de jolies fleurs blanches en été.",
  },
  {
    name: "Amarante",
    species: "Amaranthus spp.",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Plante comestible aux feuilles colorées. Arrosez régulièrement mais pas en excès. Les jeunes feuilles peuvent être consommées comme des épinards.",
  },
  {
    name: "Arachide",
    species: "Arachis hypogaea",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Besoin de chaleur et d'un sol léger. Les fruits se développent dans le sol après la floraison. Récoltez quand les feuilles jaunissent.",
  },
  {
    name: "Basilic",
    species: "Ocimum basilicum",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement sans mouiller le feuillage. Pincez les sommités pour favoriser la ramification et éviter la floraison précoce.",
  },
  {
    name: "Bette à carde",
    species: "Beta vulgaris var. cicla",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement, surtout en période chaude. Récoltez les grandes feuilles extérieures en laissant le cœur pour une production continue.",
  },
  {
    name: "Châtaigne d'eau",
    species: "Eleocharis dulcis",
    wateringFrequency: 1,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Maintenir le sol constamment humide ou même inondé. Plante semi-aquatique dont on consomme les tubercules croquants.",
  },
  {
    name: "Chou-rave",
    species: "Brassica oleracea var. gongylodes",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement. Récoltez quand le renflement de la tige atteint 5-8 cm de diamètre pour une meilleure tendreté.",
  },
  {
    name: "Coriandre",
    species: "Coriandrum sativum",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement sans excès. Plante annuelle qui monte rapidement en graines par temps chaud. Semis échelonnés recommandés.",
  },
  {
    name: "Cornichon",
    species: "Cucumis sativus",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Variété de concombre récoltée jeune. Arrosez régulièrement et abondamment. Récoltez fréquemment pour stimuler la production.",
  },
  {
    name: "Cresson",
    species: "Lepidium sativum",
    wateringFrequency: 1,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Maintenir le sol constamment humide. Croissance rapide, peut être récolté 2-3 semaines après le semis. Riche en vitamines.",
  },
  {
    name: "Estragon",
    species: "Artemisia dracunculus",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément, laissez sécher entre les arrosages. Préfère un sol bien drainé. Plante vivace au goût anisé.",
  },
  {
    name: "Gingembre",
    species: "Zingiber officinale",
    wateringFrequency: 3,
    light: "Indirecte brillante",
    temperature: "20-30°C",
    careNotes: "Besoin de chaleur et d'humidité. Plantez les rhizomes au printemps dans un sol riche et léger. Récoltez en automne-hiver.",
  },
  {
    name: "Manioc",
    species: "Manihot esculenta",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "25-35°C",
    careNotes: "Besoin de chaleur. Arrosez modérément. Cultivé pour ses tubercules riches en amidon. Culture pluriannuelle en climat tropical.",
  },
  {
    name: "Menthe",
    species: "Mentha spp.",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-25°C",
    careNotes: "Arrosez régulièrement, apprécie l'humidité. Plante envahissante, préférez la culture en pot. Nombreuses variétés aux arômes différents.",
  },
  {
    name: "Okra",
    species: "Abelmoschus esculentus",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "22-35°C",
    careNotes: "Aussi appelé gombo. Besoin de chaleur et d'un arrosage régulier. Récoltez les fruits jeunes quand ils font 5-10 cm.",
  },
  {
    name: "Origan",
    species: "Origanum vulgare",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément, tolère la sécheresse une fois établi. Plante aromatique méditerranéenne. Récoltez avant la floraison pour l'arôme.",
  },
  {
    name: "Oseille",
    species: "Rumex acetosa",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Arrosez régulièrement en été. Plante vivace dont on récolte les feuilles acidulées. Retirez les tiges florales pour prolonger la récolte.",
  },
  {
    name: "Patate douce",
    species: "Ipomoea batatas",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "20-30°C",
    careNotes: "Besoin de chaleur. Arrosez modérément mais régulièrement. Plantez les tubercules ou les boutures au printemps dans un sol léger.",
  },
  {
    name: "Pissenlit",
    species: "Taraxacum officinale",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "10-25°C",
    careNotes: "Plante rustique aux multiples usages culinaires. Les jeunes feuilles sont moins amères. Peut être blanchi pour réduire l'amertume.",
  },
  {
    name: "Romarin",
    species: "Rosmarinus officinalis",
    wateringFrequency: 6,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément, tolère bien la sécheresse. Plante aromatique méditerranéenne persistante. Taille régulière recommandée.",
  },
  {
    name: "Roquette",
    species: "Eruca sativa",
    wateringFrequency: 3,
    light: "Semi-directe",
    temperature: "15-20°C",
    careNotes: "Arrosez régulièrement pour éviter la montée en graines. Préfère la fraîcheur, peut être cultivée toute l'année. Goût piquant et aromatique.",
  },
  {
    name: "Rutabaga",
    species: "Brassica napus",
    wateringFrequency: 4,
    light: "Directe",
    temperature: "10-20°C",
    careNotes: "Arrosez régulièrement mais sans excès. Préfère les climats frais. Résistant au gel, idéal pour les cultures d'automne-hiver.",
  },
  {
    name: "Thym",
    species: "Thymus vulgaris",
    wateringFrequency: 6,
    light: "Directe",
    temperature: "15-25°C",
    careNotes: "Arrosez modérément, tolère bien la sécheresse. Préfère les sols pauvres et bien drainés. Plante vivace aromatique très rustique.",
  },
  
  // Variétés de tomates
  {
    name: "Tomate Coeur de Boeuf",
    species: "Solanum lycopersicum 'Cuore di Bue'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement sans mouiller le feuillage. Installez des tuteurs pour supporter le poids des fruits. Besoin de beaucoup de soleil pour des fruits savoureux.",
  },
  {
    name: "Tomate Cerise",
    species: "Solanum lycopersicum var. cerasiforme",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement mais sans excès. Très productive et facile à cultiver. Idéale pour les balcons et petits espaces.",
  },
  {
    name: "Tomate Noire de Crimée",
    species: "Solanum lycopersicum 'Black Krim'",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement et généreusement. Variété ancienne à la saveur incomparable. Supporte bien la chaleur.",
  },
  {
    name: "Tomate Green Zebra",
    species: "Solanum lycopersicum 'Green Zebra'",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement et de manière constante. Supporte bien les conditions chaudes. Fruits verts striés, saveur légèrement acidulée.",
  },
  {
    name: "Tomate San Marzano",
    species: "Solanum lycopersicum 'San Marzano'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-32°C",
    careNotes: "Arrosez régulièrement mais sans excès. Idéale pour les sauces et conserves. Nécessite un tuteurage solide.",
  },
  {
    name: "Tomate Ananas",
    species: "Solanum lycopersicum 'Pineapple'",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement et généreusement. Gros fruits bicolores jaune-orangé marbrés de rouge. Saveur douce et fruitée.",
  },
  {
    name: "Tomate Roma",
    species: "Solanum lycopersicum 'Roma VF'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez sans mouiller le feuillage. Variété déterminée compacte. Idéale pour les sauces et la mise en conserve.",
  },
  {
    name: "Tomate Marmande",
    species: "Solanum lycopersicum 'Marmande'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "16-30°C",
    careNotes: "Arrosez régulièrement. Variété française précoce et productive. Fruits côtelés à la saveur équilibrée.",
  },
  {
    name: "Tomate Brandywine",
    species: "Solanum lycopersicum 'Brandywine'",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez généreusement. Variété ancienne à gros fruits. Feuillage de type pomme de terre, saveur exceptionnelle.",
  },
  {
    name: "Tomate Beefsteak",
    species: "Solanum lycopersicum 'Beefsteak'",
    wateringFrequency: 2,
    light: "Directe",
    temperature: "18-32°C",
    careNotes: "Arrosez régulièrement et abondamment. Très gros fruits charnues. Idéale pour les sandwichs et hamburgers.",
  },
  {
    name: "Tomate Cornue des Andes",
    species: "Solanum lycopersicum 'Cornue des Andes'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Fruits allongés en forme de corne. Peu de graines, chair ferme et saveur douce.",
  },
  {
    name: "Tomate Raisin Vert",
    species: "Solanum lycopersicum 'Green Grape'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez sans excès. Petits fruits verts de la taille d'un raisin. Saveur délicieuse et sucrée.",
  },
  {
    name: "Tomate Petit Moineau",
    species: "Solanum lycopersicum 'Petit Moineau'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Très petites tomates cerises rouges. Extrêmement productive et résistante.",
  },
  {
    name: "Tomate Yellow Pear",
    species: "Solanum lycopersicum 'Yellow Pear'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Petits fruits jaunes en forme de poire. Idéale pour les salades et la décoration.",
  },
  {
    name: "Tomate Gardener's Delight",
    species: "Solanum lycopersicum 'Gardener's Delight'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "16-30°C",
    careNotes: "Arrosez régulièrement. Tomate cerise très appréciée des jardiniers. Saveur sucrée et production abondante.",
  },
  {
    name: "Tomate Tigerella",
    species: "Solanum lycopersicum 'Tigerella'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Fruits rouges avec rayures jaunes-orangées. Goût acidulé et rafraichissant.",
  },
  {
    name: "Tomate Rose de Berne",
    species: "Solanum lycopersicum 'Rose de Berne'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez sans excès. Variété ancienne suisse à fruits roses. Chair juteuse et peau fine, saveur douce et fruitée.",
  },
  {
    name: "Tomate Indigo Rose",
    species: "Solanum lycopersicum 'Indigo Rose'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Fruits pourpres-noirs riches en anthocyanes. Saveur équilibrée et riche en antioxydants.",
  },
  {
    name: "Tomate Moneymaker",
    species: "Solanum lycopersicum 'Moneymaker'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez modérément. Variété anglaise fiable et productive. Fruits ronds de taille moyenne, croissance vigoureuse.",
  },
  {
    name: "Tomate Stupice",
    species: "Solanum lycopersicum 'Stupice'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "16-28°C",
    careNotes: "Arrosez régulièrement. Variété très précoce originaire de Tchéquie. Idéale pour les climats frais et les saisons courtes.",
  },
  {
    name: "Tomate Principe Borghese",
    species: "Solanum lycopersicum 'Principe Borghese'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-32°C",
    careNotes: "Arrosez sans excès. Variété italienne traditionnelle pour séchage. Petits fruits charnus avec peu de graines.",
  },
  {
    name: "Tomate Black Cherry",
    species: "Solanum lycopersicum 'Black Cherry'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez modérément. Tomate cerise de couleur pourpre-noir. Saveur complexe et riche, production abondante.",
  },
  {
    name: "Tomate Alicante",
    species: "Solanum lycopersicum 'Alicante'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Variété britannique classique. Fruits ronds rouges de bonne conservation, saveur équilibrée.",
  },
  {
    name: "Tomate Saint Pierre",
    species: "Solanum lycopersicum 'Saint Pierre'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez régulièrement. Variété française traditionnelle. Fruits ronds, rouges et fermes, idéaux pour les conserves.",
  },
  {
    name: "Tomate Sungold",
    species: "Solanum lycopersicum 'Sungold'",
    wateringFrequency: 3,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez modérément. Tomate cerise orange très sucrée. Incroyable saveur fruitée, souvent considérée comme la plus sucrée.",
  },
  {
    name: "Vase d'argent",
    species: "Aechmea fasciata",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "18-24°C",
    careNotes: "Versez l'eau au centre du rosette. Tolère l'oubli d'arrosage. Préfère une lumière vive sans soleil direct.",
  },
  {
    name: "Capillaire",
    species: "Adiantum raddianum",
    wateringFrequency: 3,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Maintenez le substrat constamment humide. Placez dans un endroit lumineux sans soleil direct. Vaporisez régulièrement pour maintenir une bonne humidité.",
  },
  {
    name: "Aglaonéma",
    species: "Aglaonema commutatum",
    wateringFrequency: 7,
    light: "Faible à modérée",
    temperature: "18-27°C",
    careNotes: "Arrosez quand le dessus du terreau est sec. Tolère la faible luminosité. Idéale pour les espaces avec peu de lumière naturelle.",
  },
  {
    name: "Oreille d'éléphant",
    species: "Alocasia amazonica",
    wateringFrequency: 5,
    light: "Indirecte brillante",
    temperature: "18-30°C",
    careNotes: "Maintenez le substrat légèrement humide. Placez dans un endroit lumineux sans soleil direct. Apprécie l'humidité ambiante élevée.",
  },
  {
    name: "Anthurium",
    species: "Anthurium andraeanum",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "18-27°C",
    careNotes: "Laissez sécher légèrement entre les arrosages. Apprécie une lumière vive sans soleil direct. Vaporisez le feuillage régulièrement.",
  },
  {
    name: "Pin de Norfolk",
    species: "Araucaria heterophylla",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "13-24°C",
    careNotes: "Arrosez modérément, laissez sécher entre les arrosages. Évitez le soleil direct qui peut brûler les branches. Préfère les températures fraîches.",
  },
  {
    name: "Plante de fer",
    species: "Aspidistra elatior",
    wateringFrequency: 10,
    light: "Faible à modérée",
    temperature: "10-24°C",
    careNotes: "Extrêmement résistante, supporte la négligence. Tolère très bien l'ombre. Arrosez sobrement, laissez sécher entre les arrosages.",
  },
  {
    name: "Fougère nid d'oiseau",
    species: "Asplenium nidus",
    wateringFrequency: 5,
    light: "Indirecte",
    temperature: "18-27°C",
    careNotes: "Maintenez le substrat constamment humide. Apprécie l'humidité ambiante. Ne laissez jamais sécher complètement.",
  },
  {
    name: "Pied d'éléphant",
    species: "Beaucarnea recurvata",
    wateringFrequency: 14,
    light: "Directe",
    temperature: "15-30°C",
    careNotes: "Extrêmement résistante à la sécheresse. Arrosez peu et laissez sécher entre les arrosages. Tolère le soleil direct.",
  },
  {
    name: "Bégonia royal",
    species: "Begonia rex",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Évitez de mouiller les feuilles. Apprécie l'humidité ambiante sans arrosage direct.",
  },
  {
    name: "Caladium",
    species: "Caladium bicolor",
    wateringFrequency: 3,
    light: "Indirecte",
    temperature: "18-30°C",
    careNotes: "Maintenez le substrat humide. Apprécie la chaleur et l'humidité. Évitez les courants d'air froid.",
  },
  {
    name: "Plante paon",
    species: "Calathea makoyana",
    wateringFrequency: 5,
    light: "Indirecte faible",
    temperature: "18-24°C",
    careNotes: "Maintenez le substrat légèrement humide. Sensible au chlore, utilisez de l'eau filtrée. Apprécie l'humidité ambiante élevée.",
  },
  {
    name: "Palmier nain",
    species: "Chamaedorea elegans",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Arrosez quand le dessus du terreau est sec. Tolère l'ombre. Vaporisez régulièrement pour prévenir les araignées rouges.",
  },
  {
    name: "Plante araignée",
    species: "Chlorophytum comosum",
    wateringFrequency: 7,
    light: "Indirecte à directe",
    temperature: "13-27°C",
    careNotes: "Arrosez quand le terreau est sec. Très résistante et facile à entretenir. Produit des plantules faciles à propager.",
  },
  {
    name: "Vigne d'intérieur",
    species: "Cissus rhombifolia",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "15-27°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Offrez un support pour grimper. Apprécie l'humidité ambiante.",
  },
  {
    name: "Clivia",
    species: "Clivia miniata",
    wateringFrequency: 10,
    light: "Indirecte",
    temperature: "15-24°C",
    careNotes: "Laissez sécher entre les arrosages. Période de repos en hiver nécessaire pour la floraison. Réduisez l'arrosage en hiver.",
  },
  {
    name: "Croton",
    species: "Codiaeum variegatum",
    wateringFrequency: 5,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Maintenez le substrat légèrement humide. Les couleurs sont plus vives avec plus de lumière. Vaporisez régulièrement.",
  },
  {
    name: "Plante de jade",
    species: "Crassula ovata",
    wateringFrequency: 14,
    light: "Directe",
    temperature: "15-24°C",
    careNotes: "Arrosez rarement, laissez sécher complètement entre les arrosages. Placez en plein soleil. Très facile à entretenir.",
  },
  {
    name: "Cyclamen",
    species: "Cyclamen persicum",
    wateringFrequency: 5,
    light: "Indirecte brillante",
    temperature: "10-18°C",
    careNotes: "Arrosez par le bas pour éviter de mouiller le collet. Préfère les températures fraîches. Entre en dormance l'été.",
  },
  {
    name: "Dieffenbachia",
    species: "Dieffenbachia seguine",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-27°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Attention, toutes les parties sont toxiques si ingérées. Tolère l'ombre.",
  },
  {
    name: "Dragonnier",
    species: "Dracaena fragrans",
    wateringFrequency: 10,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Laissez sécher entre les arrosages. Tolère une large gamme de conditions. Sensible au fluor, utilisez de l'eau filtrée.",
  },
  {
    name: "Pothos",
    species: "Epipremnum aureum",
    wateringFrequency: 7,
    light: "Faible à brillante",
    temperature: "15-30°C",
    careNotes: "Arrosez quand le terreau est sec. Extrêmement adaptable et facile à cultiver. Peut être taillé pour encourager la ramification.",
  },
  {
    name: "Figuier pleureur",
    species: "Ficus benjamina",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "18-24°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. N'aime pas être déplacé. Sensible aux courants d'air.",
  },
  {
    name: "Caoutchouc",
    species: "Ficus elastica",
    wateringFrequency: 10,
    light: "Indirecte brillante",
    temperature: "18-30°C",
    careNotes: "Laissez sécher entre les arrosages. Essuyez les feuilles régulièrement pour enlever la poussière. Peut atteindre plusieurs mètres.",
  },
  {
    name: "Plante mosaïque",
    species: "Fittonia albivenis",
    wateringFrequency: 3,
    light: "Indirecte faible",
    temperature: "18-27°C",
    careNotes: "Maintenez le substrat constamment humide. Apprécie l'humidité ambiante élevée. Parfaite pour terrariums.",
  },
  {
    name: "Lierre",
    species: "Hedera helix",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "10-21°C",
    careNotes: "Arrosez modérément, laissez sécher entre les arrosages. Préfère les températures fraîches. Vaporisez régulièrement.",
  },
  {
    name: "Fleur de porcelaine",
    species: "Hoya carnosa",
    wateringFrequency: 10,
    light: "Indirecte brillante",
    temperature: "18-24°C",
    careNotes: "Laissez sécher entre les arrosages. Ne coupez pas les tiges florales après la floraison. Apprécie d'être à l'étroit dans son pot.",
  },
  {
    name: "Kalanchoé",
    species: "Kalanchoe blossfeldiana",
    wateringFrequency: 10,
    light: "Directe",
    temperature: "15-24°C",
    careNotes: "Arrosez uniquement quand le substrat est sec. Supporte bien la sécheresse. Nécessite des jours courts pour fleurir.",
  },
  {
    name: "Plante qui prie",
    species: "Maranta leuconeura",
    wateringFrequency: 5,
    light: "Indirecte faible",
    temperature: "18-24°C",
    careNotes: "Maintenez le substrat légèrement humide. Sensible au chlore, utilisez de l'eau filtrée. Feuilles qui se replient la nuit.",
  },
  {
    name: "Plante à trous",
    species: "Monstera deliciosa",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "18-30°C",
    careNotes: "Arrosez quand le terreau commence à sécher. Apprécie un tuteur pour grimper. Les feuilles développent des trous avec l'âge.",
  },
  {
    name: "Fougère de Boston",
    species: "Nephrolepis exaltata",
    wateringFrequency: 3,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Maintenez le substrat constamment humide. Vaporisez régulièrement. Ne laissez jamais sécher complètement.",
  },
  {
    name: "Peperomia",
    species: "Peperomia obtusifolia",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-24°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Feuilles succulentes qui stockent l'eau. Idéal pour petits espaces.",
  },
  {
    name: "Philodendron",
    species: "Philodendron scandens",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-27°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Très facile à cultiver. Peut grimper ou retomber selon vos préférences.",
  },
  {
    name: "Plante à monnaie chinoise",
    species: "Pilea peperomioides",
    wateringFrequency: 7,
    light: "Indirecte brillante",
    temperature: "15-24°C",
    careNotes: "Arrosez quand le terreau commence à sécher. Tournez régulièrement pour une croissance uniforme. Produit facilement des rejets.",
  },
  {
    name: "Langue de belle-mère",
    species: "Sansevieria trifasciata",
    wateringFrequency: 14,
    light: "Faible à directe",
    temperature: "15-30°C",
    careNotes: "Arrosez très peu, laissez sécher complètement entre les arrosages. Extrêmement résistante, presque indestructible. Purifie l'air.",
  },
  {
    name: "Fleur de lune",
    species: "Spathiphyllum wallisii",
    wateringFrequency: 7,
    light: "Indirecte faible",
    temperature: "18-27°C",
    careNotes: "Maintenez le substrat légèrement humide. S'affaisse quand elle a besoin d'eau. Fleurit même avec peu de lumière.",
  },
  {
    name: "Oiseau de paradis",
    species: "Strelitzia reginae",
    wateringFrequency: 7,
    light: "Directe",
    temperature: "18-30°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Nécessite beaucoup de lumière pour fleurir. Plante imposante et spectaculaire.",
  },
  {
    name: "Syngonium",
    species: "Syngonium podophyllum",
    wateringFrequency: 7,
    light: "Indirecte",
    temperature: "18-27°C",
    careNotes: "Arrosez quand la surface du terreau est sèche. Les feuilles changent de forme avec l'âge. Peut grimper avec un support.",
  },
  {
    name: "Misère",
    species: "Tradescantia zebrina",
    wateringFrequency: 5,
    light: "Indirecte brillante",
    temperature: "15-27°C",
    careNotes: "Maintenez le substrat légèrement humide. Croissance rapide et facile à propager. Couleurs plus vives avec plus de lumière.",
  },
  {
    name: "Yucca",
    species: "Yucca elephantipes",
    wateringFrequency: 14,
    light: "Directe",
    temperature: "15-30°C",
    careNotes: "Arrosez très peu, laissez sécher complètement entre les arrosages. Très résistant à la sécheresse. Préfère le plein soleil.",
  },
  {
    name: "Plante ZZ",
    species: "Zamioculcas zamiifolia",
    wateringFrequency: 14,
    light: "Faible à brillante",
    temperature: "15-30°C",
    careNotes: "Arrosez très peu, laissez sécher complètement entre les arrosages. Extrêmement résistante à la négligence. Tolère très bien l'ombre.",
  },
];

// Combinons les plantes de légumes avec les arbres fruitiers et les fleurs
const allPlantsWithoutCategories = [...plantsWithoutCategories, ...fruitTrees, ...flowers];

// Application de la fonction pour assigner les catégories
export const plantDatabase: PlantEntry[] = assignCategories(allPlantsWithoutCategories);

/**
 * Recherche des plantes par catégorie
 */
export function getPlantsByCategory(category: PlantCategory): PlantEntry[] {
  return plantDatabase.filter((plant) => plant.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function searchPlants(query: string): PlantEntry[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  console.log("Recherche de plantes avec requête:", query);
  
  // Recherche plus sophistiquée avec gestion des scores de pertinence
  const results = plantDatabase
    .map(plant => {
      // Calcul du score de correspondance
      let score = 0;
      
      // Correspondance dans le nom (plus important)
      const nameMatch = plant.name.toLowerCase().includes(normalizedQuery);
      if (nameMatch) score += 10;
      
      // Le nom commence par la requête (encore plus important)
      const nameStartsWith = plant.name.toLowerCase().startsWith(normalizedQuery);
      if (nameStartsWith) score += 15;
      
      // Correspondance exacte (priorité maximale)
      const exactMatch = plant.name.toLowerCase() === normalizedQuery;
      if (exactMatch) score += 30;
      
      // Correspondance dans l'espèce (moins important)
      const speciesMatch = plant.species.toLowerCase().includes(normalizedQuery);
      if (speciesMatch) score += 5;
      
      return { plant, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)  // Tri par pertinence décroissante
    .map(item => item.plant);
    
  console.log(`${results.length} plantes trouvées pour "${query}"`);
  return results;
}

/**
 * Recherche des plantes par catégorie
 * @param category Catégorie de plantes à retourner
 * @returns Liste des plantes dans la catégorie spécifiée
 */
export function getPlantsByCategory(category: PlantCategory): PlantEntry[] {
  console.log(`Recherche des plantes dans la catégorie: ${category}`);
  const results = plantDatabase.filter(plant => plant.category === category);
  console.log(`${results.length} plantes trouvées dans la catégorie ${category}`);
  return results;
}

export function getPlantByName(name: string): PlantEntry | undefined {
  const normalizedName = name.toLowerCase().trim();
  return plantDatabase.find(plant => 
    plant.name.toLowerCase() === normalizedName ||
    plant.species.toLowerCase() === normalizedName
  );
}