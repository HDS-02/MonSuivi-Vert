import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRequest("POST", "/api/reset-password", data);
      setIsSubmitted(true);
    } catch (err) {
      setError("Une erreur est survenue lors de la réinitialisation du mot de passe.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="organic-bg min-h-screen flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <Card className="glass-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-primary-dark">Réinitialisation du mot de passe</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="text-green-600">
                  <span className="material-icons text-4xl">check_circle</span>
                </div>
                <p>
                  Un email a été envoyé à votre adresse avec les instructions pour réinitialiser votre mot de passe.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary-dark">Adresse email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Entrez votre adresse email" 
                            className="input-glass focus:ring-2 ring-primary/30 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-white mt-4 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le lien de réinitialisation"
                    )}
                  </Button>
                  <div className="text-center">
                    <Link href="/login" className="text-sm text-primary hover:text-primary-dark transition-colors">
                      Retour à la connexion
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 