// ui/Toast.tsx – Toast notification system dùng chung toàn app
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const VARIANTS = {
  success: {
    bg: "bg-white border-l-4 border-[#2a64ad]",
    icon: <CheckCircle2 className="w-5 h-5 text-[#2a64ad] flex-shrink-0" />,
    title: "text-slate-800",
    bar: "bg-[#2a64ad]",
  },
  error: {
    bg: "bg-white border-l-4 border-red-500",
    icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    title: "text-slate-800",
    bar: "bg-red-500",
  },
  warning: {
    bg: "bg-white border-l-4 border-amber-500",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    title: "text-slate-800",
    bar: "bg-amber-500",
  },
  info: {
    bg: "bg-white border-l-4 border-sky-500",
    icon: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />,
    title: "text-slate-800",
    bar: "bg-sky-500",
  },
};

function Toast({ toast, onRemove }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const duration = toast.duration ?? 4000;
  const v = VARIANTS[toast.type];

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl shadow-xl ${v.bg} px-4 py-4 w-80 max-w-[calc(100vw-2rem)] overflow-hidden transition-all duration-350 ease-out ${
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8"
      }`}
    >
      {/* Icon */}
      <div className="mt-0.5">{v.icon}</div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${v.title}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Close btn */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 350);
        }}
        className="ml-1 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100">
        <div
          className={`h-full ${v.bar} opacity-60`}
          style={{ animation: `shrink ${duration}ms linear forwards` }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── ToastContainer renders all active toasts ───────────────────────────────
interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
