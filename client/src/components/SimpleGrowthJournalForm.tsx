import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ImageIcon, XCircleIcon, X } from "lucide-react";
import { GrowthJournalEntry } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimpleGrowthJournalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: number;
  entry?: GrowthJournalEntry;
  onSave: (data: any) => void;
}

export function SimpleGrowthJournalForm({
  open,
  onOpenChange,
  plantId,
  entry,
  onSave,
}: SimpleGrowthJournalFormProps) {
  // États locaux pour tous les champs du formulaire
  const [title, setTitle] = useState(entry?.title || "");
  const [selectedDate, setSelectedDate] = useState<Date>(
    entry?.date ? new Date(entry.date) : new Date()
  );
  const [notes, setNotes] = useState(entry?.notes || "");
  const [imageUrl, setImageUrl] = useState(entry?.imageUrl || "");
  const [imagePreview, setImagePreview] = useState<string | null>(entry?.imageUrl || null);
  const [healthRating, setHealthRating] = useState<string>(
    entry?.healthRating ? entry.healthRating.toString() : ""
  );
  const [height, setHeight] = useState<string>(
    entry?.height ? entry.height.toString() : ""
  );
  const [leaves, setLeaves] = useState<string>(
    entry?.leaves ? entry.leaves.toString() : ""
  );

  // États de validation
  const [titleError, setTitleError] = useState("");

  // Gestion de l'upload d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result.toString();
        setImagePreview(imageData);
        setImageUrl(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageUrl("");
  };

  // Validation des champs
  const validateForm = (): boolean => {
    let isValid = true;

    // Validation du titre
    if (!title || title.trim().length < 2) {
      setTitleError("Le titre doit contenir au moins 2 caractères");
      isValid = false;
    } else {
      setTitleError("");
    }

    return isValid;
  };

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Préparation des données
    const formData = {
      plantId: Number(plantId),
      title,
      date: selectedDate,
      notes: notes || "",
      imageUrl: imageUrl || "",
      healthRating: healthRating ? Number(healthRating) : null,
      height: height ? Number(height) : null,
      leaves: leaves ? Number(leaves) : null,
    };

    console.log("Données du formulaire à envoyer:", formData);
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle>
              {entry ? "Modifier une entrée" : "Ajouter une entrée"}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Documentez l'évolution de votre plante dans votre journal de croissance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champ Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nouvelle pousse"
            />
            {titleError && (
              <p className="text-sm text-red-500">{titleError}</p>
            )}
          </div>

          {/* Champ Date */}
          <div className="space-y-2">
            <Label>
              Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full pl-3 text-left font-normal"
                >
                  {selectedDate ? (
                    format(selectedDate, "d MMMM yyyy", { locale: fr })
                  ) : (
                    <span className="text-muted-foreground">Choisir une date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  locale={fr}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Grille pour les champs numériques */}
          <div className="grid grid-cols-3 gap-4">
            {/* Santé */}
            <div className="space-y-2">
              <Label htmlFor="healthRating">Santé (1-5)</Label>
              <Select
                value={healthRating}
                onValueChange={setHealthRating}
              >
                <SelectTrigger id="healthRating">
                  <SelectValue placeholder="Évaluer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non évalué</SelectItem>
                  <SelectItem value="1">1 - Critique</SelectItem>
                  <SelectItem value="2">2 - Mauvaise</SelectItem>
                  <SelectItem value="3">3 - Moyenne</SelectItem>
                  <SelectItem value="4">4 - Bonne</SelectItem>
                  <SelectItem value="5">5 - Excellente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hauteur */}
            <div className="space-y-2">
              <Label htmlFor="height">Hauteur (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="En cm"
                min="0"
              />
            </div>

            {/* Feuilles */}
            <div className="space-y-2">
              <Label htmlFor="leaves">Nb. feuilles</Label>
              <Input
                id="leaves"
                type="number"
                value={leaves}
                onChange={(e) => setLeaves(e.target.value)}
                placeholder="Quantité"
                min="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations sur l'état de votre plante"
              className="resize-none"
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={clearImage}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md h-48 bg-gray-50">
                  <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-2">
                    Formats acceptés: JPG, PNG
                  </p>
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md cursor-pointer hover:bg-primary/90"
                  >
                    Choisir une image
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">
              {entry ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}