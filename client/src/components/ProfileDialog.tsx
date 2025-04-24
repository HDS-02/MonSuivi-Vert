import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { StableDialog } from "./StableDialog";
import { ConfirmDialog } from "./ConfirmDialog";

// Schéma de validation pour le formulaire de profil
const profileFormSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }).optional(),
  email: z.string().email({ message: "Format d'email invalide" }).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Formulaire de mise à jour du profil
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      firstName: "",
      email: "",
    },
  });
  
  // Mise à jour du formulaire quand l'utilisateur est chargé
  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username || "",
        firstName: user.firstName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

  // Gestionnaire de soumission du formulaire de profil
  const onSubmitProfileForm = async (data: ProfileFormValues) => {
    try {
      // Appel API pour mettre à jour le profil
      if (user?.id) {
        await apiRequest("PATCH", `/api/users/${user.id}`, data);
        
        // Invalider le cache pour forcer le rechargement des données utilisateur
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès",
        });
        
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <StableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2 text-primary-dark font-raleway text-xl">
          <span className="material-icons">account_circle</span>
          Mon Profil
        </span>
      }
      description="Gérez vos informations personnelles"
      className="border border-primary/20 shadow-xl bg-white"
      showCloseButton={true}
    >
      <div className="py-2">
        {/* Profil utilisateur */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <motion.span 
              className="material-icons text-3xl text-primary"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              person
            </motion.span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {user?.firstName || user?.username || 'Bienvenue !'}
            </h3>
            <p className="text-sm text-gray-500">
              Membre depuis {new Date(user?.createdAt || new Date()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfileForm)} className="space-y-5">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <span className="material-icons text-base">alternate_email</span>
                        </span>
                        <Input 
                          className="pl-9 rounded-md border-gray-200 focus:border-primary/40" 
                          placeholder="Votre nom d'utilisateur" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Ce nom sera visible par les autres utilisateurs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <FormField
                control={profileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Prénom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <span className="material-icons text-base">person</span>
                        </span>
                        <Input 
                          className="pl-9 rounded-md border-gray-200 focus:border-primary/40" 
                          placeholder="Votre prénom"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email (optionnel)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <span className="material-icons text-base">email</span>
                        </span>
                        <Input 
                          className="pl-9 rounded-md border-gray-200 focus:border-primary/40" 
                          type="email" 
                          placeholder="Votre email" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Utilisé pour les rappels d'entretien (si activé)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <Separator className="my-2" />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-4 mb-2"
            >
              <Button
                variant="outline"
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full rounded-md border border-red-300 text-red-600 bg-white hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
              >
                <motion.span 
                  className="material-icons mr-2 text-red-500 group-hover:text-red-600"
                  whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  logout
                </motion.span>
                Se déconnecter
              </Button>
            </motion.div>
            
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Annuler
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200"
                disabled={profileForm.formState.isSubmitting}
              >
                <span className="material-icons mr-1 text-sm">
                  {profileForm.formState.isSubmitting ? "pending" : "save"}
                </span>
                {profileForm.formState.isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
            
            {/* Dialogue de confirmation de déconnexion */}
            <ConfirmDialog
              isOpen={logoutConfirmOpen}
              onClose={() => setLogoutConfirmOpen(false)}
              title="Se déconnecter"
              description="Êtes-vous sûr de vouloir vous déconnecter ?"
              confirmText="Se déconnecter"
              cancelText="Annuler"
              variant="destructive"
              onConfirm={() => {
                logoutMutation.mutate();
                setLogoutConfirmOpen(false);
                onOpenChange(false);
                navigate('/auth');
              }}
            />
          </form>
        </Form>
      </div>
    </StableDialog>
  );
}