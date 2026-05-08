import { ReactNode } from "react";
import { ToastContext } from "@/components/shared/ui/ToastContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/shared/ui/Toast";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, removeToast, toast } = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
