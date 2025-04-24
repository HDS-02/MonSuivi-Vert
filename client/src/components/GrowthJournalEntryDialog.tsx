import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GrowthJournalEntry, insertGrowthJournalSchema } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ImageIcon, XCircleIcon, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Schéma de validation étendu pour le formulaire
const formSchema = insertGrowthJournalSchema.extend({
  date: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  healthRating: z.union([
    z.literal("").transform(() => null),
    z.literal("0").transform(() => null),
    z.string().transform(val => Number(val)),
    z.number().min(1).max(5),
    z.null()
  ]).optional(),
  height: z.union([
    z.literal("").transform(() => null),
    z.string().transform(val => Number(val)),
    z.number().positive(),
    z.null()
  ]).optional(),
  leaves: z.union([
    z.literal("").transform(() => null),
    z.string().transform(val => Number(val)),
    z.number().nonnegative(),
    z.null()
  ]).optional(),
});

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
  onSave,
}: GrowthJournalEntryDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(entry?.imageUrl || null);
  
  // Initialiser le formulaire avec les valeurs par défaut (mode création) ou existantes (mode édition)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId,
      title: entry?.title || "",
      date: entry?.date ? new Date(entry.date) : new Date(),
      notes: entry?.notes || "",
      imageUrl: entry?.imageUrl || "",
      healthRating: entry?.healthRating || undefined,
      height: entry?.height || undefined,
      leaves: entry?.leaves || undefined,
    },
  });
  
  function onSubmit(values: FormValues) {
    // Correction pour s'assurer que les valeurs optionnelles sont correctement gérées et formatées
    const sanitizedValues = {
      ...values,
      plantId: Number(values.plantId), // Assurer que plantId est un nombre
      notes: values.notes || "",
      imageUrl: values.imageUrl || "",
      // S'assurer que les valeurs numériques sont bien des nombres ou null
      healthRating: values.healthRating ? Number(values.healthRating) : null,
      height: values.height ? Number(values.height) : null,
      leaves: values.leaves ? Number(values.leaves) : null,
    };
    
    console.log("Soumission des données du journal (avant):", values);
    console.log("Soumission des données du journal (après):", sanitizedValues);
    onSave(sanitizedValues);
  }
  
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Créer un aperçu de l'image
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result.toString());
        form.setValue("imageUrl", event.target.result.toString());
      }
    };
    fileReader.readAsDataURL(file);
  }
  
  function clearImage() {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  }

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nouvelle pousse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: fr })
                          ) : (
                            <span className="text-muted-foreground">Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={fr}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="healthRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Santé (1-5)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Évaluer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Non évalué</SelectItem>
                        <SelectItem value="1">1 - Critique</SelectItem>
                        <SelectItem value="2">2 - Mauvaise</SelectItem>
                        <SelectItem value="3">3 - Moyenne</SelectItem>
                        <SelectItem value="4">4 - Bonne</SelectItem>
                        <SelectItem value="5">5 - Excellente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hauteur (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="En cm"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : val);
                        }}
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
                    <FormLabel>Nb. feuilles</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Quantité"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations sur l'état de votre plante"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
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
                    {/* Le champ caché qui stocke l'URL de l'image */}
                    <input type="hidden" {...field} value={field.value || ""} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full">
                {entry ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}