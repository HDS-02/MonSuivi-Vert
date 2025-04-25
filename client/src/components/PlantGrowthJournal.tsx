import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CalendarDays, 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  Ruler, 
  Leaf 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowthJournal } from "@/hooks/useGrowthJournal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GrowthJournalEntry } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface PlantGrowthJournalProps {
  plantId: number;
  plantName: string;
}

export function PlantGrowthJournal({ plantId, plantName }: PlantGrowthJournalProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GrowthJournalEntry | null>(null);
  
  const { user } = useAuth();
  
  const {
    plantEntries,
    isLoadingPlantEntries,
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation,
  } = useGrowthJournal(plantId);
  
  const handleAddEntry = (data: any) => {
    if (!user) {
      console.error("Impossible d'ajouter une entrée : utilisateur non connecté");
      return;
    }
    
    // Préparer les données avec les conversions explicites
    const entryData = {
      ...data,
      plantId: Number(plantId),
      userId: Number(user.id),
      // S'assurer que les valeurs numériques sont soit des nombres, soit null
      healthRating: data.healthRating !== undefined ? Number(data.healthRating) : null,
      height: data.height !== undefined ? Number(data.height) : null,
      leaves: data.leaves !== undefined ? Number(data.leaves) : null,
    };
    
    console.log("Tentative d'ajout d'une entrée au journal (avant):", data);
    console.log("Tentative d'ajout d'une entrée au journal (après):", entryData);
    
    createEntryMutation.mutate(entryData, {
      onSuccess: (responseData) => {
        console.log("Entrée de journal créée avec succès:", responseData);
        // Fermer le dialogue après création réussie
        setOpenAddDialog(false);
      },
      onError: (error: any) => {
        console.error("Erreur lors de la création de l'entrée de journal:", error);
        console.error("Détails de l'erreur:", error.message);
        // On ne ferme pas le dialogue en cas d'erreur pour permettre à l'utilisateur de corriger
      }
    });
  };
  
  const handleEditEntry = (entry: GrowthJournalEntry) => {
    setSelectedEntry(entry);
    setOpenEditDialog(true);
  };
  
  const handleUpdateEntry = (data: any) => {
    if (!selectedEntry) return;
    
    updateEntryMutation.mutate({
      id: selectedEntry.id,
      updates: {
        ...data,
        date: data.date,
      },
    });
    
    setOpenEditDialog(false);
    setSelectedEntry(null);
  };
  
  const handleDeleteClick = (entry: GrowthJournalEntry) => {
    setSelectedEntry(entry);
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteConfirm = () => {
    if (!selectedEntry) return;
    
    deleteEntryMutation.mutate(selectedEntry.id);
    setOpenDeleteDialog(false);
    setSelectedEntry(null);
  };
  
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Date inconnue";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };
  
  // Rendu des états de chargement, erreur ou données vides
  if (isLoadingPlantEntries) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Journal de croissance</h3>
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-16 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Journal de croissance</h3>
        {user && (
          <Button onClick={() => setOpenAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une entrée
          </Button>
        )}
      </div>
      
      {plantEntries.length === 0 ? (
        <div className="text-center py-8 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            Aucune entrée n'a été ajoutée au journal pour cette plante.
          </p>
          {user && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setOpenAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Commencer à documenter l'évolution
            </Button>
          )}
        </div>
      ) : (
        plantEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-lg">{entry.title}</h4>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditEntry(entry)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteClick(entry)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <CalendarDays className="h-4 w-4 mr-1" />
                {formatDate(entry.date)}
              </div>
              
              {entry.notes && (
                <p className="text-sm mb-4 whitespace-pre-line">{entry.notes}</p>
              )}
              
              {entry.imageUrl && (
                <div className="mb-4">
                  <img
                    src={entry.imageUrl}
                    alt={`Photo de ${plantName}`}
                    className="w-full max-h-48 object-cover rounded-md"
                  />
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {entry.healthRating && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Santé: {entry.healthRating}/5
                  </Badge>
                )}
                
                {entry.height && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {entry.height} cm
                  </Badge>
                )}
                
                {entry.leaves && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    {entry.leaves} feuilles
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {/* Dialogue simplifié pour ajouter une entrée */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une entrée au journal</DialogTitle>
            <DialogDescription>
              Documentez l'évolution de votre plante au fil du temps.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Titre de l'entrée */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Titre <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                placeholder="Ex: Nouvelle pousse"
                onChange={(e) => {
                  // Le formulaire est stocké en mémoire
                  (window as any).entryFormData = {
                    ...(window as any).entryFormData || {},
                    title: e.target.value
                  };
                }}
              />
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes et observations
              </label>
              <Textarea 
                id="notes" 
                placeholder="Décrivez vos observations..."
                onChange={(e) => {
                  (window as any).entryFormData = {
                    ...(window as any).entryFormData || {},
                    notes: e.target.value
                  };
                }}
              />
            </div>
            
            {/* Mesures optionnelles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="health" className="text-sm font-medium">
                  Santé (1-5)
                </label>
                <Input
                  id="health"
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Ex: 4"
                  onChange={(e) => {
                    (window as any).entryFormData = {
                      ...(window as any).entryFormData || {},
                      healthRating: e.target.value ? Number(e.target.value) : null
                    };
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="height" className="text-sm font-medium">
                  Hauteur (cm)
                </label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  placeholder="Ex: 25"
                  onChange={(e) => {
                    (window as any).entryFormData = {
                      ...(window as any).entryFormData || {},
                      height: e.target.value ? Number(e.target.value) : null
                    };
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="leaves" className="text-sm font-medium">
                  Nombre de feuilles
                </label>
                <Input
                  id="leaves"
                  type="number"
                  min="0"
                  placeholder="Ex: 8"
                  onChange={(e) => {
                    (window as any).entryFormData = {
                      ...(window as any).entryFormData || {},
                      leaves: e.target.value ? Number(e.target.value) : null
                    };
                  }}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                // Récupérer les données stockées dans la variable globale
                const formData = (window as any).entryFormData || {};
                
                // Préparer un objet à envoyer au serveur
                const entryData = {
                  title: formData.title || "Nouvelle entrée",
                  date: new Date(),
                  plantId: Number(plantId),
                  userId: user?.id ? Number(user.id) : 0,
                  notes: formData.notes || "",
                  imageUrl: "",
                  healthRating: formData.healthRating || null,
                  height: formData.height || null,
                  leaves: formData.leaves || null
                };
                
                // Envoyer les données au serveur
                handleAddEntry(entryData);
                
                // Réinitialiser la variable globale
                (window as any).entryFormData = {};
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue simplifié pour modifier une entrée */}
      {selectedEntry && (
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier une entrée</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails de cette entrée.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Titre de l'entrée */}
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Titre <span className="text-destructive">*</span>
                </label>
                <Input
                  id="edit-title"
                  defaultValue={selectedEntry.title}
                  onChange={(e) => {
                    (window as any).editFormData = {
                      ...(window as any).editFormData || {},
                      title: e.target.value
                    };
                  }}
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="edit-notes" className="text-sm font-medium">
                  Notes et observations
                </label>
                <Textarea 
                  id="edit-notes" 
                  defaultValue={selectedEntry.notes || ""}
                  onChange={(e) => {
                    (window as any).editFormData = {
                      ...(window as any).editFormData || {},
                      notes: e.target.value
                    };
                  }}
                />
              </div>
              
              {/* Mesures optionnelles */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-health" className="text-sm font-medium">
                    Santé (1-5)
                  </label>
                  <Input
                    id="edit-health"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={selectedEntry.healthRating || ""}
                    onChange={(e) => {
                      (window as any).editFormData = {
                        ...(window as any).editFormData || {},
                        healthRating: e.target.value ? Number(e.target.value) : null
                      };
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-height" className="text-sm font-medium">
                    Hauteur (cm)
                  </label>
                  <Input
                    id="edit-height"
                    type="number"
                    min="0"
                    defaultValue={selectedEntry.height || ""}
                    onChange={(e) => {
                      (window as any).editFormData = {
                        ...(window as any).editFormData || {},
                        height: e.target.value ? Number(e.target.value) : null
                      };
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-leaves" className="text-sm font-medium">
                    Nombre de feuilles
                  </label>
                  <Input
                    id="edit-leaves"
                    type="number"
                    min="0"
                    defaultValue={selectedEntry.leaves || ""}
                    onChange={(e) => {
                      (window as any).editFormData = {
                        ...(window as any).editFormData || {},
                        leaves: e.target.value ? Number(e.target.value) : null
                      };
                    }}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="submit"
                onClick={() => {
                  // Récupérer les données du formulaire
                  const formData = (window as any).editFormData || {};
                  
                  // Préparer l'objet avec les valeurs par défaut de l'entrée sélectionnée
                  const updatedEntry = {
                    title: formData.title !== undefined ? formData.title : selectedEntry.title,
                    notes: formData.notes !== undefined ? formData.notes : selectedEntry.notes,
                    date: selectedEntry.date,
                    healthRating: formData.healthRating !== undefined ? formData.healthRating : selectedEntry.healthRating,
                    height: formData.height !== undefined ? formData.height : selectedEntry.height,
                    leaves: formData.leaves !== undefined ? formData.leaves : selectedEntry.leaves,
                    imageUrl: selectedEntry.imageUrl || ""
                  };
                  
                  // Envoyer les données
                  handleUpdateEntry(updatedEntry);
                  
                  // Réinitialiser
                  (window as any).editFormData = {};
                }}
              >
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cette entrée sera définitivement supprimée du journal de croissance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}