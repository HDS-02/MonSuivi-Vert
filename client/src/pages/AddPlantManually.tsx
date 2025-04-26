import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsertPlant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import PlantAutocomplete from "@/components/PlantAutocomplete";
import PlantCategorySelect, { PlantCategory } from "@/components/PlantCategorySelect";
import PlantListByCategory, { PlantEntry } from "@/components/PlantListByCategory";
import useNotifications from "@/hooks/useNotifications";
import useBadges from "@/hooks/useBadges";

interface PlantSuggestion {
  name: string;
  species: string;
}

export default function AddPlantManually() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { notifyPlantAdded } = useNotifications();
  const { updatePlantCollectionBadges } = useBadges();
  
  // État pour suivre l'étape du processus hiérarchique
  const [step, setStep] = useState<'category' | 'plant-list' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | null>(null);
  const [selectedPlantFromList, setSelectedPlantFromList] = useState<PlantEntry | null>(null);
  
  // États pour les champs du formulaire
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [status, setStatus] = useState("healthy");
  const [light, setLight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState(7);
  const [careNotes, setCareNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPlantInfo, setIsLoadingPlantInfo] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour suivre quels champs ont été remplis automatiquement
  const [autofilledFields, setAutofilledFields] = useState<{
    species: boolean;
    status: boolean;
    light: boolean;
    temperature: boolean;
    wateringFrequency: boolean;
    careNotes: boolean;
  }>({
    species: false,
    status: false,
    light: false,
    temperature: false,
    wateringFrequency: false,
    careNotes: false,
  });
  
  // Gérer le changement de fichier d'image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction pour récupérer les informations sur la plante à partir de son nom
  const fetchPlantInfo = async (plantName: string) => {
    if (!plantName || plantName.trim().length < 3) {
      toast({
        description: "Veuillez entrer au moins 3 caractères pour la recherche",
      });
      return;
    }
    
    // Indiquer que les informations sont en cours de récupération
    setIsLoadingPlantInfo(true);
    
    try {
      const response = await fetch(`/api/plant-info?name=${encodeURIComponent(plantName)}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations sur la plante");
      }
      
      const plantInfo = await response.json();
      
      // Remplir automatiquement les champs avec les informations récupérées
      if (plantInfo) {
        // Réinitialiser l'état des champs auto-remplis
        const newAutofilledFields = {
          species: false,
          status: false,
          light: false,
          temperature: false,
          wateringFrequency: false,
          careNotes: false,
        };
        
        // Ne pas écraser l'espèce si elle est déjà remplie
        if (plantInfo.species && !species) {
          setSpecies(plantInfo.species);
          newAutofilledFields.species = true;
        }
        
        // Mettre à jour l'état de santé
        if (plantInfo.status) {
          setStatus(plantInfo.status);
          newAutofilledFields.status = true;
        }
        
        // Mettre à jour les informations d'entretien
        if (plantInfo.careInstructions) {
          if (plantInfo.careInstructions.light) {
            setLight(plantInfo.careInstructions.light);
            newAutofilledFields.light = true;
          }
          
          if (plantInfo.careInstructions.temperature) {
            setTemperature(plantInfo.careInstructions.temperature);
            newAutofilledFields.temperature = true;
          }
          
          // Mettre à jour les notes d'entretien avec les recommandations
          let notes = '';
          
          if (plantInfo.recommendations && plantInfo.recommendations.length > 0) {
            notes += "Recommandations:\n" + plantInfo.recommendations.join("\n") + "\n\n";
          }
          
          if (plantInfo.careInstructions.additional && plantInfo.careInstructions.additional.length > 0) {
            notes += "Conseils supplémentaires:\n" + plantInfo.careInstructions.additional.join("\n");
          }
          
          if (notes) {
            setCareNotes(notes);
            newAutofilledFields.careNotes = true;
          }
          
          // Tenter d'extraire une fréquence d'arrosage approximative à partir du texte
          if (plantInfo.careInstructions.watering) {
            const wateringText = plantInfo.careInstructions.watering.toLowerCase();
            let frequency = 7; // Valeur par défaut (une fois par semaine)
            
            if (wateringText.includes("quotidien") || wateringText.includes("tous les jours")) {
              frequency = 1;
            } else if (wateringText.includes("2-3 jours") || wateringText.includes("tous les 2")) {
              frequency = 2;
            } else if (wateringText.includes("semaine") || wateringText.includes("7 jours")) {
              frequency = 7;
            } else if (wateringText.includes("10 jours")) {
              frequency = 10;
            } else if (wateringText.includes("2 semaines") || wateringText.includes("14 jours")) {
              frequency = 14;
            } else if (wateringText.includes("rarement") || wateringText.includes("mois")) {
              frequency = 30;
            }
            
            setWateringFrequency(frequency);
            newAutofilledFields.wateringFrequency = true;
          }
        }
        
        // Mise à jour de l'état des champs auto-remplis
        setAutofilledFields(newAutofilledFields);
      }
      
      // Afficher un message de succès
      toast({
        title: "Informations récupérées",
        description: "Les informations de la plante ont été automatiquement remplies",
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des informations sur la plante:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations pour cette plante",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPlantInfo(false);
    }
  };

  // Fonction pour sélectionner une suggestion et remplir les informations
  const selectPlantSuggestion = async (plantName: string) => {
    setName(plantName);
    
    // Récupérer les informations détaillées de la plante sélectionnée
    await fetchPlantInfo(plantName);
  };
  
  // Gérer la sélection d'une catégorie
  const handleSelectCategory = (category: PlantCategory) => {
    setSelectedCategory(category);
    setStep('plant-list');
  };
  
  // Gérer la sélection d'une plante dans la liste
  const handleSelectPlant = (plant: PlantEntry) => {
    setSelectedPlantFromList(plant);
    setName(plant.name);
    setSpecies(plant.species);
    setLight(plant.light);
    setTemperature(plant.temperature);
    setWateringFrequency(plant.wateringFrequency);
    setCareNotes(plant.careNotes);
    setStep('details');
    
    // Mise à jour des champs auto-remplis
    setAutofilledFields({
      species: true,
      status: true,
      light: true,
      temperature: true,
      wateringFrequency: true,
      careNotes: true,
    });
    
    toast({
      title: "Plante sélectionnée",
      description: `Les informations pour ${plant.name} ont été automatiquement remplies.`,
    });
  };
  
  // Fonction pour revenir à l'étape précédente
  const handleGoBack = () => {
    if (step === 'plant-list') {
      setStep('category');
      setSelectedCategory(null);
    } else if (step === 'details') {
      setStep('plant-list');
      // Ne pas réinitialiser les champs pour permettre à l'utilisateur de revenir
    }
  };

  // Gérer le glisser-déposer d'image
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom pour votre plante",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      let imagePath = "";

      // Si une image est sélectionnée, l'uploader d'abord
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        
        // Ajouter la description de la plante pour améliorer l'analyse
        const description = `${name} ${species}`.trim();
        if (description) {
          formData.append("description", description);
        }
        
        const analyzeResponse = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        
        if (!analyzeResponse.ok) {
          throw new Error("Erreur lors de l'upload de l'image");
        }
        
        const analyzeResult = await analyzeResponse.json();
        imagePath = analyzeResult.imagePath;
      }
      
      const plantData: InsertPlant = {
        name,
        species,
        status: status as any,
        image: imagePath, // Chemin de l'image uploadée
        wateringFrequency: parseInt(wateringFrequency.toString()),
        light,
        temperature,
        careNotes,
      };
      
      const plantResponse = await apiRequest("POST", "/api/plants", plantData);
      const plant = await plantResponse.json();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      
      // Mettre à jour les badges liés à la collection de plantes
      updatePlantCollectionBadges.mutateAsync();
      
      // Ajouter une notification pour informer l'utilisateur
      notifyPlantAdded(name);
      
      toast({
        title: "Plante ajoutée",
        description: "La plante a été ajoutée à votre collection",
      });
      
      // Ajout d'un court délai pour s'assurer que les données sont bien invalidées
      setTimeout(() => {
        navigate(`/plants`);
      }, 100);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="organic-bg min-h-screen pb-20">
      <div className="gradient-header bg-gradient-to-br from-primary/90 to-primary-light/90 text-white px-4 pt-6 pb-8 mb-6 shadow-md">
        <button 
          className="flex items-center text-white/90 mb-4 hover:text-white transition-colors"
          onClick={() => navigate("/")}
        >
          <span className="material-icons mr-1">arrow_back</span>
          Retour
        </button>
        <h2 className="text-2xl font-raleway font-semibold">Ajouter une plante</h2>
        <p className="text-white/80 mt-1">
          {step === 'category' && "Choisissez une catégorie de plante"}
          {step === 'plant-list' && "Sélectionnez une plante ou recherchez-la"}
          {step === 'details' && "Complétez les détails de votre plante"}
        </p>
      </div>
      
      <Card className="glass-card backdrop-blur-sm mx-4 mb-8 border border-gray-100/80 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'category' && (
              <PlantCategorySelect onSelectCategory={handleSelectCategory} />
            )}
            
            {step === 'plant-list' && selectedCategory && (
              <PlantListByCategory 
                category={selectedCategory} 
                onSelectPlant={handleSelectPlant}
                onGoBack={handleGoBack}
              />
            )}
            
            {step === 'details' && (
              <>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Détails de la plante</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGoBack}
                      type="button"
                    >
                      <span className="material-icons mr-1 text-sm">arrow_back</span>
                      Retour
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Section d'upload d'image */}
                    <div>
                      <Label>Photo de la plante</Label>
                      <div 
                        className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {imagePreview ? (
                          <div className="relative w-full max-w-md mb-2">
                            <img 
                              src={imagePreview} 
                              alt="Aperçu de la plante" 
                              className="w-full h-48 object-contain rounded-lg" 
                            />
                            <button 
                              type="button"
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                              }}
                            >
                              <span className="material-icons text-gray-600">close</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="material-icons text-gray-400 text-3xl mb-2">add_photo_alternate</span>
                            <p className="text-sm text-gray-500 mb-2">Glissez-déposez une photo ici ou</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <span className="material-icons mr-1 text-sm">upload</span>
                              Choisir une image
                            </Button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name" className="flex items-center">
                        Nom de la plante * 
                        <span className="text-xs ml-2 text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">Auto-complétion</span>
                      </Label>
                      <div className="relative">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 relative">
                            <PlantAutocomplete
                              value={name}
                              onChange={setName}
                              onSelectSuggestion={(suggestion) => {
                                selectPlantSuggestion(suggestion.name);
                              }}
                              placeholder="Ex: Rosier, Ficus, Basilic..."
                              className="input-glass focus:ring-2 ring-primary/30 transition-all"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => fetchPlantInfo(name)}
                            disabled={isLoadingPlantInfo || name.trim().length < 3}
                            className="h-10 px-3 bg-primary/10 backdrop-blur-sm hover:bg-primary/20 hover:text-primary-foreground transition-all"
                          >
                            {isLoadingPlantInfo ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <span className="material-icons text-primary">search</span>
                            )}
                          </Button>
                        </div>

                        {isLoadingPlantInfo && (
                          <p className="text-xs text-primary mt-2 flex items-center animate-pulse">
                            <span className="material-icons text-xs mr-1">hourglass_empty</span>
                            Recherche des informations sur cette plante...
                          </p>
                        )}
                      </div>
                    </div>
                
                    <div>
                      <Label htmlFor="species">Espèce (optionnel)</Label>
                      <Input
                        id="species"
                        value={species}
                        onChange={(e) => {
                          setSpecies(e.target.value);
                          setAutofilledFields((prev) => ({ ...prev, species: false }));
                        }}
                        placeholder="Ex: Ficus lyrata"
                        className={`input-glass focus:ring-2 ring-primary/30 transition-all ${
                          autofilledFields.species ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                      {autofilledFields.species && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                
                    <div>
                      <Label htmlFor="status">État de santé</Label>
                      <Select
                        value={status}
                        onValueChange={(value) => {
                          setStatus(value);
                          setAutofilledFields((prev) => ({ ...prev, status: false }));
                        }}
                      >
                        <SelectTrigger 
                          id="status" 
                          className={`input-glass ${autofilledFields.status ? 'border-primary bg-primary/5' : ''}`}
                        >
                          <SelectValue placeholder="Sélectionnez l'état de santé" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">Bonne santé</SelectItem>
                          <SelectItem value="warning">Attention requise</SelectItem>
                          <SelectItem value="danger">Besoin d'aide</SelectItem>
                        </SelectContent>
                      </Select>
                      {autofilledFields.status && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                
                    <div>
                      <Label htmlFor="watering">Fréquence d'arrosage (jours)</Label>
                      <Input
                        id="watering"
                        type="number"
                        min={1}
                        max={30}
                        value={wateringFrequency}
                        onChange={(e) => {
                          setWateringFrequency(parseInt(e.target.value));
                          setAutofilledFields((prev) => ({ ...prev, wateringFrequency: false }));
                        }}
                        className={`input-glass focus:ring-2 ring-primary/30 transition-all ${
                          autofilledFields.wateringFrequency ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                      {autofilledFields.wateringFrequency && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                
                    <div>
                      <Label htmlFor="light">Besoin en lumière</Label>
                      <Input
                        id="light"
                        value={light}
                        onChange={(e) => {
                          setLight(e.target.value);
                          setAutofilledFields((prev) => ({ ...prev, light: false }));
                        }}
                        placeholder="Ex: Lumière indirecte"
                        className={`input-glass focus:ring-2 ring-primary/30 transition-all ${
                          autofilledFields.light ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                      {autofilledFields.light && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                
                    <div>
                      <Label htmlFor="temperature">Température idéale</Label>
                      <Input
                        id="temperature"
                        value={temperature}
                        onChange={(e) => {
                          setTemperature(e.target.value);
                          setAutofilledFields((prev) => ({ ...prev, temperature: false }));
                        }}
                        placeholder="Ex: 18-24°C"
                        className={`input-glass focus:ring-2 ring-primary/30 transition-all ${
                          autofilledFields.temperature ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                      {autofilledFields.temperature && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                
                    <div>
                      <Label htmlFor="notes">Notes d'entretien</Label>
                      <Textarea
                        id="notes"
                        value={careNotes}
                        onChange={(e) => {
                          setCareNotes(e.target.value);
                          setAutofilledFields((prev) => ({ ...prev, careNotes: false }));
                        }}
                        placeholder="Entrez des détails sur l'entretien de votre plante..."
                        rows={4}
                        className={`input-glass focus:ring-2 ring-primary/30 transition-all ${
                          autofilledFields.careNotes ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                      {autofilledFields.careNotes && (
                        <p className="text-xs text-primary mt-1 flex items-center">
                          <span className="material-icons text-xs mr-1">auto_awesome</span>
                          Champ rempli automatiquement
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-primary-light text-white px-8 py-2 font-medium rounded-full shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2">add_circle</span>
                        Ajouter à ma collection
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Afficher un récapitulatif des champs auto-remplis */}
                {Object.values(autofilledFields).some(Boolean) && (
                  <p className="text-xs text-primary mt-4 border border-primary/20 bg-primary/5 p-3 rounded-lg">
                    <span className="font-medium">Information :</span> Certains champs ont été remplis automatiquement en fonction du nom de la plante. Vous pouvez modifier ces valeurs si nécessaire.
                  </p>
                )}
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}