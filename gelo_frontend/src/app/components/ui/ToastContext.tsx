// ToastContext.tsx – Context để các component con gọi toast mà không cần prop drilling
import { createContext, useContext } from "react";

interface ToastContextValue {
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export const useToastContext = () => useContext(ToastContext);
