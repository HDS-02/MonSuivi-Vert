import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// Validation des formulaires
const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

const registerSchema = loginSchema.extend({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Adresse email invalide" }).optional(),
  invitationCode: z.string().min(1, { message: "Le code d'invitation est requis" })
    .refine(value => value === "MERCIVERT", { 
      message: "Code d'invitation invalide. Contactez l'équipe de l'application pour obtenir un code valide." 
    }),
  confirmPassword: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Formulaire de connexion
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Formulaire d'inscription
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      email: "",
      invitationCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  // Rediriger si déjà connecté
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="organic-bg min-h-screen flex items-center justify-center py-10 px-4">
      <div className="flex flex-col lg:flex-row w-full gap-8 max-w-6xl mx-auto bg-white/70 backdrop-blur-md p-6 lg:p-10 rounded-xl shadow-xl border border-gray-100/80">
        {/* Section de présentation */}
        <div className="lg:w-1/2 flex flex-col justify-center pr-0 lg:pr-8">
          <div className="mb-6">
            <h1 className="text-4xl font-raleway font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Mon Suivi Vert
            </h1>
            <p className="text-xl mt-2 text-gray-700">
              Votre assistant personnel pour prendre soin de vos plantes
            </p>
          </div>
          
          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-lg transition-all hover:bg-primary/10">
              <div className="bg-gradient-to-br from-primary to-primary-light p-2 rounded-full text-white shadow-sm">
                <span className="material-icons">eco</span>
              </div>
              <div>
                <h3 className="font-medium text-primary-dark">Ajout manuel intelligent</h3>
                <p className="text-muted-foreground text-sm">
                  Ajoutez facilement vos plantes avec auto-complétion des informations d'entretien
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-lg transition-all hover:bg-primary/10">
              <div className="bg-gradient-to-br from-primary to-primary-light p-2 rounded-full text-white shadow-sm">
                <span className="material-icons">notifications</span>
              </div>
              <div>
                <h3 className="font-medium text-primary-dark">Rappels d'entretien personnalisés</h3>
                <p className="text-muted-foreground text-sm">
                  Recevez des rappels pour l'arrosage, la fertilisation et autres soins essentiels
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-lg transition-all hover:bg-primary/10">
              <div className="bg-gradient-to-br from-primary to-primary-light p-2 rounded-full text-white shadow-sm">
                <span className="material-icons">emoji_events</span>
              </div>
              <div>
                <h3 className="font-medium text-primary-dark">Système de badges motivant</h3>
                <p className="text-muted-foreground text-sm">
                  Débloquez des badges en prenant soin de vos plantes et en développant votre collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaires */}
        <div className="lg:w-1/2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/50 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-light data-[state=active]:text-white">
                Connexion
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-light data-[state=active]:text-white">
                Inscription
              </TabsTrigger>
            </TabsList>

            {/* Formulaire de connexion */}
            <TabsContent value="login">
              <Card className="glass-card shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-primary-dark">Bienvenue</CardTitle>
                  <CardDescription>
                    Connectez-vous pour retrouver vos plantes et suivre leur santé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Nom d'utilisateur</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Entrez votre nom d'utilisateur" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Mot de passe</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Entrez votre mot de passe" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-right">
                        <a 
                          href="/reset-password" 
                          className="text-sm text-primary hover:text-primary-dark transition-colors"
                        >
                          Mot de passe oublié ?
                        </a>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary-light text-white mt-4 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="material-icons mr-2">login</span>
                            Se connecter
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center pt-0">
                  <p className="text-sm text-muted-foreground">
                    Pas encore de compte?{" "}
                    <Button
                      variant="link"
                      className="p-0 text-primary font-medium"
                      onClick={() => setActiveTab("register")}
                    >
                      Inscrivez-vous
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Formulaire d'inscription */}
            <TabsContent value="register">
              <Card className="glass-card shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-primary-dark">Créer un compte</CardTitle>
                  <CardDescription>
                    Rejoignez notre communauté et commencez à suivre vos plantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Nom d'utilisateur</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choisissez un nom d'utilisateur" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Prénom</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Entrez votre prénom" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Email (optionnel)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Entrez votre email" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="invitationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Code d'invitation</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Entrez votre code d'invitation" 
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 mt-1">
                              Le code d'invitation est fourni uniquement par l'équipe de l'application.
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Mot de passe</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Choisissez un mot de passe"
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary-dark">Confirmation du mot de passe</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirmez votre mot de passe"
                                className="input-glass focus:ring-2 ring-primary/30 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary-light text-white mt-4 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inscription en cours...
                          </>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="material-icons mr-2">person_add</span>
                            S'inscrire
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center pt-0">
                  <p className="text-sm text-muted-foreground">
                    Déjà un compte?{" "}
                    <Button
                      variant="link"
                      className="p-0 text-primary font-medium"
                      onClick={() => setActiveTab("login")}
                    >
                      Connectez-vous
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}