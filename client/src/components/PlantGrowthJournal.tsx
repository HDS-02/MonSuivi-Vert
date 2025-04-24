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
import { GrowthJournalEntryDialog } from "@/components/GrowthJournalEntryDialog";
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
    
    console.log("Tentative d'ajout d'une entrée au journal:", { 
      ...data, 
      plantId, 
      userId: user.id,
      date: data.date 
    });
    
    createEntryMutation.mutate({
      ...data,
      plantId,
      userId: user.id, // Utiliser l'ID de l'utilisateur actuel
      date: data.date,
    }, {
      onSuccess: (responseData) => {
        console.log("Entrée de journal créée avec succès:", responseData);
      },
      onError: (error: any) => {
        console.error("Erreur lors de la création de l'entrée de journal:", error);
      }
    });
    
    setOpenAddDialog(false);
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
      
      {/* Dialogue pour ajouter une entrée */}
      <GrowthJournalEntryDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        plantId={plantId}
        onSave={handleAddEntry}
      />
      
      {/* Dialogue pour modifier une entrée */}
      {selectedEntry && (
        <GrowthJournalEntryDialog
          open={openEditDialog}
          onOpenChange={setOpenEditDialog}
          plantId={plantId}
          entry={selectedEntry}
          onSave={handleUpdateEntry}
        />
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