import { Link } from "wouter";
import usePlants, { usePlantDelete } from "@/hooks/usePlants";
import { Plant } from "@shared/schema";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyPlants() {
  const { data: plants, isLoading } = usePlants();
  const deletePlantMutation = usePlantDelete();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<number | null>(null);

  function getPlantStatusIcon(status: string) {
    switch (status) {
      case "healthy":
        return <span className="material-icons text-sm text-green-500">favorite</span>;
      case "warning":
        return <span className="material-icons text-sm text-yellow-500">warning</span>;
      case "danger":
        return <span className="material-icons text-sm text-alert">warning</span>;
      default:
        return <span className="material-icons text-sm text-gray-500">help_outline</span>;
    }
  }

  function getPlantStatusText(status: string) {
    switch (status) {
      case "healthy":
        return "Bonne santé";
      case "warning":
        return "Attention requise";
      case "danger":
        return "Besoin d'aide";
      default:
        return "État inconnu";
    }
  }

  function getPlantStatusColor(status: string) {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "danger":
        return "bg-alert";
      default:
        return "bg-gray-500";
    }
  }
  
  // Fonction pour obtenir la catégorie en fonction du nom de la plante
  function getPlantCategory(plant: Plant): string {
    const name = plant.name.toLowerCase();
    const species = plant.species?.toLowerCase() || '';
    
    // Liste des légumes courants
    const legumesNames = [
      'ail', 'artichaut', 'asperge', 'aubergine', 'betterave', 'brocoli', 'carotte', 
      'chou', 'concombre', 'courgette', 'épinard', 'haricot', 'laitue', 'oignon', 
      'petits pois', 'poireau', 'poivron', 'pomme de terre', 'radis', 'salade', 
      'ciboulette', 'courge', 'échalote', 'endive', 'fenouil', 'fève', 'navet', 
      'persil', 'potiron', 'rhubarbe', 'amarante', 'arachide', 'basilic', 'bette', 
      'chou-rave', 'coriandre', 'cornichon', 'cresson', 'estragon', 
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
      'pommier', 'prunier', 'pawpaw', 'kaki', 'mandarinier'
    ];
    
    // Liste des fleurs courantes
    const fleurNames = [
      'absinthe', 'abutilon', 'achillée', 'adonis', 'agapanthe', 'alysson', 'amaryllis',
      'ancolie', 'anémone', 'anthémis', 'aster', 'astilbe', 'azalée', 'bégonia',
      'bleuet', 'bourrache', 'bruyère', 'camélia', 'capucine', 'centaurée',
      'chrysanthème', 'clématite', 'colchique', 'coquelicot', 'cosmos', 'cyclamen',
      'dahlia', 'digitale', 'freesia', 'géranium', 'giroflée', 'glaïeul',
      'hélianthe', 'hibiscus', 'hortensia', 'iris', 'jacinthe', 'jasmin',
      'jonquille', 'lavande', 'lilas', 'lys', 'marguerite', 'muflier',
      'myosotis', 'narcisse', 'oeillet', 'orchidée', 'pensée', 'pivoine',
      'rose', 'tulipe', 'violette'
    ];
    
    // Liste plantes d'intérieur
    const interieurNames = [
      'ficus', 'pothos', 'yucca', 'spathiphyllum', 'cactus', 'aloe', 'dracaena',
      'bambou', 'bonsai', 'monstera', 'philodendron', 'sansevieria', 'kalanchoe',
      'succulente', 'croton', 'caoutchouc', 'palmier', 'areca', 'calathea'
    ];
    
    if (legumesNames.some(l => name.includes(l) || species.includes(l))) {
      return 'legumes';
    } else if (fruitierNames.some(f => name.includes(f) || species.includes(f))) {
      return 'fruitiers';
    } else if (fleurNames.some(f => name.includes(f) || species.includes(f))) {
      return 'fleurs';
    } else if (interieurNames.some(i => name.includes(i) || species.includes(i))) {
      return 'interieur';
    } else {
      return 'exterieur';
    }
  }
  
  // Fonction pour filtrer les plantes
  const filteredPlants = () => {
    if (!plants) return [];
    
    return plants.filter(plant => {
      // Filtre par recherche
      const matchesSearch = searchQuery === "" || 
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plant.species && plant.species.toLowerCase().includes(searchQuery.toLowerCase()));
        
      // Filtre par catégorie
      const matchesCategory = selectedCategory === "all" || getPlantCategory(plant) === selectedCategory;
        
      return matchesSearch && matchesCategory;
    });
  };
  
  // Fonction pour supprimer une plante
  const handleDeleteClick = (e: React.MouseEvent, plantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPlantToDelete(plantId);
    setConfirmDialogOpen(true);
  };
  
  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (plantToDelete) {
      deletePlantMutation.mutate(plantToDelete);
      setConfirmDialogOpen(false);
      setPlantToDelete(null);
    }
  };

  return (
    <div className="organic-bg min-h-screen pb-24">
      <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center text-white/90 mb-4 hover:text-white transition-colors"
        >
          <span className="material-icons mr-1">arrow_back</span>
          Retour
        </button>
        <h2 className="text-2xl font-raleway font-semibold">Mes plantes</h2>
        <p className="text-white/80 mt-1">Gérez votre collection de plantes</p>
      </div>

      <div className="mb-6 px-4">
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
            <span className="material-icons">search</span>
          </span>
          <input
            type="text"
            placeholder="Rechercher une plante..."
            className="w-full pl-10 py-3 rounded-lg glass-card backdrop-blur-sm shadow-sm border border-gray-100/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="glass-card backdrop-blur-sm border border-gray-100/50 focus:ring-primary/30">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les plantes</SelectItem>
              <SelectItem value="legumes">Légumes</SelectItem>
              <SelectItem value="fruitiers">Arbres fruitiers</SelectItem>
              <SelectItem value="fleurs">Fleurs</SelectItem>
              <SelectItem value="interieur">Plantes d'intérieur</SelectItem>
              <SelectItem value="exterieur">Plantes d'extérieur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="glass-card backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100/80 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-primary/20 h-14 w-14 flex items-center justify-center mb-4">
                <span className="material-icons text-primary/40 text-3xl">eco</span>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : plants && plants.length > 0 ? (
        <>
          {filteredPlants().length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
              {filteredPlants().map((plant: Plant) => (
                <div 
                  key={plant.id}
                  className="glass-card backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-[1.02] duration-200 border border-gray-100/50 relative"
                >
                  <Link 
                    href={`/plants/${plant.id}`}
                    className="block"
                  >
                    <div className="h-36 bg-gray-100/50 relative">
                      {plant.image ? (
                        <img 
                          src={plant.image.startsWith('http') ? plant.image : `${plant.image}`}
                          alt={plant.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-plant.jpg';
                            console.error("Erreur de chargement d'image:", plant.image);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary-light/5">
                          <span className="material-icons text-primary text-4xl">eco</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 glass-card backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                        {getPlantStatusIcon(plant.status)}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteClick(e, plant.id)}
                        className="absolute top-2 right-2 glass-card backdrop-blur-sm rounded-full p-1.5 shadow-sm bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                        aria-label="Supprimer"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-primary-dark mb-1">{plant.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${getPlantStatusColor(plant.status)} mr-2`}></div>
                          <span className="text-xs text-gray-600">{getPlantStatusText(plant.status)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {getPlantCategory(plant)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              
              <Link
                href="/add-plant"
                className="glass-card backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-dashed border-primary/30 flex flex-col items-center justify-center h-[180px] cursor-pointer bg-primary/5 transform hover:scale-[1.02] hover:bg-primary/10 duration-200"
              >
                <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full p-3 shadow-md mb-3">
                  <span className="material-icons text-2xl">add</span>
                </div>
                <span className="text-sm font-medium text-primary-dark">Ajouter une plante</span>
              </Link>
            </div>
          ) : (
            <div className="glass-card backdrop-blur-sm mx-4 p-8 text-center rounded-xl shadow-lg border border-gray-100/80">
              <div className="mb-4">
                <span className="material-icons text-primary text-5xl">search_off</span>
              </div>
              <h3 className="text-xl font-raleway font-medium mb-2 text-primary-dark">Aucun résultat</h3>
              <p className="text-gray-600 mb-6">Aucune plante ne correspond à votre recherche</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-full inline-flex items-center shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                <span className="material-icons mr-2">refresh</span>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card backdrop-blur-sm mx-4 p-8 text-center rounded-xl shadow-lg border border-gray-100/80">
          <div className="mb-4 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full p-4 inline-block">
            <span className="material-icons text-primary text-4xl">eco</span>
          </div>
          <h3 className="text-xl font-raleway font-medium mb-2 text-primary-dark">Aucune plante</h3>
          <p className="text-gray-600 mb-6">Ajoutez votre première plante pour commencer à suivre sa santé</p>
          <Link
            href="/add-plant"
            className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-full inline-flex items-center shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            <span className="material-icons mr-2">add_circle</span>
            Ajouter une plante
          </Link>
        </div>
      )}

      {/* Boîte de dialogue de confirmation pour la suppression */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer cette plante"
        description="Êtes-vous sûr de vouloir supprimer cette plante ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </div>
  );
}
