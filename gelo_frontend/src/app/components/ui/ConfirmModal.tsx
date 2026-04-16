import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className={`h-1.5 w-full ${isDanger ? 'bg-rose-500' : 'bg-blue-500'}`} />
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {message}
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer ${
                isDanger 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                : 'bg-slate-900 hover:bg-black shadow-slate-200'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
