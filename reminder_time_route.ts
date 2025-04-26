  // Route pour mettre à jour l'heure de rappel d'arrosage d'une plante
  app.patch("/api/plants/:id/reminder-time", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const plantId = parseInt(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({ message: "ID de plante invalide" });
      }
      
      // Récupérer la plante existante
      const plant = await storage.getPlant(plantId);
      if (!plant) {
        return res.status(404).json({ message: "Plante non trouvée" });
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire de la plante
      if (req.user?.id !== plant.userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette plante" });
      }
      
      const { reminderTime } = req.body;
      
      // Validation simple du format heure (HH:MM)
      if (!reminderTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
        return res.status(400).json({ message: "Format d'heure invalide. Utilisez HH:MM" });
      }
      
      // Mettre à jour l'heure de rappel
      const updatedPlant = await storage.updatePlant(plantId, { 
        reminderTime 
      });
      
      if (!updatedPlant) {
        return res.status(404).json({ message: "Échec de la mise à jour" });
      }
      
      console.log(`Heure de rappel mise à jour pour la plante ${plantId} (${plant.name}): ${reminderTime}`);
      
      res.json({ 
        message: "Heure de rappel mise à jour avec succès",
        reminderTime: updatedPlant.reminderTime
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'heure de rappel:', error);
      res.status(500).json({ message: error.message });
    }
  });