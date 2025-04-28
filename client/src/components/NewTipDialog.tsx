import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Type pour les catégories
type Category = {
  id: string;
  name: string;
  description: string;
};

// Props du composant
interface NewTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Category[];
}

// Schéma de validation pour le formulaire
const formSchema = z.object({
  title: z.string().min(5, {
    message: "Le titre doit contenir au moins 5 caractères",
  }).max(100, {
    message: "Le titre ne peut pas dépasser 100 caractères",
  }),
  content: z.string().min(20, {
    message: "Le contenu doit contenir au moins 20 caractères",
  }).max(5000, {
    message: "Le contenu ne peut pas dépasser 5000 caractères",
  }),
  category: z.string().optional(),
  plantSpecies: z.string().optional().nullable(),
  imageUrl: z.string().url({ message: "L'URL de l'image n'est pas valide" }).optional().nullable(),
  tags: z.string().optional().transform(val => val ? val.split(",").map(tag => tag.trim()) : []),
});

// Type pour les valeurs du formulaire
type FormValues = z.infer<typeof formSchema>;

export default function NewTipDialog({ open, onOpenChange, onSuccess, categories }: NewTipDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialisation du formulaire
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
        description: "Votre conseil a été soumis et sera publié après validation",
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
  
  // Soumission du formulaire
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
          <DialogTitle>Partager un conseil</DialogTitle>
          <DialogDescription>
            Partagez votre expérience et vos connaissances avec la communauté.
            Votre conseil sera examiné avant d'être publié.
          </DialogDescription>
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
                    <Input placeholder="Un titre concis et descriptif" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre conseil en détail..." 
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
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (séparés par des virgules)</FormLabel>
                  <FormControl>
                    <Input placeholder="arrosage, lumière, engrais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createTipMutation.isPending}
                className="w-full"
              >
                {createTipMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : "Partager mon conseil"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}