import { toast as sonnerToast } from "sonner";

export function useToast() {
  const toast = ({ title, description, variant }: {
    title?: string;
    description?: string;
    variant?: "default" | "success" | "error" | "destructive";
  }) => {
    if (variant === "error" || variant === "destructive") {
      sonnerToast.error(title, { description });
    } else if (variant === "success") {
      sonnerToast.success(title, { description });
    } else {
      sonnerToast(title, { description });
    }
  };

  return { toast };
}
