import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertGrowthJournalSchema, GrowthJournalEntry } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { X } from "lucide-react";

// Schéma de validation du formulaire
const formSchema = z.object({
  plantId: z.number(),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  height: z.number().min(0, "La hauteur ne peut pas être négative").optional(),
  leaves: z.number().min(0, "Le nombre de feuilles ne peut pas être négatif").optional(),
  healthRating: z.number().min(1, "La note doit être entre 1 et 5").max(5, "La note doit être entre 1 et 5").optional(),
  userId: z.number()
});

// Type d'une entrée à créer/modifier
type FormValues = z.infer<typeof formSchema>;

interface GrowthJournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: number;
  entry?: GrowthJournalEntry; // Si présent, on est en mode édition
  onSave: (data: FormValues) => void;
}

export function GrowthJournalEntryDialog({
  open,
  onOpenChange,
  plantId,
  entry,
  onSave
}: GrowthJournalEntryDialogProps) {
  const { user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId: plantId,
      title: entry?.title || "",
      notes: entry?.notes || "",
      imageUrl: entry?.imageUrl || "",
      height: entry?.height || 0,
      leaves: entry?.leaves || 0,
      healthRating: entry?.healthRating || 3,
      userId: user?.id || 0
    }
  });
  
  // Mettre à jour le formulaire quand l'entrée change
  useEffect(() => {
    if (entry) {
      form.reset({
        plantId: plantId,
        title: entry.title,
        notes: entry.notes || "",
        imageUrl: entry.imageUrl || "",
        height: entry.height || 0,
        leaves: entry.leaves || 0,
        healthRating: entry.healthRating || 3,
        userId: entry.userId
      });
      
      if (entry.imageUrl) {
        setPreviewImage(entry.imageUrl);
      }
    } else {
      // Réinitialiser en mode création
      form.reset({
        plantId: plantId,
        title: "",
        notes: "",
        imageUrl: "",
        height: 0,
        leaves: 0,
        healthRating: 3,
        userId: user?.id || 0
      });
      setPreviewImage(null);
    }
  }, [entry, plantId, user, form]);
  
  // Fonction de soumission du formulaire
  function onSubmit(values: FormValues) {
    onSave(values);
  }
  
  // Gérer le changement d'image
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Pour l'instant on stocke juste l'URL, mais on pourrait implémenter
    // un upload de fichier plus tard
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      form.setValue("imageUrl", result);
    };
    fileReader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between">
            {entry ? "Modifier l'entrée" : "Nouvelle entrée au journal"}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'entrée" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observations sur l'évolution de votre plante..." 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hauteur (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="leaves"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de feuilles</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="healthRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Évaluation de santé (1-5)</FormLabel>
                  <div className="flex items-center gap-4">
                    <span>1</span>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        {...field}
                        value={[field.value || 3]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <span>5</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de la plante</FormLabel>
                  <div className="flex flex-col gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="flex-1"
                    />
                    <Input 
                      type="text" 
                      placeholder="Ou entrez une URL d'image" 
                      value={field.value || ""} 
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setPreviewImage(e.target.value);
                      }}
                      className="flex-1"
                    />
                  </div>
                  
                  {previewImage && (
                    <div className="mt-2 relative">
                      <img 
                        src={previewImage} 
                        alt="Aperçu" 
                        className="rounded-md w-full max-h-[200px] object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setPreviewImage(null);
                          form.setValue("imageUrl", "");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">
                {entry ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}