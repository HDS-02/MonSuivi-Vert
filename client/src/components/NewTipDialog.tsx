import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

// Props du composant
interface NewTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: {
    id: string;
    name: string;
    description: string;
  }[];
}

// Schéma de validation du formulaire
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit contenir au moins 3 caractères",
  }).max(100, {
    message: "Le titre ne doit pas dépasser 100 caractères",
  }),
  content: z.string().min(10, {
    message: "Le contenu doit contenir au moins 10 caractères",
  }),
  category: z.string().optional(),
  plantSpecies: z.string().optional().nullable(),
  imageUrl: z.string().url({ message: "L'URL de l'image n'est pas valide" }).optional().nullable().or(z.literal("")),
  tags: z.string().optional().transform(val => val ? val.split(",").map(tag => tag.trim()) : null),
});

// Type pour les valeurs du formulaire
type FormValues = z.infer<typeof formSchema>;

export default function NewTipDialog({ open, onOpenChange, onSuccess, categories }: NewTipDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialisation du formulaire avec le type explicite
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: undefined,
      plantSpecies: "",
      imageUrl: "",
      tags: "",
    },
  });
  
  // Mutation pour créer un nouveau conseil
  const createTipMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/community/tips", data);
    },
    onSuccess: () => {
      toast({
        title: "Conseil partagé avec succès",
        description: "Votre conseil a été soumis et sera publiée après validation",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de la création du conseil: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Soumission du formulaire typée explicitement
  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour partager un conseil",
        variant: "destructive",
      });
      return;
    }
    
    createTipMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle discussion</DialogTitle>
          <DialogDescription>
            Partagez votre expérience et vos connaissances avec la communauté.
            Votre discussion sera publiée immédiatement.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Un titre concis et descriptif pour votre discussion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez en détail votre sujet, votre question ou votre conseil..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="plantSpecies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espèce de plante (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Monstera deliciosa" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control as any}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'image (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemple.com/image.jpg" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (séparés par des virgules)</FormLabel>
                  <FormControl>
                    <Input placeholder="arrosage, lumière, engrais" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ajoutez des mots-clés pour aider les utilisateurs à trouver votre discussion.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createTipMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createTipMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : "Publier cette discussion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}