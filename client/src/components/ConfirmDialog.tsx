import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "default"
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass-card backdrop-blur-sm shadow-md border border-gray-100/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary-dark">{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border border-gray-200 hover:border-gray-300 transition-colors">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={variant === "destructive" 
              ? "bg-red-500 hover:bg-red-600 focus:ring-red-500" 
              : "bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}