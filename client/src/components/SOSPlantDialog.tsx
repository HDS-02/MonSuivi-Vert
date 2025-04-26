import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Plant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { StableDialog } from "./StableDialog";
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

// Schéma de validation pour le formulaire SOS
const sosDiagnosticSchema = z.object({
  lastWatering: z.string().min(1, { message: "Veuillez sélectionner une option" }),
  environment: z.object({
    directSunlight: z.boolean().default(false),
    brightIndirect: z.boolean().default(false),
    lowLight: z.boolean().default(false),
  }),
  temperature: z.string().min(1, { message: "Veuillez sélectionner une option" }),
  symptoms: z.object({
    yellowLeaves: z.boolean().default(false),
    brownSpots: z.boolean().default(false),
    droppingLeaves: z.boolean().default(false),
    dryLeaves: z.boolean().default(false),
    moldOrFungus: z.boolean().default(false),
    insects: z.boolean().default(false),
    slowGrowth: z.boolean().default(false),
    rootIssues: z.boolean().default(false),
  }),
  additionalNotes: z.string().optional(),
});

type SOSDiagnosticFormValues = z.infer<typeof sosDiagnosticSchema>;

interface SOSPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant;
}

export default function SOSPlantDialog({
  open,
  onOpenChange,
  plant,
}: SOSPlantDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  const form = useForm<SOSDiagnosticFormValues>({
    resolver: zodResolver(sosDiagnosticSchema),
    defaultValues: {
      lastWatering: "",
      environment: {
        directSunlight: false,
        brightIndirect: false,
        lowLight: false,
      },
      temperature: "",
      symptoms: {
        yellowLeaves: false,
        brownSpots: false,
        droppingLeaves: false,
        dryLeaves: false,
        moldOrFungus: false,
        insects: false,
        slowGrowth: false,
        rootIssues: false,
      },
      additionalNotes: "",
    },
  });

  const resetForm = () => {
    form.reset();
    setDiagnosis(null);
  };

  const onSubmit = async (data: SOSDiagnosticFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Envoi du diagnostic SOS pour la plante:", plant);
      console.log("Données formulaire:", data);

      // Envoyer les données à l'API
      const payload = {
        ...data,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
      };
      console.log("Payload complet:", payload);
      
      const response = await apiRequest("POST", `/api/plants/${plant.id}/sos-diagnostic`, payload);

      console.log("Réponse statut:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Erreur détaillée:", errorText);
        throw new Error("Une erreur est survenue lors de l'envoi du diagnostic");
      }

      const result = await response.json();
      console.log("Résultat du diagnostic:", result);
      
      // Afficher le résultat du diagnostic
      setDiagnosis(result.diagnosis);
      
      toast({
        title: "Diagnostic terminé",
        description: "Un diagnostic a été généré pour votre plante.",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du diagnostic:", error);
      
      // Afficher des détails plus spécifiques sur l'erreur
      let errorMessage = "Impossible d'obtenir un diagnostic pour votre plante pour le moment.";
      
      // Si c'est une erreur réseau
      if (error instanceof Error) {
        errorMessage += " Détails: " + error.message;
        console.log("Erreur complète:", JSON.stringify(error));
      }
      
      toast({
        title: "Erreur lors de la demande",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <StableDialog 
      open={open} 
      onOpenChange={handleOpenChange}
      title={
        <div className="flex items-center">
          <span className="material-icons text-red-500 mr-2">healing</span>
          SOS Assistance Plante
        </div>
      }
      description={`Obtenez un diagnostic et des conseils personnalisés pour votre ${plant.name}`}
    >
      <div className="p-4 max-h-[80vh] overflow-y-auto">
        {diagnosis ? (
          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              {/* En-tête du chat */}
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="material-icons text-primary">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-medium">Assistant Botanique</h3>
                  <p className="text-xs text-gray-500">Diagnostic de votre {plant.name}</p>
                </div>
              </div>
              
              {/* Message de l'IA comme un chat */}
              <div className="bg-primary/5 rounded-2xl rounded-tl-none p-4 max-w-[90%] ml-10 relative">
                <div className="absolute w-4 h-4 bg-primary/5 -left-2 top-0 rotate-45"></div>
                <div className="prose prose-sm max-w-none whitespace-pre-line">
                  {diagnosis.split('\n\n').map((paragraph, index) => (
                    <div key={index} className="mb-3">
                      {paragraph.startsWith('**') ? (
                        <h4 className="font-bold text-primary mt-0 mb-1">
                          {paragraph.replace(/\*\*/g, '')}
                        </h4>
                      ) : (
                        <p className="m-0">{paragraph}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setDiagnosis(null)}
                className="mr-auto"
              >
                Nouveau diagnostic
              </Button>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="lastWatering"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>À quand remonte le dernier arrosage ?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="yesterday">Hier</SelectItem>
                        <SelectItem value="few_days">Il y a 2-3 jours</SelectItem>
                        <SelectItem value="week">Il y a environ une semaine</SelectItem>
                        <SelectItem value="more_than_week">Il y a plus d'une semaine</SelectItem>
                        <SelectItem value="dont_remember">Je ne m'en souviens pas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Dans quel environnement lumineux est placée votre plante ?</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="environment.directSunlight"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Lumière directe / Soleil</FormLabel>
                          <FormDescription>
                            Exposée aux rayons directs du soleil
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="environment.brightIndirect"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Lumière indirecte</FormLabel>
                          <FormDescription>
                            Pièce lumineuse sans soleil direct
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="environment.lowLight"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Faible luminosité</FormLabel>
                          <FormDescription>
                            Pièce sombre ou éloignée des fenêtres
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quelle est la température autour de votre plante ?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="very_cold">Très froide (moins de 10°C)</SelectItem>
                        <SelectItem value="cold">Froide (10-15°C)</SelectItem>
                        <SelectItem value="cool">Fraîche (15-18°C)</SelectItem>
                        <SelectItem value="normal">Normale (18-24°C)</SelectItem>
                        <SelectItem value="warm">Chaude (24-30°C)</SelectItem>
                        <SelectItem value="hot">Très chaude (plus de 30°C)</SelectItem>
                        <SelectItem value="fluctuating">Fluctuante (variations importantes)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Quels symptômes observez-vous ? (sélectionnez tous ceux qui s'appliquent)</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symptoms.yellowLeaves"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Feuilles jaunissantes</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.brownSpots"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Taches brunes</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.droppingLeaves"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Feuilles tombantes</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.dryLeaves"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Feuilles sèches/croustillantes</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.moldOrFungus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Moisissure ou champignons</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.insects"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Présence d'insectes</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.slowGrowth"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Croissance lente/stagnante</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms.rootIssues"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Problèmes de racines</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes complémentaires (facultatif)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ajoutez d'autres observations ou détails sur l'état de votre plante..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Diagnostic en cours
                    </>
                  ) : (
                    "Diagnostiquer ma plante"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </StableDialog>
  );
}