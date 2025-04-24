import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthJournalEntryDialog } from "@/components/GrowthJournalEntryDialog";
import { useGrowthJournal } from "@/hooks/useGrowthJournal";
import { GrowthJournalEntry } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Plus, PenLine, Trash2, Leaf, Ruler, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface PlantGrowthJournalProps {
  plantId: number;
  plantName: string;
}

export function PlantGrowthJournal({ plantId, plantName }: PlantGrowthJournalProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GrowthJournalEntry | null>(null);
  
  const {
    plantEntries,
    isLoadingPlantEntries,
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation
  } = useGrowthJournal(plantId);
  
  // Gérer l'ajout d'une nouvelle entrée
  const handleAddEntry = () => {
    setSelectedEntry(null);
    setDialogOpen(true);
  };
  
  // Gérer l'édition d'une entrée existante
  const handleEditEntry = (entry: GrowthJournalEntry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };
  
  // Gérer la suppression d'une entrée
  const handleDeleteClick = (entry: GrowthJournalEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedEntry) {
      deleteEntryMutation.mutate(selectedEntry.id);
    }
    setDeleteDialogOpen(false);
  };
  
  // Gérer la sauvegarde d'une entrée (création ou mise à jour)
  const handleSaveEntry = (data: any) => {
    if (selectedEntry) {
      // Mode édition
      updateEntryMutation.mutate({ 
        id: selectedEntry.id, 
        updates: data 
      });
    } else {
      // Mode création
      createEntryMutation.mutate(data);
    }
    setDialogOpen(false);
  };
  
  // Afficher un indicateur de chargement
  if (isLoadingPlantEntries) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Afficher un message si aucune entrée
  if (plantEntries.length === 0) {
    return (
      <div className="my-4">
        <div className="text-center p-8 border border-dashed rounded-md bg-muted/40">
          <h3 className="text-lg font-medium mb-2">Journal de croissance vide</h3>
          <p className="text-muted-foreground mb-4">
            Commencez à documenter l'évolution de votre {plantName} en ajoutant une entrée au journal.
          </p>
          <Button onClick={handleAddEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle entrée
          </Button>
        </div>
        
        <GrowthJournalEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          plantId={plantId}
          entry={selectedEntry || undefined}
          onSave={handleSaveEntry}
        />
      </div>
    );
  }
  
  // Formater les entrées pour l'affichage
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };
  
  // Obtenir une couleur basée sur la note de santé
  const getHealthColor = (rating: number | null | undefined) => {
    if (!rating) return "bg-gray-200";
    if (rating <= 1) return "bg-red-500";
    if (rating <= 2) return "bg-orange-500";
    if (rating <= 3) return "bg-yellow-500";
    if (rating <= 4) return "bg-lime-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4 my-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Journal de croissance</h2>
        <Button onClick={handleAddEntry} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle entrée
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {plantEntries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            {entry.imageUrl && (
              <div className="w-full h-40 overflow-hidden">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{entry.title}</CardTitle>
                  <CardDescription>{formatDate(entry.date)}</CardDescription>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getHealthColor(entry.healthRating)}`}>
                  {entry.healthRating || "-"}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              {entry.notes && <p className="text-sm mb-3">{entry.notes}</p>}
              
              <div className="flex gap-2 flex-wrap">
                {entry.height !== null && entry.height !== undefined && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {entry.height} cm
                  </Badge>
                )}
                
                {entry.leaves !== null && entry.leaves !== undefined && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    {entry.leaves} feuilles
                  </Badge>
                )}
                
                {entry.healthRating && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <HeartPulse className="h-3 w-3" />
                    Santé: {entry.healthRating}/5
                  </Badge>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEditEntry(entry)}
              >
                <PenLine className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteClick(entry)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Dialogue d'ajout/modification */}
      <GrowthJournalEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plantId={plantId}
        entry={selectedEntry || undefined}
        onSave={handleSaveEntry}
      />
      
      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette entrée du journal de croissance ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}