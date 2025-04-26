import { useEffect } from "react";
import { StableDialog } from "./StableDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import useNotifications from "@/hooks/useNotifications";
import useTasks from "@/hooks/useTasks";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    requestPermission,
    permission,
    addNotification,
  } = useNotifications();
  
  const tasksQuery = useTasks();
  const tasks = tasksQuery.data || [];
  const isTasksLoading = tasksQuery.isLoading;

  // Vérifier les notifications de tâches lorsque le dialogue s'ouvre
  useEffect(() => {
    if (open && tasks.length > 0 && !isTasksLoading) {
      // Vérifier les tâches dues aujourd'hui et créer des notifications
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueTasks = tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate.getTime() === today.getTime();
      });
      
      // Créer des notifications pour les tâches dues
      dueTasks.forEach(task => {
        // Éviter les notifications dupliquées
        const existingNotif = notifications.find(n => n.taskId === task.id);
        if (!existingNotif) {
          addNotification({
            title: 'Rappel d\'entretien',
            message: `N'oubliez pas : ${task.description}`,
            type: 'info',
            taskId: task.id,
          });
        }
      });
    }
  }, [open, tasks, isTasksLoading, addNotification, notifications]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffInDays === 0) {
      return "Aujourd'hui";
    } else if (diffInDays === 1) {
      return "Hier";
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return date.toLocaleDateString("fr-FR");
    }
  };

  const getNotificationIcon = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case "info":
        return <span className="material-icons text-primary">info</span>;
      case "warning":
        return <span className="material-icons text-orange-500">warning</span>;
      case "success":
        return <span className="material-icons text-green-500">check_circle</span>;
      default:
        return <span className="material-icons text-gray-500">notifications</span>;
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Afficher un message de succès ou créer des notifications tests
    }
  };

  return (
    <StableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2 text-primary-dark font-raleway text-xl">
          <span className="material-icons">notifications</span>
          Notifications
        </span>
      }
      description="Restez informé des besoins de vos plantes"
      className="sm:max-w-md border border-primary/20 shadow-xl bg-white"
      showCloseButton={true}
    >
      {permission !== 'granted' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <div className="flex items-start gap-2">
            <span className="material-icons text-yellow-500 text-lg mt-0.5">notifications_active</span>
            <div>
              <p className="text-yellow-800 mb-2">Activez les notifications pour ne jamais manquer un rappel d'entretien.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRequestPermission}
                className="text-xs py-1 h-auto"
              >
                Activer les notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="h-[300px] py-2">
        {notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-52 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <span className="material-icons text-3xl text-primary/40">notifications_none</span>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Aucune notification</h3>
            <p className="text-sm text-gray-500 max-w-xs">Vous recevrez des notifications concernant vos plantes et vos tâches d'entretien ici.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`
                  p-4 rounded-lg border border-gray-100 shadow-sm 
                  ${notification.read ? 'bg-white' : 'bg-green-50/50 border-green-100'} 
                  hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer
                `}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm text-gray-800">{notification.title}</h4>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                          {formatDate(notification.date)}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                          aria-label="Supprimer"
                        >
                          <span className="material-icons text-xs text-gray-500 hover:text-red-500">close</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    
                    {!notification.read && (
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-full">
                          Non lu
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="mt-4">
        <Separator className="mb-4" />
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          {notifications.length > 0 && (
            <div className="px-3 py-1 bg-primary/5 rounded-full text-xs font-medium text-primary">
              {notifications.filter(n => !n.read).length} non lu(s)
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 ml-auto">
            {notifications.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="rounded-full border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <span className="material-icons text-sm mr-1">mark_email_read</span>
                  Tout marquer comme lu
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearNotifications}
                  className="rounded-full text-gray-600 hover:bg-gray-100"
                >
                  <span className="material-icons text-sm mr-1">clear_all</span>
                  Effacer tout
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              <span className="material-icons text-sm mr-1">close</span>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </StableDialog>
  );
}