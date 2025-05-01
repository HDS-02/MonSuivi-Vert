import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordTokenPage() {
  const [params] = useParams();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await apiRequest("POST", "/api/verify-reset-token", { token: params.token });
        setIsValidToken(true);
      } catch (err) {
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [params.token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRequest("POST", "/api/update-password", {
        token: params.token,
        newPassword: data.newPassword
      });
      setIsSubmitted(true);
    } catch (err) {
      setError("Une erreur est survenue lors de la mise à jour du mot de passe.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="organic-bg min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="organic-bg min-h-screen flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <Card className="glass-card shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-primary-dark">Lien invalide</CardTitle>
              <CardDescription>
                Le lien de réinitialisation est invalide ou a expiré.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reset-password">
                <Button className="w-full">
                  Demander un nouveau lien
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="organic-bg min-h-screen flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <Card className="glass-card shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-primary-dark">Mot de passe mis à jour</CardTitle>
              <CardDescription>
                Votre mot de passe a été mis à jour avec succès.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full">
                  Se connecter
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="organic-bg min-h-screen flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <Card className="glass-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-primary-dark">Nouveau mot de passe</CardTitle>
            <CardDescription>
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-dark">Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Entrez votre nouveau mot de passe" 
                          className="input-glass focus:ring-2 ring-primary/30 transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-dark">Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirmez votre nouveau mot de passe" 
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
                      Mise à jour en cours...
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 