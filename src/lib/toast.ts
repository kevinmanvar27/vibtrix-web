import { toast as toastFunction } from "@/components/ui/use-toast";

export const toast = {
  success: (message: string) => {
    toastFunction({
      title: "Success",
      description: message,
      variant: "default",
    });
  },
  error: (message: string) => {
    toastFunction({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  },
  info: (message: string) => {
    toastFunction({
      title: "Info",
      description: message,
    });
  },
  warning: (message: string) => {
    toastFunction({
      title: "Warning",
      description: message,
    });
  },
};
